var correlationChart = function () {

    let margin = { top: 20, right: 20, bottom: 20, left: 20 };
    let scatterplotMargin = { top: 20, right: 20, bottom: 60, left: 60 };
    let size = 900 - margin.left - margin.right;
    let titleText;
    let padding = 20;
    let scatterplotPointOpacity = 0.35;

    let chartData;
    let chartColumns;
    let columnCorrelations;
    let chartDiv;
    let svg;
    let g;
    let yScale;
    let xScale;
    let corrleationColorScale = d3.scaleSequential(d3.interpolateRdBu).domain([-1, 1]);
    let selectedCell;
    let scatterplot;

    function chart (selection, data) {
        chartData = data.data;
        chartColumns = data.columns;
        chartDiv = selection;

        calculateColumnCorrelations();

        drawChart();
    }

    function drawChart() {
        // console.log(chartColumns);
        // console.log(chartData);
        // console.log(columnCorrelations);

        if (chartDiv && chartData) {
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

            xScale = d3.scaleBand()
                .domain(chartColumns.map(d => d.name))
                .range([0, width])
                .padding(.2);
            
            yScale = xScale.copy().range([0, height]);

            g = svg.append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);
            
            let yAxis = d3.axisLeft(yScale);
            g.append("g")
                .attr("class", "axis axis--y")
                .call(yAxis);

            let xAxis = d3.axisBottom(xScale);
            let xAxisG = g.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .selectAll("text")
                    .attr("y", 0)
                    .attr("x", -9)
                    .attr("dy", ".35em")
                    .attr("transform", "rotate(-90)")
                    .style("text-anchor", "end");

            g.selectAll(".domain").remove();

            g.selectAll("cell")
                .data(columnCorrelations)
            .enter().append("rect")
                .attr("class", "cell")
                // .attr("id", `${d.column2.name}_${}`)
                .attr("x", d => { return xScale(d.column2.name) })
                .attr("y", d => { return yScale(d.column1.name) })
                .attr("width", xScale.bandwidth())
                .attr("height", yScale.bandwidth())
                .attr("rx", 2)
                .attr("ry", 2)
                .attr("stroke", "lightgray")
                .attr("stroke-width", 1.5)
                .attr("fill", d => { return corrleationColorScale(d.correlation); })
                .on("click", function(d) {
                    selectdCell = d;
                    d3.selectAll(".cell")
                        .style("stroke", function(c) {return c === d ? "black" : "lightgray"})
                        .style("stroke-width", function(c) {return c === d ? 2.0 : 1.5});
                    g.select(".axis--x").selectAll(".tick")
                        .each(function(t) {
                            d3.select(this)
                                .attr("font-weight", t === d.column2.name ? "bold" : "normal")
                                .attr("font-size", t === d.column2.name ? 11 : 10);
                        })
                    g.select(".axis--y").selectAll(".tick")
                        .each(function(t) {
                            d3.select(this)
                                .attr("font-weight", t === d.column1.name ? "bold" : "normal")
                                .attr("font-size", t === d.column1.name ? 11 : 10);
                        })
                    xAxisG.selectAll('.tick').select('text').style("font-weight", "bold");
                    cellClicked(d);
                })
                .append("title")
                    .text(d => `[${d.column2.name}] : [${d.column1.name}]  r = ${d.correlation.toFixed(2)}`);
        }
    }

    function cellClicked(cell) {
        // console.log('cell clicked');
        // console.log(cell);

        d3.select(".scatterplot").remove();

        const scatterplotWidth = (width / 2.) - scatterplotMargin.left - scatterplotMargin.right;
        const scatterplotHeight = (height / 2.) - scatterplotMargin.top - scatterplotMargin.bottom; 
        
        pointData = chartData.map(d => { return [d[cell.column1.name], d[cell.column2.name]]; });
        pointData = pointData.filter(d => { return !isNaN(d[0] && !isNaN(d[1])); })
        // console.log(d3.min(pointData, d => d[0]));
        // console.log(pointData.filter(d => d[0] === 0));
        // console.log(pointData);

        let xDomain = d3.extent(pointData, d => d[0]);
        // let xDomainPadding = (xDomain[1] - xDomain[0]) * .4;
        // xDomain[0] = xDomain[0] - xDomainPadding;
        // xDomain[1] = xDomain[1] + xDomainPadding;
        let sx = d3.scaleLinear()
            .domain(xDomain)
            .range([0, scatterplotWidth])
            .nice();
        // console.log(xDomain);
        
        let yDomain = d3.extent(pointData, d => d[1]);
        // let yDomainPadding = (yDomain[1] - yDomain[0]) * .1;
        // yDomain[0] = yDomain[0] - yDomainPadding;
        // yDomain[1] = yDomain[1] + yDomainPadding;
        let sy = d3.scaleLinear()
            .domain(yDomain)
            .range([scatterplotHeight, 0])
            .nice();
        // console.log(yDomain);

        scatterplot = g.append('g')
            .attr("class", "scatterplot")
            .attr('transform', `translate(${(width / 2.) + scatterplotMargin.left}, ${scatterplotMargin.top})`);

        let xAxis = d3.axisBottom(sx)
            .ticks(8)
            .tickSize(-scatterplotHeight)
            .tickPadding(6);

        scatterplot.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", `translate(0,${scatterplotHeight})`)
            .call(xAxis)
            .append("text")
                .attr("fill", "#000")
                .attr("font-weight", "bold")
                .attr("font-size", "11")
                .attr("y", 30)
                .attr("x", scatterplotWidth/2)
                // .attr("dy", "0.7em")
                .attr("text-anchor", "middle")
                .text(cell.column1.name);
            // .selectAll("text")
            //     .attr("fill", "gray")
            // .selectAll(".tick line")
            //     .attr('opacity', 0.15)

        let yAxis = d3.axisLeft(sy)
            .ticks(8)
            .tickSize(-scatterplotWidth)
            .tickPadding(6);

        scatterplot.append("g")
            .attr("class", "axis axis--y")
            .call(yAxis)
            // .selectAll("text")
            //     .attr("fill", "gray")
            // .selectAll(".tick line")
            //     .attr('opacity', 0.15)
            .append("text")
                .attr("fill", "#000")
                .attr("font-weight", "bold")
                .attr("font-size", "11")
                .attr("transform", "rotate(-90)")
                .attr("y", -45)
                .attr("x", -scatterplotHeight/2)
                .attr("dy", "0.7em")
                .attr("text-anchor", "middle")
                .text(cell.column2.name);

        // scatterplot.append("text")
        //     .attr("x", scatterplotWidth / 2)
        //     .attr("y", 9)
        //     .attr("fill", "#000")
        //     .attr("font-width", "bold")
        //     .attr("text-anchor", "end")
        //     .text(cell.column1.name);

        scatterplot.selectAll(".tick line")
            .attr('opacity', 0.15);
            
        scatterplot.selectAll(".domain").remove();

        scatterplot.selectAll("circle")
            .data(pointData)
            .enter().append("circle")
                .attr("class", "point")
                .attr("cx", d => sx(d[0]))
                .attr("cy", d => sy(d[1]))
                .attr("r", 3)
                .attr("stroke", "steelblue")
                .attr("stroke-opacity", scatterplotPointOpacity)
                .attr("stroke-width", 1.5)
                .attr("fill", "transparent");
        
        scatterplot.append("text")
            .attr("x", scatterplotWidth/2)
            .attr("y", -14)
            .style("text-anchor", "middle")
            .style("font-weight", "bold")
            .style("font-size", 12)
            .attr("fill", "black")
            .text(`'${cell.column1.name}' versus '${cell.column2.name}' (r = ${cell.correlation.toFixed(2)})`);

    }

    function calculateColumnCorrelations() {
        if (chartData) {
            columnCorrelations = [];
            chartColumns.forEach((column1) => {
                if (column1.type === 'numerical') {
                    // column1.correlations = [];
                    c1Data = chartData.map(d => d[column1.name]);
                    for (let i = 0; i < chartColumns.length; i++) {
                        let column2 = chartColumns[i];
                    // chartColumns.forEach((column2) => {
                        if (column2.type === 'numerical') {
                            if (column1 === column2) {
                                // column1.correlations[column2.name] = 1.;
                                columnCorrelations.push({
                                    column1: column1,
                                    column2: column1,
                                    correlation: 1,
                                });
                                break;
                            } else {
                                let c2Data = chartData.map(d => d[column2.name]);
                                let c1Filtered = [];
                                let c2Filtered = [];
                                for (let i = 0; i < c1Data.length; i++) {
                                    if (!isNaN(c1Data[i]) && !isNaN(c2Data[i])) {
                                        c1Filtered.push(c1Data[i]);
                                        c2Filtered.push(c2Data[i]);
                                    }
                                }
                                columnCorrelations.push({
                                    column1: column1,
                                    column2: column2,
                                    correlation: corr(c1Filtered, c2Filtered),
                                })
                                // column1.correlations[column2.name] = corr(c1Filtered, c2Filtered);
                            }
                        }
                    }
                    // });
                }
            });
        }
    }

    function corr(d1, d2) {
        let { min, pow, sqrt } = Math;
        let add = (a,b) => a + b;
        let n = min(d1.length, d2.length);
        if (n === 0) {
            return 0;
        }
        [d1, d2] = [d1.slice(0,n), d2.slice(0,n)];
        let [sum1, sum2] = [d1, d2].map(l => l.reduce(add));
        let [pow1, pow2] = [d1, d2].map(l => l.reduce((a,b) => a + pow(b, 2), 0));
        let mulSum = d1.map((n, i) => n * d2[i]).reduce(add);
        let dense = sqrt((pow1 - pow(sum1, 2) / n) * (pow2 - pow(sum2, 2) / n));
        if (dense === 0) {
            return 0
        }
        return (mulSum - (sum1 * sum2 / n)) / dense;
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
        // resizeChart();
        return chart;
    };
  
      chart.width = function(value) {
        if (!arguments.length) {
          return width;
        }
        width = value - margin.left - margin.right;
        if (svg) {
        //   resizeChart();
        }
        return chart;
      };
  
      chart.height = function(value) {
        if (!arguments.length) {
          return height;
        }
        height = value - margin.top - margin.bottom;
        if (svg) {
        //   resizeChart();
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

      chart.scatterplotPointOpacity = function(value) {
          if (!arguments.length) {
              return scatterplotPointOpacity;
          }
          scatterplotPointOpacity = value;

          if (scatterplot) {
              scatterplot.selectAll(".point")
                .attr("stroke-opacity", scatterplotPointOpacity);
          }

          return chart;
      }

      return chart;
}