var eventOffsetLineChart = function () {
  let margin = {
      top: 24,
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
    outerRangeMaxValue,
    outerRangeMinValue,
    innerRangeMaxValue,
    innerRangeMinValue,
    // highValue,
    // lowValue,
    showPoints = false,
    showLine = true,
    pointColor = d3.rgb(30,30,30,0.4),
    outerRangeFill = "#c6dbef",
    innerRangeFill = "#9ecae1",
    panBuffer = 80,
    zoomWithWheel = true,
    events,
    eventText;

  let chartData;
  let chartDiv;
  let svg;
  let g;
  let xScale;
  let yScale;
  let xAxis;
  let yAxis;
  let chartID;


  // const zoom = d3.zoom()
  //   .scaleExtent([1, Infinity])
  //   .translateExtent([[-panBuffer,-panBuffer], [width+panBuffer, height+panBuffer]])
  //   .extent([[0,0], [width, height]])
  //   .on("zoom", zoomed);

  // function zoomed() {
  //   var t = d3.event.transform;
  //   var xt = t.rescaleX(xScale);
  //   // var yt = yScale;

  //   if (showLine) {
  //     svg.selectAll(".line")
  //       .attr("d", d3.line()
  //         .curve(curveFunction)
  //         .x(function(d) { return xt(dateValue(d)); })
  //         .y(function(d) { return yScale(yValue(d)); }));
  //   }

  //   if (innerRangeMaxValue && innerRangeMinValue) {
  //     svg.selectAll(".range")
  //       .attr("d", d3.area()
  //         .curve(curveFunction)
  //         .x(function(d) { return xt(dateValue(d)); })
  //         .y0(function(d) { return yScale(innerRangeMinValue(d)); })
  //         .y1(function(d) { return yScale(innerRangeMaxValue(d)); })
  //       );
  //   }

  //   if (showPoints) {
  //     svg.selectAll("circle")
  //       .attr("cx", function(d) { return xt(dateValue(d)); })
  //       .attr("cy", function(d) { return yScale(yValue(d)); });
  //   }

  //   g.select(".axis--x").call(xAxis.scale(xt));
  //   // g.select(".axis--y").call(yAxis.scale(yt));
  //   g.select(".domain").remove();

  //   if (zoomedHandler) {
  //     if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') {
  //       return;
  //     }
  //     zoomedHandler(t);
  //   }
  // }

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

      let line = d3.line()
        .curve(curveFunction)
        .x(function(d) { return xScale(dateValue(d)); })
        .y(function(d) { return yScale(yValue(d)); });

      let innerRangeArea = d3.area()
        .curve(curveFunction)
        .x(function(d) { return xScale(dateValue(d)); })
        .y0(function(d) { return yScale(innerRangeMinValue(d)); })
        .y1(function(d) { return yScale(innerRangeMaxValue(d)); });

      let innerRangeMinLine = d3.line()
        .curve(curveFunction)
        .x(function(d) { return xScale(dateValue(d)); })
        .y(function(d) { return yScale(innerRangeMinValue(d)); });

      let innerRangeMaxLine = d3.line()
        .curve(curveFunction)
        .x(function(d) { return xScale(dateValue(d)); })
        .y(function(d) { return yScale(innerRangeMaxValue(d)); });

      let outerRangeArea = d3.area()
        .curve(curveFunction)
        .x(function(d) { return xScale(dateValue(d)); })
        .y0(function(d) { return yScale(outerRangeMinValue(d)); })
        .y1(function(d) { return yScale(outerRangeMaxValue(d)); });

      let outerRangeMinLine = d3.line()
        .curve(curveFunction)
        .x(function(d) { return xScale(dateValue(d)); })
        .y(function(d) { return yScale(outerRangeMinValue(d)); });

      let outerRangeMaxLine = d3.line()
        .curve(curveFunction)
        .x(function(d) { return xScale(dateValue(d)); })
        .y(function(d) { return yScale(outerRangeMaxValue(d)); });
        
      
      g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      // g.append("clipPath")
      //     .attr("id", `clip_${chartID}`)
      //   .append("rect")
      //     .attr("x", 0)
      //     .attr("y", -4)
      //     .attr("width", width)
      //     .attr("height", height+10);

      // console.log(dateExtent);
      // console.log(titleText);
      xScale = d3.scaleLinear()
        .domain(dateExtent)
        .range([0, width])
        .nice();
      // xScale = d3.scaleTime()
      //   .domain(dateExtent)
      //   // .domain(d3.extent(chartData, dateValue))
      //   .range([0, width])
      //   .nice();
      // // console.log(dateExtent);

      let yExtent = [];
      yExtent[0] = d3.min(chartData, d => {
        let minValue = yValue(d);
        if (outerRangeMinValue) { minValue = outerRangeMinValue(d) < minValue ? outerRangeMinValue(d) : minValue; }
        if (innerRangeMinValue) { minValue = innerRangeMinValue(d) < minValue ? innerRangeMinValue(d) : minValue; }
        return minValue;
        // let values = [yValue(d)];
        // if (outerRangeMinValue) { values.push(outerRangeMinValue(d)); }
        // if (innerRangeMinValue) { values.push(innerRangeMinValue(d)); }
        // return Math.min(values);
      });

      yExtent[1] = d3.max(chartData, d => {
        let maxValue = yValue(d);
        if (outerRangeMinValue) { maxValue = outerRangeMaxValue(d) > maxValue ? outerRangeMaxValue(d) : maxValue; }
        if (innerRangeMinValue) { maxValue = innerRangeMaxValue(d) > maxValue ? innerRangeMaxValue(d) : maxValue; }
        return maxValue;
      });
      // let yExtent;
      // if (lowValue && highValue) {
      //   let min = d3.min(chartData, (d) => { return lowValue(d) < yValue(d) ? lowValue(d) : yValue(d); });
      //   let max = d3.max(chartData, (d) => { return highValue(d) > yValue(d) ? highValue(d) : yValue(d); });
      //   yExtent = [min, max];
      // } else {
      //   yExtent = d3.extent(chartData, yValue);  
      // }
      // yExtent = d3.extent(chartData, yValue);
      // if (yExtent[0] > 0) {
      //   yExtent[0] = 0;
      // }
      // console.log(yExtent);

      yScale = d3.scaleLinear()
        .domain(yExtent)
        .range([height, 0])
        .nice();

      if (outerRangeMinValue && outerRangeMaxValue) {
        g.append("path")
          .datum(chartData)
        .attr("class", "range")
          .attr("fill", outerRangeFill)
          .attr("d", outerRangeArea);
          // .attr("clip-path", `url(#clip_${chartID})`);
          // .attr("clip-path", "url(#clip)");

        g.append("path")
          .datum(chartData)
        .attr("class", "line")
          .attr("d", outerRangeMinLine)
          .attr("fill", "none")
          .attr("stroke", "darkgray")
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", "1px");

        g.append("path")
          .datum(chartData)
        .attr("class", "line")
          .attr("d", outerRangeMaxLine)
          .attr("fill", "none")
          .attr("stroke", "darkgray")
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", "1px");
      }

      if (innerRangeMinValue && innerRangeMaxValue) {
        g.append("path")
          .datum(chartData)
        .attr("class", "range")
          .attr("fill", innerRangeFill)
          .attr("d", innerRangeArea);
          // .attr("clip-path", `url(#clip_${chartID})`);
          // .attr("clip-path", "url(#clip)");

        g.append("path")
          .datum(chartData)
        .attr("class", "line")
          .attr("d", innerRangeMinLine)
          .attr("fill", "none")
          .attr("stroke", "darkgray")
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", "1px");

        g.append("path")
          .datum(chartData)
        .attr("class", "line")
          .attr("d", innerRangeMaxLine)
          .attr("fill", "none")
          .attr("stroke", "darkgray")
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", "1px");
      }
      
      if (events) {
        let eventColorScale = d3.scaleSequential(d3.interpolateOrRd).domain(d3.extent(events, d => d.length));
        g.selectAll("eventBins")
          .data(events)
        .enter().append("rect")
          // .attr("fill", "#1E8449")
          .attr("fill", d => d.length > 0 ? eventColorScale(d.length) : "lightgray")
          .attr("stroke", "darkgray")
          .attr("x", d => xScale(d.x0))
          .attr("width", d => xScale(d.x1) - xScale(d.x0))
          .attr("y", -13)
          .attr("height", 8)
          .append("title")
            .text(d => `Secondary Event Count: ${d.length}`);

        // console.log('will add events');
        // console.log(events);
        // g.append("rect")
        //   .attr("x", 0)
        //   .attr("y", height+2)
        //   .attr("width", width)
        //   .attr("height", 12)
        //   .attr("fill", "silver")
        //   .attr("stroke", "none");

        // g.selectAll("eventLine")
        //   .data(events)
        // .enter().append("line")
        //   .attr("stroke", "#1E8449")
        //   .attr("stroke-width", 1.5)
        //   // .attr("stroke-linecap", "round")
        //   .attr("opacity", 0.15)
        //   .attr("x1", d => xScale(dateValue(d)))
        //   .attr("y1", -10)
        //   .attr("x2", d => xScale(dateValue(d)))
        //   .attr("y2", -2);
      }


      g.append("line")
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("stroke-linecap", "round")
        // .attr("opacity", 0.35)
        .attr("x1", xScale(0))
        .attr("y1", -12)
        .attr("x2", xScale(0))
        .attr("y2", height);

      if (showLine) {
        g.append("path")
          .datum(chartData)
        .attr("class", "line")
          .attr("d", line)
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", "1px");
      }

      if (showPoints) {
        g.selectAll("dot")
          .data(chartData)
        .enter().append("circle")
          // .attr("clip-path", `url(#clip_${chartID})`)
          // .attr("clip-path", "url(#clip)")
          .attr("r", 3)
          .attr("fill", pointColor)
          .attr("stroke", "none")
          .attr("cx", function(d) { return xScale(dateValue(d)); })
          .attr("cy", function(d) { return yScale(yValue(d)); })
          .append("title")
            .text(d => `Time: ${dateValue(d)}\nValue: ${yValue(d)}`);
      }

      yAxis = d3.axisLeft(yScale)
        .tickSize(-width)
        .ticks(6)
        .tickPadding(8);

      g.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis);
      g.selectAll(".tick line").attr('opacity', 0.15);
      g.selectAll(".domain").remove();

      xAxis = d3.axisBottom(xScale);
      g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + (height) + ")")
        .call(xAxis);
      // g.selectAll(".domain").attr('opacity', 0.15);

      if (titleText) {
        g.append("text")
          .attr("x", 0)
          .attr("y", -18)
          .style("text-anchor", "start")
          .style("font-weight", "bold")
          .style("font-size", 12)
          .text(titleText);
      }

      // if (zoomWithWheel) {
      //   svg.call(zoom);
      // } else {
      //   svg.call(zoom)
      //     .on("wheel.zoom", null);
      // }
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
    
    //   line = d3.line()
    //     .curve(curveFunction)
    //     .x(function(d) { return xScale(dateValue(d)); })
    //     .y(function(d) { return yScale(yValue(d)); });
    //   rangeArea = d3.area()
    //     .curve(curveFunction)
    //     .x(function(d) { return xScale(dateValue(d)); })
    //     .y0(function(d) { return yScale(lowValue(d)); })
    //     .y1(function(d) { return yScale(highValue(d)); });
    // if (svg) {
    //   drawChart();
    // }
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

  chart.outerRangeMinValue = function (value) {
    if (!arguments.length) {
      return outerRangeMinValue;
    }
    outerRangeMinValue = value;
    return chart;
  }

  chart.outerRangeMaxValue = function (value) {
    if (!arguments.length) {
      return outerRangeMaxValue;
    }
    outerRangeMaxValue = value;
    return chart;
  }

  chart.innerRangeMinValue = function (value) {
    if (!arguments.length) {
      return innerRangeMinValue;
    }
    innerRangeMinValue = value;
    return chart;
  }

  chart.innerRangeMaxValue = function (value) {
    if (!arguments.length) {
      return innerRangeMaxValue;
    }
    innerRangeMaxValue = value;
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

  chart.events = function (value) {
    if (!arguments.length) {
      return events;
    }
    
    events = value;
    // console.log(events);
    return chart;
  }

  chart.eventText = function (value) {
    if (!arguments.length) {
      return eventText;
    }
    eventText = value;
    return chart;
  }

  return chart;
}