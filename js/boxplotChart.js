var boxplotChart = function () {
    let margin = {top: 20, right: 20, bottom: 50, left: 60};
    let width = 900 - margin.left - margin.right;
    let height = 200 - margin.top - margin.right;
    let titleText;
    let alignMedians = true;
    let iqrRectFill = '#9ecae1';
    let xScaleDomain;
    let xValue;
    let yAxisLabel = "meters";
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
    }

    let chartData;
    let chartDiv;
    let svg;
    let g;
    let yScale;
    let yAxis;
    let xScale;
    
    function chart(selection, data) {
        chartData = data;
        chartDiv = selection;

        chartData.forEach(d => {
            d.aligned_q3 = d.q3 - d.median;
            d.aligned_q1 = d.q1 - d.median;
            d.aligned_r0 = d.r0 - d.median;
            d.aligned_r1 = d.r1 - d.median;
        });
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
        
            // const yMin = d3.min(chartData, d => {
            //     return Math.min(getMedian(d), Math.min(d.q1, d.min));
            // });
            // const yMax = d3.max(chartData, d => {
            //     return Math.max(getMedian(d), Math.max(d.q3, d.max));
            // });
            yScale = d3.scaleLinear()
                // .domain([yMin, yMax])
                .domain([d3.min(chartData, d => getR0(d)), d3.max(chartData, d => getR1(d))])
                .range([height, 0])
                .nice()
            
            // let caseIDs = chartData.map(d => {
            //     return xValue(d);
            // });
            // let caseIDs = d3.map(chartData, d => xValue(d)).keys().sort(d3.ascending);
            if (!xScaleDomain) {
                xScaleDomain = d3.map(chartData, d => xValue(d)).keys().sort(d3.ascending);
            }
            // console.log(caseIDs);
            xScale = d3.scaleBand()
                .domain(xScaleDomain)
                .range([0, width])
                .padding(0.2);
            
            g = svg.append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
            
            yAxis = d3.axisLeft(yScale)
                .tickSize(-width)
                .ticks(5)
                // .ticks(6)
                .tickPadding(4);
            
            g.append("g")
                .attr("class", "axis axis--y")
                .call(yAxis)
                .append("text")
                  .attr("fill", "black")
                  .attr("transform", "rotate(-90)")
                  .attr("y", -45)
                  .attr("x", -height/2)
                  .attr("dy", "0.7em")
                  .attr("text-anchor", "middle")
                  .text(yAxisLabel);
            
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
                  // .style("text-anchor", "middle")
                  // .attr("dy", (d, i) => {return (i % 2) ? 20 : 10; });
                // .selectAll("tick line")
                //   .attr("y", (d, i) => { return (i % 2) ? 16 : 6; })
                // .selectAll("text")	
                  // .style("text-anchor", "end")
                  // .attr("x", -8)
                  // .attr("dy", ".1em")
                  // .attr("transform", "rotate(-25)");
            g.selectAll(".tick line").attr('opacity', 0.15);
            g.selectAll(".domain").remove();
            
            g.selectAll("rangeline")
                .data(chartData)
            .enter().append("line")
                .attr("class", "rangeline")
                .attr("x1", d => { return xScale(xValue(d)) + (xScale.bandwidth() / 2.); })
                .attr("x2", d => { return xScale(xValue(d)) + (xScale.bandwidth() / 2.); })
                .attr("y1", d => { return yScale(getR0(d)); })
                .attr("y2", d => { return yScale(getR1(d)); })
                // .attr("y1", d => { return yScale(Math.min(d.max, (d.q3 + d.iqr * 1.5))); })
                // .attr("y2", d => { return yScale(Math.max(d.min, (d.q1 - d.iqr * 1.5))); })
                // .attr("y1", d => { return yScale(d.max); })
                // .attr("y2", d => { return yScale(d.min); })
                .attr("stroke", "gray")
                .attr("stroke-width", 2)
                .append("title")
                    .text(d => tooltipText(d));

            g.selectAll("iqrbar")
                .data(chartData)
            .enter().append("rect")
                .attr("class", "iqrbar")
                .attr("fill", iqrRectFill)
                .attr("stroke", "darkgray")
                // .attr("opacity", 0.5)
                // .attr("fill", "#c6dbef")
                // .attr("stroke", "#9ecae1")
                .attr("x", d => {return xScale(xValue(d)); })
                // .attr("y", d => {return yScale(d.q3); })
                .attr("y", d => { return yScale(getQ3(d)); })
                .attr("width", xScale.bandwidth())
                // .attr("height", d => { return yScale(d.q1) - yScale(d.q3); })
                .attr("height", d => { 
                  let height = yScale(getQ1(d)) - yScale(getQ3(d));
                  // if (height === "NaN" || isNaN(height) || height === null) {console.log(d);}
                  // if (yScale(getQ1(d)) - yScale(getQ3(d) == "NaN" || isNaN(yScale(getQ1(d)) - yScale(getQ3(d))))) console.log(d);
                  return yScale(getQ1(d)) - yScale(getQ3(d)); 
                })
                .append("title")
                    .text(d => tooltipText(d));

            g.selectAll("medianline")
                .data(chartData)
            .enter().append("line")
                .attr("class", "medianline")
                .attr("x1", d => { return xScale(xValue(d)); })
                .attr("x2", d => { return xScale(xValue(d)) + xScale.bandwidth(); })
                .attr("y1", d => { return yScale(getMedian(d)); })
                .attr("y2", d => { return yScale(getMedian(d)); })
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .append("title")
                    .text(d => tooltipText(d));
            
            g.append("text")
                .attr("x", 0)
                .attr("y", -10)
                .style("text-anchor", "start")
                .style("font-weight", "bold")
                .text(titleText);
        }
    }

    function getR1(d) {
      if (alignMedians) {
        return d.aligned_r1;
      }
      return d.r1;
    }

    function getR0(d) {
      if (alignMedians) {
        return d.aligned_r0;
      }
      return d.r0;
    }

    function getQ3(d) {
      if (alignMedians) {
        return d.aligned_q3;
      }
      return d.q3;
    }

    function getQ1(d) {
      if (alignMedians) {
        return d.aligned_q1;
      }
      return d.q1;
    }

    function getMedian(d) {
        if (alignMedians) {
            return 0.;
        }
        return d.median;
    }

    function resizeChart() {
      drawChart();
    }


    function updateData () {
      if (chartData) {
        yScale.domain([d3.min(chartData, d => getR0(d)), d3.max(chartData, d => getR1(d))]).nice();  
        // var yMin = d3.min(data, function(d) {
        //     return Math.min(getMedian(d), Math.min(getQ1(d), getMin(d)))
        // })
        // var yMax = d3.max(data, function(d) {
        //     return Math.max(getMedian(d), Math.max(getMax(d), getQ3(d)))
        // })
        // yScale.domain([yMin, yMax]).nice();

        g.select(".axis--y")
            .transition()
            // .duration(1000)
            // .delay(1000)
            .call(yAxis.scale(yScale));
        g.selectAll(".tick line").attr('opacity', 0.15);
        g.selectAll(".domain").remove();

        g.selectAll(".iqrbar")
            .transition()
            // .duration(1000)
            // .delay(1000)
            // .attr("x", d => {return xScale(xValue(d)); })
            .attr("y", d => { return yScale(getQ3(d)); })
            // .attr("width", xScale.bandwidth())
            .attr("height", d => { return yScale(getQ1(d)) - yScale(getQ3(d)); });
            // .attr("x", function(d) { return xScale(d.pulse_start) })
            // .attr("y", function(d) { return yScale(getQ3(d))})
            // .attr("width", function(d) { return (xScale(d.pulse_end) - xScale(d.pulse_start)) })
            // .attr("height", function(d) { return (yScale(getQ1(d)) - yScale(getQ3(d)))});

        g.selectAll(".rangeline")
            .transition()
            // .attr("x1", function(d) { return xScale(d.pulse_start) + ((xScale(d.pulse_end) - xScale(d.pulse_start))/2.) })
            // .attr("x2", function(d) { return xScale(d.pulse_start) + ((xScale(d.pulse_end) - xScale(d.pulse_start))/2.) })
            .attr("y1", d => { return yScale(getR0(d)); })
            .attr("y2", d => { return yScale(getR1(d)); });
            // .attr("y1", function(d, i) { return yScale(getMax(d)) })
            // .attr("y2", function(d) { return yScale(getMin(d)) });

        g.selectAll(".medianline")
            .transition()
            // .attr("x1", function(d) { return xScale(d.pulse_start) })
            // .attr("x2", function(d) { return xScale(d.pulse_end) })
            .attr("y1", function(d) { return yScale(getMedian(d)); })
            .attr("y2", function(d) { return yScale(getMedian(d)) });

        //   svg.transition().duration(1000).call(zoom.transform, d3.zoomIdentity);
      }
    }
  
    chart.xScaleDomain = function(value) {
        if (!arguments.length) {
            return xScaleDomain;
        }
        xScaleDomain = value;
        drawChart();
        return chart;
    }

    chart.alignMedians = function(value) {
      if (!arguments.length) {
        return alignMedians;
      }
      alignMedians = value;

      if (typeof updateData === "function") updateData();

      return chart;
    };

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

    chart.yAxisLabel = function(value) {
      if (!arguments.length) {
        return yAxisLabel;
      }
      yAxisLabel = value;
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