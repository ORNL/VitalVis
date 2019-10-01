var timeEventChart = function () {
  let margin = {
      top: 20,
      right: 20,
      bottom: 30,
      left: 60
    },
    width = 900 - margin.left - margin.right,
    height = 120 - margin.top - margin.bottom,
    titleText,
    dateValue,
    dateExtent,
    eventCategory,
    eventSubCategory,
    // dateValue = function (d) {
    //   return d.dateValue;
    // },
    // eventCategory = function (d) {
    //   return d.yValue;
    // },
    // curveFunction = d3.curveMonotoneX,
    zoomedHandler,
    // highValue,
    // lowValue,
    showPoints = false,
    // showLine = true,
    pointColor = d3.rgb(30,30,30,0.4)
    // rangeFillColor = "#c6dbef";
    panBuffer = 80,
    zoomWithWheel = true;

  let chartData;
  let chartDiv;
  let svg;
  let g;
  let xScale;
  let yScale;
  let xAxis;
  let yAxis;
  let categories;
  let chartID;

  // let line = d3.line()
  //   .curve(curveFunction)
  //   .x(function(d) { return xScale(dateValue(d)); })
  //   .y(function(d) { return yScale(yValue(d)); });

  // let rangeArea = d3.area()
  //   .curve(curveFunction)
  //   .x(function(d) { return xScale(dateValue(d)); })
  //   .y0(function(d) { return yScale(lowValue(d)); })
  //   .y1(function(d) { return yScale(highValue(d)); });

  const zoom = d3.zoom()
    .scaleExtent([1, Infinity])
    // .translateExtent([[0,0], [width, height]])
    .translateExtent([[-panBuffer,-panBuffer], [width+panBuffer, height+panBuffer]])
    .extent([[0,0], [width, height]])
    .on("zoom", zoomed);

  function zoomed() {
    var t = d3.event.transform;
    var xt = t.rescaleX(xScale);
    // var yt = yScale;

    // if (showLine) {
    //   svg.selectAll(".line")
    //     // .transition()
    //     // .duration(1000)
    //     .attr("d", d3.line()
    //       .curve(curveFunction)
    //       .x(function(d) { return xt(dateValue(d)); })
    //       .y(function(d) { return yt(yValue(d)); }));
    // }

    // if (lowValue && highValue) {
    //   svg.selectAll(".range")
    //     .attr("d", d3.area()
    //       .curve(curveFunction)
    //       .x(function(d) { return xt(dateValue(d)); })
    //       .y0(function(d) { return yt(lowValue(d)); })
    //       .y1(function(d) { return yt(highValue(d)); })
    //     );
    // }

    // if (showPoints) {
    //   svg.selectAll("circle")
    //     .attr("cx", function(d) { return xt(dateValue(d)); })
    //     .attr("cy", function(d) { return yt(yValue(d)); });
    // }
    svg.selectAll(".event")
      .attr("x", function(d) { 
        return xt(dateValue(d)); 
      });

    g.select(".axis--x").call(xAxis.scale(xt));
    // g.select(".axis--y").call(yAxis.scale(yt));
    g.select(".domain").remove();

    if (zoomedHandler) {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') {
        return;
      }
      zoomedHandler(t);
    }
  }

  const ID = function () {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return '_' + Math.random().toString(36).substr(2, 9);
  };


  const tooltipText = (d) => {
    let str = new String();
    let counter = 0;
    for (const property in d) {
      if (d.hasOwnProperty(property)) {
        // if (d[property] != 'NULL' && d[property].length > 0) {
          str = str + property + ": " + d[property];
          if (counter+1 < Object.keys(d).length) {
            str = str + '\n';
          }
        // }
      }
      counter += 1;
    }
    return str;
  }

  function chart(selection, data) {
    chartData = data;
    chartDiv = selection;

    chartID = ID();

    // console.log(eventCategory(chartData[0]));
    categories = d3.map(chartData, (d) => eventCategory(d)).keys();
    // console.log(categories);
    
    if (!dateExtent) {
      dateExtent = d3.extent(chartData, dateValue)
    }
    drawChart();
  }

  function drawChart() {
    if (chartDiv) {
      if (svg) {
        svg.selectAll('*').remove();
        svg
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom);
      } else {
        svg = chartDiv.append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom);
      }
      
      g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      g.append("clipPath")
          .attr("id", `clip_${chartID}`)
          // .attr("id", "clip")
        .append("rect")
          .attr("width", width)
          .attr("height", height);

      xScale = d3.scaleTime()
        .domain(dateExtent)
        // .domain(d3.extent(chartData, dateValue))
        .range([0, width])
        .nice();

      categoryScale = d3.scalePoint().range([height, 0]).padding(1);
      categoryScale.domain(categories);

      let colorScale = d3.scaleOrdinal().domain(categories).range(d3.schemeTableau10);
                      
      categories.forEach(function (category, i) {
        categoryData = chartData.filter((d) => {
          return eventCategory(d) === category;
        });
        g.selectAll("event")
            .data(categoryData)
          .enter()
            .append("rect")
            .attr("class", "event")
            .attr("clip-path", `url(#clip_${chartID})`)
            .attr("rx", 2)
            .attr("x", function (d) { return xScale(dateValue(d)); })
            .attr("y", function (d) { return categoryScale(eventCategory(d)); })
            .attr("height", 7)
            .attr("width", 7)
            .attr("transform", 'translate(' + -7/2. + ',' + -7/2. + ')')
            .attr("fill", colorScale(category))
            .attr("opacity", 0.6)
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .append("title")
              .text((d) => {
                return tooltipText(d);
              });
      });

      yAxis = d3.axisLeft(categoryScale)
        .tickSize(-width);
      g.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis);
      g.selectAll(".tick line").attr('opacity', 0.15);

      xAxis = d3.axisBottom(xScale);
      g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
      g.selectAll(".domain").remove();

      if (titleText) {
        g.append("text")
          .attr("x", 0)
          .attr("y", -10)
          .style("text-anchor", "start")
          .style("font-weight", "bold")
          .style("font-size", 12)
          .text(titleText);
      }

      // svg.call(zoom);
      if (zoomWithWheel) {
        svg.call(zoom);
      } else {
        svg.call(zoom)
          .on("wheel.zoom", null);
      }
    }
  }

  function resizeChart() {
    drawChart();
  }

  chart.zoomWithWheel = function (value) {
    if (!arguments.length) {
      return zoomWithWheel;
    }
    zoomWithWheel = value;
    return chart;
  }

  chart.applyTransform = function (newTransform) {
    if (svg) {
      zoom.transform(svg, newTransform);
    }
  }

  chart.resetZoom = function () {
    if (svg) {
      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
    }
  }

  chart.zoomedHandler = function (value) {
    if (!arguments.length) {
      return zoomedHandler;
    }
    zoomedHandler = value;
    return chart;
  }

  chart.margin = function (value) {
    if (!arguments.length) {
      return margin;
    }
    oldChartWidth = width + margin.left + margin.right
    oldChartHeight = height + margin.top + margin.bottom
    margin = value;
    width = oldChartWidth - margin.left - margin.right
    height = oldChartHeight - margin.top - margin.bottom
    resizeChart();
    return chart;
  }

  chart.dateExtent = function (value) {
    if (!arguments.length) {
      return dateExtent;
    }
    dateExtent = value;
    if (svg) {
      drawChart();
    } 
    return chart;
  }

  chart.dateValue = function (value) {
    if (!arguments.length) {
      return dateValue;
    }
    dateValue = value;
    if (svg) {
      drawChart();
    }
    return chart;
  }

  chart.showPoints = function (value) {
    if (!arguments.length) {
      return showPoints;
    }
    showPoints = value;
    if (svg) {
      drawChart();
    }
    return chart;
  }

  chart.eventCategory = function (value) {
    if (!arguments.length) {
      return eventCategory;
    }
    eventCategory = value;
    if (svg) {
      drawChart();
    }
    return chart;
  }

  chart.eventSubCategory = function (value) {
    if (!arguments.length) {
      return eventSubCategory;
    }
    eventSubCategory = value;
    if (svg) {
      drawChart();
    }
    return chart;
  }

  chart.width = function (value) {
    if (!arguments.length) {
      return width;
    }
    width = value - margin.left - margin.right;
    if (svg) {
      resizeChart();
    }
    return chart;
  }

  chart.height = function (value) {
    if (!arguments.length) {
      return height;
    }
    height = value - margin.top - margin.bottom;
    if (svg) {
      resizeChart();
    }
    return chart;
  }

  chart.titleText = function (value) {
    if (!arguments.length) {
      return titleText;
    }
    titleText = value;
    return chart
  }

  return chart;
}