var binaryCategoryChart = function () {
    let margin = {top: 20, right: 20, bottom: 30, left: 60};
    let width = 900 - margin.left - margin.right;
    let height = 200 - margin.top - margin.right;
    let titleText;
    let markFill = 'steelblue';
    let xScaleDomain;
    let xValue;
    let yValue;
    let tooltipText = (d) => {
      let str = new String();
      let counter = 0;
      for (const property in d) {
        if (d.hasOwnProperty(property)) {
          str = str + property + ": " + d[property];
          if (counter+1 < Object.keys(d).length) {
            str = str + '\n';
          }
        }
        counter += 1;
      }
      return str;
    };

    let chartData;
    let chartDiv;
    let svg;

    function chart(selection, data) {
        chartData = data;
        chartDiv = selection;
        // console.log(chartData);
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
        
            let yScale = d3.scalePoint()
                .domain(['Male','Female'])
                .range([height, 0])
                .padding(0.5);

            // let yScale = d3.scaleLinear()
            //     .domain([0, d3.max(chartData, d => yValue(d))])
            //     .range([height, 0])
            //     .nice();
            
            if (!xScaleDomain) {
                xScaleDomain = d3.map(chartData, d => xValue(d)).keys().sort(d3.ascending);
            }
            // let caseIDs = d3.map(chartData, d => d.case).keys().sort(d3.ascending);
            // console.log(caseIDs);
            let xScale = d3.scaleBand()
                .domain(xScaleDomain)
                .range([0, width])
                .padding(0.2);
            
            g = svg.append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
            
            yAxis = d3.axisLeft(yScale)
                .tickSize(-width)
                .ticks(5)
                .tickPadding(4);
            
            g.append("g")
                .attr("class", "axis axis--y")
                .call(yAxis);
            // g.selectAll(".tick line").attr('opacity', 0.15);
            // g.selectAll(".domain").remove();

            let xAxis = d3.axisBottom(xScale);
            g.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .selectAll("text")
                  .attr("fill", "gray")
                  .attr("y", 0)
                  .attr("x", 9)
                  .attr("dy", ".35em")
                  .attr("transform", "rotate(90)")
                  .style("text-anchor", "start");
                // .selectAll(".tick line").attr('stroke', 'lightgray');
            g.selectAll(".tick line").attr('opacity', 0.15);
            g.selectAll(".domain").remove();

            g.selectAll("dot")
                .data(chartData)
            .enter().append("circle")
                .attr("r", 3)
                .attr("fill", markFill)
                .attr("cx", function(d) { return xScale(xValue(d)) + (xScale.bandwidth() / 2); })
                .attr("cy", function(d) { return yScale(yValue(d)); })
                .append("title")
                  .text(d => tooltipText(d));


            // if (displayMode === 'bar') {
            //   g.selectAll("bar")
            //       .data(chartData)
            //   .enter().append("rect")
            //       .attr("class", "bar")
            //       .attr("fill", barRectFill)
            //       .attr("x", d => { return xScale(xValue(d)); })
            //       .attr("y", d => { return yScale(yValue(d)); } )
            //       .attr("width", xScale.bandwidth())
            //       .attr("height", d => { return yScale(0) - yScale(yValue(d)); })
            //       .append("title")
            //           .text(d => tooltipText(d));
            // } else if (displayMode === 'dot') {
            //   g.selectAll("dot")
            //     .data(chartData)
            //   .enter().append("circle")
            //     .attr("r", xScale.bandwidth()/2.)
            //     .attr("fill", barRectFill)
            //     .attr("strong", "none")
            //     .attr("cx", function(d) { return xScale(xValue(d)); })
            //     .attr("cy", function(d) { return yScale(yValue(d)); })
            //     .append("title")
            //       .text(d => tooltipText(d));

            // }
            
            g.append("text")
                .attr("x", 0)
                .attr("y", -10)
                .style("text-anchor", "start")
                .style("font-weight", "bold")
                .text(titleText);
        }
    }

    function resizeChart() {
      drawChart();
    }

    chart.xScaleDomain = function(value) {
        if (!arguments.length) {
            return xScaleDomain;
        }
        xScaleDomain = value;
        drawChart();
        return chart;
    }

    chart.margin = function(value) {
      if (!arguments.length) {
        return margin;
      }
      oldChartWidth = width + margin.left + margin.right;
      oldChartHeight = height + margin.top + margin.bottom;
      margin = value;
      width = oldChartWidth - margin.left - margin.right;
      height = oldChartHeight - margin.top - margin.bottom;
      resizeChart();
      return chart;
    };

    chart.width = function(value) {
      if (!arguments.length) {
        return width;
      }
      width = value - margin.left - margin.right;
      if (svg) {
        resizeChart();
      }
      return chart;
    };

    chart.height = function(value) {
      if (!arguments.length) {
        return height;
      }
      height = value - margin.top - margin.bottom;
      if (svg) {
        resizeChart();
      }
      return chart;
    };

    chart.titleText = function(value) {
      if (!arguments.length) {
        return titleText;
      }
      titleText = value;
      return chart;
    };

    chart.xValue = function(value) {
      if (!arguments.length) {
        return xValue;
      }
      xValue = value;
      return chart;
    }

    chart.yValue = function(value) {
      if (!arguments.length) {
        return yValue;
      }
      yValue = value;
      return chart;
    }

    chart.tooltipText = function(value) {
      if (!arguments.length) {
        return tooltipText;
      }
      tooltipText = value;
      return chart;
    }

    return chart;
}