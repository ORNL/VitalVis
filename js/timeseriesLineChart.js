var timeseriesLineChart = function () {
  let margin = {
      top: 20,
      right: 20,
      bottom: 30,
      left: 60
    },
    width = 900 - margin.left - margin.right,
    height = 120 - margin.top - margin.bottom,
    titleText,
    dateExtent,
    dateValue = function (d) {
      return d.dateValue;
    },
    yValue = function (d) {
      return d.yValue;
    },
    curveFunction = d3.curveMonotoneX,
    zoomedHandler,
    highValue,
    lowValue,
    showPoints = false,
    showLine = true,
    pointColor = d3.rgb(30,30,30,0.4),
    rangeFillColor = "#c6dbef",
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
  let chartID;

  let line = d3.line()
    .curve(curveFunction)
    .x(function(d) { return xScale(dateValue(d)); })
    .y(function(d) { return yScale(yValue(d)); });

  let rangeArea = d3.area()
    .curve(curveFunction)
    .x(function(d) { return xScale(dateValue(d)); })
    .y0(function(d) { return yScale(lowValue(d)); })
    .y1(function(d) { return yScale(highValue(d)); });

  const zoom = d3.zoom()
    .scaleExtent([1, Infinity])
    .translateExtent([[-panBuffer,-panBuffer], [width+panBuffer, height+panBuffer]])
    .extent([[0,0], [width, height]])
    .on("zoom", zoomed);

  function zoomed() {
    var t = d3.event.transform;
    var xt = t.rescaleX(xScale);
    // var yt = yScale;

    if (showLine) {
      svg.selectAll(".line")
        .attr("d", d3.line()
          .curve(curveFunction)
          .x(function(d) { return xt(dateValue(d)); })
          .y(function(d) { return yScale(yValue(d)); }));
    }

    if (lowValue && highValue) {
      svg.selectAll(".range")
        .attr("d", d3.area()
          .curve(curveFunction)
          .x(function(d) { return xt(dateValue(d)); })
          .y0(function(d) { return yScale(lowValue(d)); })
          .y1(function(d) { return yScale(highValue(d)); })
        );
    }

    if (showPoints) {
      svg.selectAll("circle")
        .attr("cx", function(d) { return xt(dateValue(d)); })
        .attr("cy", function(d) { return yScale(yValue(d)); });
    }

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


  function chart(selection, data) {
    chartData = data;
    chartDiv = selection;
    chartID = ID();
    
    if (!dateExtent) {
      dateExtent = d3.extent(chartData, (d) => dateValue(d));
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
        .append("rect")
          .attr("x", 0)
          .attr("y", -2)
          .attr("width", width)
          .attr("height", height+2);

      xScale = d3.scaleTime()
        .domain(dateExtent)
        // .domain(d3.extent(chartData, dateValue))
        .range([0, width])
        .nice();
      // console.log(dateExtent);

      let yExtent;
      if (lowValue && highValue) {
        let min = d3.min(chartData, (d) => { return lowValue(d) < yValue(d) ? lowValue(d) : yValue(d); });
        let max = d3.max(chartData, (d) => { return highValue(d) > yValue(d) ? highValue(d) : yValue(d); });
        yExtent = [min, max];
      } else {
        yExtent = d3.extent(chartData, yValue);  
      }
      // yExtent = d3.extent(chartData, yValue);
      // if (yExtent[0] > 0) {
      //   yExtent[0] = 0;
      // }
      // console.log(yExtent);
      yScale = d3.scaleLinear()
        .domain(yExtent)
        .range([height, 0])
        .nice();

      if (lowValue && highValue) {
        g.append("path")
          .datum(chartData)
        .attr("class", "range")
          .attr("fill", rangeFillColor)
          .attr("d", rangeArea)
          .attr("clip-path", `url(#clip_${chartID})`);
          // .attr("clip-path", "url(#clip)");
      }

      if (showLine) {
        g.append("path")
          .datum(chartData)
        .attr("class", "line")
          .attr("d", line)
          .attr("clip-path", `url(#clip_${chartID})`)
          // .attr("clip-path", "url(#clip)")
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-linejoin", "round")
          .attr("stroke-width", "1px");
      }

      if (showPoints) {
        g.selectAll("dot")
          .data(chartData)
        .enter().append("circle")
          .attr("clip-path", `url(#clip_${chartID})`)
          // .attr("clip-path", "url(#clip)")
          .attr("r", 1.5)
          .attr("fill", pointColor)
          .attr("stroke", "none")
          .attr("cx", function(d) { return xScale(dateValue(d)); })
          .attr("cy", function(d) { return yScale(yValue(d)); });
      }

      yAxis = d3.axisLeft(yScale)
        .tickSize(-width)
        .ticks(6)
        .tickPadding(10);

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

  chart.showLine = function (value) {
    if (!arguments.length) {
      return showLine;
    }
    showLine = value;
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

  chart.curveFunction = function (value) {
    if (!arguments.length) {
      return curveFunction;
    }
    curveFunction = value;
    
      line = d3.line()
        .curve(curveFunction)
        .x(function(d) { return xScale(dateValue(d)); })
        .y(function(d) { return yScale(yValue(d)); });
      rangeArea = d3.area()
        .curve(curveFunction)
        .x(function(d) { return xScale(dateValue(d)); })
        .y0(function(d) { return yScale(lowValue(d)); })
        .y1(function(d) { return yScale(highValue(d)); });
    if (svg) {
      drawChart();
    }
    return chart;
  }

  chart.yValue = function (value) {
    if (!arguments.length) {
      return yValue;
    }
    yValue = value;
    if (svg) {
      drawChart();
    }
    return chart;
  }

  chart.lowValue = function (value) {
    if (!arguments.length) {
      return lowValue;
    }
    lowValue = value;
    if (svg) {
      drawChart();
    }
    return chart;
  }

  chart.highValue = function (value) {
    if (!arguments.length) {
      return highValue;
    }
    highValue = value;
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