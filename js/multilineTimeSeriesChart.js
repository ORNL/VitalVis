var multilineTimeSeriesChart = function() {
  var margin = {top: 20, right: 20, bottom: 30, left: 90},
  width = 900 - margin.left - margin.right,
  height = 120 - margin.top - margin.bottom,
  lineOpacity = 0.25,
  xValue = (d) => d.x,
  yValue = (d) => d.y,
  categoryValue = null,
  xAxisTitle = 'x',
  yAxisTitle = 'y',
  titleText = '',
  zeroBasedYAxis = true,
  strokeColor = 'steelblue'
  lineCurve = d3.curveMonotoneX,
  lineStrokeWidth = 1.,
  elapsedRange = 20.;

  let chartData = null;
  let svg;
  let g = null;
  let xScale = null;
  let yScale = null;
  let categoryColorScale = null;
  let yAxis = null;
  let xAxis = null;
  let categories = null;
  let visibleCategories = new Set();
  let xScaleIsTime = false;
  
  let line = d3.line()
    .curve(lineCurve)
    .x(function(d) { return xScale(xValue(d)); })
    .y(function(d) { return yScale(yValue(d)); });

  function chart (selection, data) {
    chartData = data;

    // create x and y axis scales
    if (xValue(chartData[0].values[0]) instanceof Date) {
      xScale = d3.scaleTime().range([0, width]);
      xScaleIsTime = true;
    } else {
      xScale = d3.scaleLinear().range([0,width]);
      xScaleIsTime = false;
    }

    if (!xScaleIsTime) {
      chartData.forEach((series) => {
        series.values = series.values.filter((d) => { return (xValue(d) >= -elapsedRange) && (xValue(d) <= elapsedRange); })
      });
      // chartData = chartData.filter((d) => { return (xValue(d) >= -30) && (xValue(d) <= 30); });
      // console.log(chartData);
    }

    setupXScaleDomain(chartData);
    yScale = d3.scaleLinear().range([height, 0]);
    setupYScaleDomain(chartData);
    
    // create category color scale
    getCategoriesFromData(chartData);

    // if (categoryValue) {
      // let categoryMap = d3.map(chartData, function(d) { return categoryValue(d); });
      // categories = categoryMap.keys();

      // categories.sort(function (a, b) {
      //   return categoryMap.get(a).values.length - categoryMap.get(b).values.length;
      // });

      // categories.forEach( (category) => {
      //   visibleCategories.add(category);
      // });
      // categoryColorScale = d3.scaleOrdinal(d3.schemeCategory10)
      //   .domain(categories);
    // }

    // create svg graphics
    svg = selection.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    // create translated graphics
    g = svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // create x axis
    xAxis = d3.axisBottom(xScale);

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        // .call(d3.axisBottom(xScale))
      .call(xAxis)
        .append("text")
          .attr("transform", "translate(" + (width/2) + ", " + (margin.bottom - 4) + ")")
          .style("text-anchor", "middle")
          .attr("fill", "#000")
          .style("font-weight", "bold")
          .text(xAxisTitle);
    g.select(".domain").remove();

    // create y axis
    yAxis = d3.axisLeft(yScale)
        .tickSize(-width)
        .tickPadding(10);

    g.append("g")
        .attr("class", "axis axis--y")
      .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr('y', -(margin.left - 4))
        .attr('x', -(height/2))
        .attr('dy', '1em')
        .attr('id', 'y-axis-title')
        .attr('text-anchor', 'middle')
        .style("font-weight", "bold")
        .attr("fill", "#000")
        .text(yAxisTitle);
    g.select(".domain").remove();
    
    // draw time series lines
    drawSeriesLines();

    g.append("line")
        .attr("stroke", "black")
        .attr("opacity", 0.5)
        .attr("x1", xScale(0))
        .attr("y1", -4)
        .attr("x2", xScale(0))
        .attr("y2", height+4);

    // create text for title
    g.append("text")
      .attr("x", 0)
      .attr("y", -(margin.top/2))
      .style("text-anchor", "start")
      .style("font-weight", "bold")
      .style("font-size", "12")
      .text(titleText);
    
    if (categoryValue) {
      let currentY = 15;
      const stepY = 10;
      categories.forEach((category) => {
        g.append("text")
          .attr("class", `toggle-${category}`)
          .attr("x", width - 10)
          .attr("y", currentY)
          .style("text-anchor", "end")
          .style("font-size", "10")
          .style("font-weight", "bold")
          .attr("fill", categoryColorScale(category))
          .text(category)
          .on("click", function() {toggleLines(category)})
          .on("mouseover", function() {d3.select(this).style("cursor", "pointer");})
          .on("mouseout", function() {d3.select(this).style("cursor", "default");});
        currentY = currentY + stepY;
      });
    }

    // make an embedded opacity slider for this chart
    let sliderScale = d3.scaleLinear()
      .domain([0.01, 1])
      .range([0, 50])
      .clamp(true);

    let slider = g.append("g")
      .attr("class", "slider")
      .attr("transform", "translate(" + (width - sliderScale.range()[1] - 4) + "," + -(margin.top/2) + ")");
    slider.append("title")
      .text("Line Opacity Slider");

    slider.append("line")
        .attr("class", "track")
        .attr("stroke", "#000")
        .attr("stroke-opacity", "0.3")
        .attr("stroke-width", "6px")
        .attr("stroke-linecap", "round")
        .attr("x1", sliderScale.range()[0])
        .attr("x2", sliderScale.range()[1])
      .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
        .attr("stroke", "#ddd")
        .attr("stroke-width", "4px")
        .attr("stroke-linecap", "round")
      .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .attr("pointer-events", "stroke")
        .attr("stroke-width", "20px")
        .attr("stroke", "transparent")
        .attr("cursor", "crosshair")
        .call(d3.drag()
          .on("start.interrupt", function() { slider.interrupt(); })
          .on("start drag", function() {
            sliderValue = sliderScale.invert(d3.event.x);
            handle.attr("cx", sliderScale(sliderValue));
            chart.lineOpacity(sliderValue);
          }));

    let handle = slider.insert("circle", ".track-overlay")
      .attr("class", "handle")
      .attr("fill", "#fff")
      .attr("stroke", "#000")
      .attr("stroke-opacity", "0.5")
      .attr("stroke-width", "1.25px")
      .attr("r", 5)
      .attr("cx", sliderScale(lineOpacity))

  }

  function getCategoriesFromData (data) {
    if (categoryValue) {
      let categoryMap = d3.map(chartData, function(d) { return categoryValue(d); });
      categories = categoryMap.keys();

      categories.sort(function (a, b) {
        return categoryMap.get(a).values.length - categoryMap.get(b).values.length;
      });

      categories.forEach( (category) => {
        visibleCategories.add(category);
      });
      categoryColorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(categories);
    }
  }

  function setupXScaleDomain(data) {
    let xMax = d3.max(data, function(series) {
      return d3.max(series.values, function(value) {
        return xValue(value);
      })
    });
    let xMin = d3.min(data, function(series) {
      return d3.min(series.values, function(value) {
        return xValue(value);
      })
    });
    if (!xScaleIsTime && xMin > 0) {
      xMin = 0;
    }

    // let xMin;
    // if (xScaleIsTime) {
    //   xMin = d3.min(data, function(series) {
    //     return d3.min(series.values, function(value) {
    //       return xValue(value);
    //     })
    //   });
    // } else {
    //   xMin = 0;
    // }
    xScale.domain([xMin, xMax]);
  }

  function setupYScaleDomain(data) {
    var yMax = d3.max(data, function(series) {
      return d3.max(series.values, function(value) {
        return yValue(value);
      })
    });
    let yMin = 0.;
    if (!zeroBasedYAxis) {
      yMin = d3.min(data, function(series) {
        return d3.min(series.values, function(value) {
          return yValue(value);
        })
      });
    }
    yScale.domain([yMin, yMax]).nice();
  }

  function toggleLines(category) {
    if (visibleCategories.has(category)) {
      visibleCategories.delete(category);
      g.select(`.toggle-${category}`)
        .attr("fill", "lightgray");
    } else {
      visibleCategories.add(category);
      g.select(`.toggle-${category}`)
        .attr("fill", categoryColorScale(category));
    }
    drawSeriesLines();
  }

  function drawSeriesLines() {
    g.selectAll(".series").remove();

    let filteredChartData;

    if (categoryValue) {
      filteredChartData = chartData.filter((d) => {
        if (visibleCategories.has(categoryValue(d))) {
          return true;
        }
        return false;
      });

      filteredChartData.sort(function(a, b) {
        return categories.indexOf(categoryValue(b)) - categories.indexOf(categoryValue(a));
      });
    } else {
      filteredChartData = chartData;
    }

    setupYScaleDomain(filteredChartData);
    g.select(".axis--y")
      .transition()
      .duration(1000)
      // .call(customYAxis);
      .call(yAxis);
    g.select(".domain").remove();
    g.selectAll(".tick line").attr('opacity', 0.1);

    setupXScaleDomain(filteredChartData);
    g.select(".axis--x")
      .transition()
      .duration(1000)
      .call(xAxis);
    g.select(".domain").remove();
    g.selectAll(".tick line").attr('opacity', 0.1);
    
    var series = g.selectAll(".series")
      .data(filteredChartData)
      .enter().append("g")
        .attr("class", "series")
        // .attr('stroke', 'steelblue')
        .attr('stroke-width', `${lineStrokeWidth}px`)
        .attr('fill', 'none');

    series.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      // .attr("stroke", function(d) {return d.hasAlarm ? alarmStroke : nonalarmStroke})
      .attr("stroke", function(d) { 
        if (categoryValue) {
          return categoryColorScale(categoryValue(d));
        } else {
          return strokeColor;
        }
      })
      .attr("stroke-opacity", lineOpacity);
  }

  chart.elapsedRange = function (value) {
    if (!arguments.length) {
      return elapsedRange;
    }

    elapsedRange = value;
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
    return chart;
  }

  chart.width = function(value) {
    if (!arguments.length) {
      return width;
    }
    width = value - margin.left - margin.right;
    if (g != null) {
      drawSeriesLines();
    }
    return chart;
  }

  chart.height = function(value) {
    if (!arguments.length) {
      return height;
    }
    height = value  - margin.top - margin.bottom;
    if (g != null) {
      drawSeriesLines();
    }
    return chart;
  }

  chart.titleText = function(value) {
    if (!arguments.length) {
      return titleText;
    }
    titleText = value;
    return chart
  }

  chart.xAxisTitle = function(value) {
    if (!arguments.length) {
      return xAxisTitle;
    }
    xAxisTitle = value;
    return chart
  }

  chart.yAxisTitle = function(value) {
    if (!arguments.length) {
      return yAxisTitle;
    }
    yAxisTitle = value;

    if (g != null) {
      g.select("#y-axis-title")
        .text(yAxisTitle);
    }

    return chart
  }

  chart.lineOpacity = function(value) {
    if (!arguments.length) {
      return lineOpacity;
    }
    lineOpacity = value;
    
    if (g != null) {
      g.selectAll(".line").style("stroke-opacity", lineOpacity);
    // g.selectAll('.line').style("stroke-opacity", lineOpacity);
    }
    
    return chart;
  }

  chart.chartData = function(value) {
    if (!arguments.length) {
      return chartData;
    }
    chartData = value;

    if (g != null) {
      getCategoriesFromData(chartData);
      drawSeriesLines();
    }

    return chart;
  }

  chart.zeroBasedYAxis = function(value) {
    if (!arguments.length) {
      return zeroBasedYAxis;
    }
    zeroBasedYAxis = value;

    if (g != null) {
      drawSeriesLines();
    }
    return chart;
  }

  chart.lineCurve = function(value) {
    if (!arguments.length) {
      return lineCurve;
    }
    lineCurve = value;

    line = d3.line()
        .curve(lineCurve)
        .x(function(d) { return xScale(xValue(d)); })
        .y(function(d) { return yScale(yValue(d)); });

    if (g) {
      console.log("Should be redrawing lines now");
      drawSeriesLines();
    }
    return chart;
  }

  chart.xValue = function (value) {
    if (!arguments.length) {
      return xValue;
    }
    xValue = value;

    if (g != null) {
      drawSeriesLines();
    }

    return chart;
  }

  chart.yValue = function (value) {
    if (!arguments.length) {
      return yValue;
    }
    yValue = value;

    if (g != null) {
      drawSeriesLines();
    }

    return chart;
  }

  chart.categoryValue = function (value) {
    if (!arguments.length) {
      return categoryValue;
    }
    categoryValue = value;

    if (g != null) {
      drawSeriesLines();
    }

    return chart;
  }

  return chart;
}
