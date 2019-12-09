var pcpChart = function () {
    let margin = {
        top: 20,
        right: 10,
        bottom: 20,
        left: 10
    };
    let width = 800 - margin.left - margin.right;
    let height = 300 - margin.top - margin.bottom;
    let titleText;
    let selectedLineOpacity = 0.15;
    let unselectedLineOpacity = 0.05;
    let showSelected = true;
    let showUnselected = true;
    let categoryRectangleWidth = 14;

    let chartData;
    let svg;
    let foreground;
    let background;
    let selected;
    let unselected;
    let dimensions;
    let x;
    let y;
    let actives;
    let selectedDimension;

    let probabilityColorScale;

    const jointProbLineHeight = 6;
    const jointProbTextHeight = 10;
    const jointProbTotalHeight = jointProbLineHeight + (3 * jointProbTextHeight);
    const jointProbStrokeColor = "gray"

    let corrRectSize = 16;
    let corrRectPadding = 5;
    let corrRectLabelHeight = 10;
    let corrTotalHeight = corrRectSize + corrRectLabelHeight + (2 * corrRectPadding);

    let corrColorScale;
    const zeroProbabilityColor = "#E0E0E0";

    let hasActiveSelections = false;
    let closeButtonStyle = {
        "fill-opacity": 0,
        "stroke-width": 1.5,
        "stroke": "black",
    };
    let closeCrossStyle = {
        "stroke-width": 1.5,
        "stroke": "gray",
    };

    let queryMode = "AND";

    const drag = d3.drag()
        // .on("start", function(d) {
        // })
        .on("drag", function(d) {
            d3.select(this).raise().attr("x", d3.event.x);
        })
        .on("end", function(d) {
            draggingDimName = d3.select(this).attr("id");
            let srcIndex = dimensions.findIndex(function(dim) {
                return dim.name == draggingDimName;
            });
            let dstIndex = Math.round(d3.event.x / x.step());

            d3.select(this).attr("x", 0);
            if (dstIndex != 0) {
                const moveDimension = dimensions[srcIndex];
                dimensions.splice(srcIndex, 1);
                dimensions.splice(srcIndex + dstIndex, 0, moveDimension);

                const dimensionNames = dimensions.map(function(d) { return d.name; });

                x.domain(dimensionNames);
                svg.selectAll(".dimension")
                    .each(function(dim) {
                        d3.select(this)
                            .attr("transform", function(d) {
                                return "translate(" + x(d.name) + ")";
                            });
                        let idx = dimensionNames.findIndex(name => name === dim.name);
                        d3.select(this).select(".dimensionLabel")
                            .attr("y", (idx%2) ? -16 : -26);
                    });
                    
                drawLines();
            }
        });

    function chart(selection, data) {
        chartData = data;
        selected = chartData;

        corrColorScale = d3.scaleSequential(d3.interpolateRdBu).domain([-1, 1]);
        probabilityColorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 1]);

        x = d3.scalePoint().range([0, width]).padding(.25);
        y = {};

        const backgroundCanvas = selection.append('canvas')
            .attr('id', 'background')
            .attr('width', width+1)
            .attr('height', height+1)
            .style('position', 'absolute')
            .style('top', `${margin.top }px`)
            .style('left', `${margin.left}px`)
        background = backgroundCanvas.node().getContext('2d');
        background.strokeStyle = "rgba(80,80,80)";
        background.globalAlpha = unselectedLineOpacity;

        const foregroundCanvas = selection.append('canvas')
            .attr('id', 'foreground')
            .attr('width', width+1)
            .attr('height', height+1)
            .style('position', 'absolute')
            .style('top', `${margin.top}px`)
            .style('left', `${margin.left}px`)
        foreground = foregroundCanvas.node().getContext('2d');
        foreground.strokeStyle = "rgba(0,100,160)";
        foreground.globalAlpha = selectedLineOpacity;
        foreground.antialias = true;

        svg = selection.append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .style('position', 'absolute')
            .append('svg:g')
                .attr('transform', 'translate(' + margin.left + ',' + (margin.top) + ')');

        svg.selectAll("rect")
            .data()
        
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -24)
            .style("text-anchor", "middle")
            .style("font-weight", "bold")
            .style("font-size", "14")
            .text(titleText);
        
        svg.append("text")
            .attr("class", "selection_label")
            .attr("x", 0)
            .attr("y", height + 20)
            .style("text-anchor", "start")
            .style("font-size", "12")
            // .style("font-weight", "bold")
            .style("font-family", "sans-serif")
            .style("font-size", 10)
            .text(`0 / ${chartData.length} (0.0%) Lines Selected`);

        svg.append("line")
            .attr("x1", 0)
            .attr("y1", height + 8)
            .attr("x2", width)
            .attr("y2", height + 8)
            .style("stroke", "lightgray")
            .style("stroke-width", "2")
            .style("stroke-linecap", "round");

        svg.append("line")
            .attr("class", "selection_line")
            .attr("x1", 0)
            .attr("y1", height + 8)
            .attr("x2", width)
            .attr("y2", height + 8)
            .style("stroke", "rgba(0,100,160)")
            .style("stroke-width", "4")
            .style("stroke-linecap", "round");

        let dimensionNames = [];
        dimensions.forEach((dimension) => {
            dimensionNames.push(dimension.name);
            if (dimension.type === 'numerical') {
                y[dimension.name] = d3.scaleLinear()
                    .domain(d3.extent(chartData, (d) => { 
                        return d[dimension.name]; 
                    }));
            } else if (dimension.type === 'categorical') {
                const domain = [...new Set(chartData.map(d => d[dimension.name]))].sort(d3.descending);
                y[dimension.name] = d3.scaleBand()
                    .domain(domain);
            }
            y[dimension.name].range([height - corrTotalHeight - jointProbTotalHeight, 0]);
        });
        x.domain(dimensionNames);

        dimensions.forEach((dim) => {
            if (dim.type === 'categorical') {
                dim.bins = [0, 0];
                chartData.forEach((d) => {
                    dim.bins[d[dim.name]]++;
                });
                dim.selectedBins = [0, 0];
                dim.selected = new Set();
            }
        })

        // console.log(dimensions);

        chartData.map(function (d) {
            if (showSelected) {
                path(d, foreground);
            }
        });

        calculateDimensionCorrs();
        drawDimensions();
    }

    function drawDimensions() {
        const axis = d3.axisLeft();
        
        svg.selectAll(".dimension").remove();

        // Add a group element for each dimension.
        const g = svg.selectAll(".dimension")
                .data(dimensions)
            .enter().append("g")
                .attr("class", "dimension")
                .attr("transform", function (d) {
                    return "translate(" + x(d.name) + ")";
                });

        // Add an axis and title.
        g.append("g")
            .attr("class", "axis")
            .each(function (d) {
                let closeButton = d3.select(this).append("g")
                    .on("click", function () {
                        console.log(`close button clicked for ${d.name}`);
                        let idx = dimensions.findIndex(dim => d === dim);
                        let deletedDim = dimensions.splice(idx, 1);
                        if (selectedDimension === deletedDim) {
                            selectedDimension = null;
                            // d3.select(this).style("fill", "#646464").style("font-size", 10);
                        }
                        console.log(dimensions);
                        let dimensionNames = dimensions.map(dim => dim.name);
                        x.domain(dimensionNames);
                        svg.selectAll(".dimension")
                            .each(function(dim) {
                                if (!x(dim.name)) {
                                    console.log(`${dim.name} is undefined`);
                                    d3.select(this).remove();
                                } else {
                                    d3.select(this)
                                        .attr("transform", function(d) {
                                            return "translate(" + x(d.name) + ")";
                                        });
                                    let idx = dimensionNames.findIndex(name => name === dim.name);
                                    d3.select(this).select(".dimensionLabel")
                                        .attr("y", (idx%2) ? -16 : -26);
                                }
                            });
                        brush();
                        drawLines();
                        updateCorrRectangles();
                    })
                    .on("mouseover", function(d) {
                        d3.select(this).style("cursor", "pointer");
                    })
                    .on("mouseout", function(d) {
                        d3.select(this).style("cursor", "default");
                    });
                closeButton
                    .append('title')
                        .text(`Click to remove ${d.name} dimension`);
                let cross = closeButton.append("g");
                let buttonSize = 10;
                let cr = buttonSize / 2;
                let cofs = buttonSize / 6;
                let cy = -8;
                let cx = 0;
                closeButton.append("circle")
                    .attr("cx", cx)
                    .attr("cy", cy)
                    .attr("r", cr)
                    .style("stroke", "gray")
                    .style("fill-opacity", 0)
                    .style("stroke-width", 1.5);
                cross.append("line")
                    .attr("x1", cx - cr + cofs)
                    .attr("y1", cy)
                    .attr("x2", cx + cr - cofs)
                    .attr("y2", cy)
                    .style("stroke-width", 1.5)
                    .style("stroke", "gray");
                cross.append("line")
                    .attr("x1", cx)
                    .attr("y1", cy -cr + cofs)
                    .attr("x2", cx)
                    .attr("y2", cy + cr - cofs)
                    .style("stroke-width", 1.5)
                    .style("stroke", "gray");
                cross.attr("transform", "rotate (45," + cx + "," + cy + ")");
                    

                if (d.type === 'numerical') {
                    d3.select(this).call(axis.scale(y[d.name]));
                    d3.select(this).append("rect")
                        .attr("class", "corrRect")
                        .attr("x", - (corrRectSize/2.))
                        .attr("y", y[d.name].range()[0] + corrRectPadding)
                        .attr("width", corrRectSize)
                        .attr("height", corrRectSize)
                        .attr("rx", 2)
                        .attr("ry", 2)
                        .attr("fill", "ghostwhite")
                        .attr("stroke", "gray");
                    d3.select(this).append("text")
                        .attr("class", "corrLabel")
                        .style("text-anchor", "middle")
                        .style("font-size", 10)
                        .style("font-family", "sans-serif")
                        .attr("y", y[d.name].range()[0] + corrRectPadding + corrRectSize + corrRectLabelHeight)
                        .attr("x", 0)
                        .text("r");
                } else if (d.type === 'categorical') {
                    d3.select(this).append("line")
                        .attr("x1", 0)
                        .attr("y1", 0)
                        // .attr("y1", y[d.name].range()[1])
                        .attr("x2", 0)
                        .attr("y2", y[d.name].range()[0])
                        .style("stroke", "darkgray")
                        .style("stroke-width", "3")
                        .style("stroke-linecap", "round");
                    d3.select(this).append("rect")
                        .attr("class", "corrRect")
                        .attr("x", - (corrRectSize/2.))
                        .attr("y", y[d.name].range()[0] + corrRectPadding)
                        .attr("width", corrRectSize)
                        .attr("height", corrRectSize)
                        .attr("rx", 2)
                        .attr("ry", 2)
                        .attr("fill", "ghostwhite")
                        .attr("stroke", "gray");
                    d3.select(this).append("text")
                        .attr("class", "corrLabel")
                        .style("text-anchor", "middle")
                        .style("font-size", 10)
                        .style("font-family", "sans-serif")
                        .attr("y", y[d.name].range()[0] + corrRectPadding + corrRectSize + corrRectLabelHeight)
                        .attr("x", 0)
                        .text("r");
                        
                    for (index in d.bins) {
                        const value = index;
                        const rectTop = y[d.name](index) + 3;
                        const rectHeight = y[d.name].bandwidth() - 6;
                        const rectBottom = rectTop + rectHeight;

                        let catRect = d3.select(this).append("rect")
                            .attr("class", "categoryRect")
                            .attr("id", `cat${index}`)
                            .attr("x", -(categoryRectangleWidth / 2.))
                            // .attr("y", y[d.name](index) + 3)
                            .attr("y", rectTop)
                            .attr("width", categoryRectangleWidth)
                            .attr("height", rectHeight)
                            // .attr("height", y[d.name].bandwidth() - 6)
                            .attr("rx", 2)
                            .attr("ry", 2)
                            .attr("fill", "whitesmoke")
                            // .attr("fill", (d) => { return probabilityColorScale(d.bins[index] / chartData.length); })
                            .attr("stroke", "gray")
                            .on("click", function(d) {
                                if (d.selected.has(+value)) {
                                    d.selected.delete(+value);
                                    // d3.select(this).select(`#cat${index}`)
                                    //     .attr("stroke", "gray")
                                    //     .attr("stroke-width", "1");
                                    catRect.attr("stroke", "gray");
                                    catRect.attr("stroke-width", "1");
                                    // d3.select(this).select(".catTitle").text("off");
                                } else {
                                    d.selected.add(+value);
                                    // catRect.attr("fill", "#FFFF99");
                                    // d3.select(this).select(`#cat${index}`)
                                    //     .attr("stroke", "black")
                                    //     .attr("stroke-width", "2");
                                    catRect.attr("stroke", "black");
                                    catRect.attr("stroke-width", "2");
                                    // d3.select(this).select(".catTitle").text("ON");
                                }
                                brush();
                                updateCorrRectangles();
                            });
                            // .append('title')
                            //     .text(`Dimension: ${d.name}\nCategory: ${index}`);
                            //     .attr("class", "catTitle")
                            //     .text(d.bins[index]/chartData.length);
                        
                        let probRectHeight = (rectHeight - 30) / 2;
                        d3.select(this).append("rect")
                            .attr("id", `probRectCat${index}`)
                            .attr("x", -((categoryRectangleWidth / 2)-2))
                            .attr("y", index == 0 ? rectBottom - probRectHeight - 2 : rectTop + 2)
                            .attr("width", categoryRectangleWidth - 4)
                            .attr("height", probRectHeight)
                            .attr("rx", 2)
                            .attr("ry", 2)
                            .attr("stroke", "gray")
                            .attr("fill", (d) => {
                                return getCategoryProbabilityColor(d, index);
                                // if (d.selectedBins[index] == 0) {
                                //     return zeroProbabilityColor;
                                // } else {
                                //     return probabilityColorScale(d.selectedBins[index] / d.bins[index]);
                                    
                                // }
                            })
                            .append('title')
                                .attr('id', `probRectCatTitle${index}`)
                                .text(getCategoryProbabilityTooltip(d, index));
                        
                        d3.select(this).append("rect")
                            // .attr("id", `probRectAll${index}`)
                            .attr("x", -((categoryRectangleWidth / 2)-2))
                            .attr("y", index == 0 ? rectBottom - (2 * probRectHeight) - (2 * 2) : rectTop + probRectHeight + (2 * 2))
                            .attr("width", categoryRectangleWidth - 4)
                            .attr("height", probRectHeight)
                            .attr("rx", 2)
                            .attr("ry", 2)
                            .attr("stroke", "gray")
                            .attr("fill", (d) => {
                                if (d.bins[index] == 0) {
                                    return zeroProbabilityColor;
                                } else {
                                    return probabilityColorScale(d.bins[index] / chartData.length);
                                }
                            })
                            .append('title')
                                .text(getAllProbabilityTooltip(d, index));

                        d3.select(this).append("text")
                            .style("text-anchor", "middle")
                            .style("font-size", 10)
                            .style("font-family", "sans-serif")
                            .attr("y", index == 0 ? (y[d.name](index) + 13) : (rectBottom - 3))
                            // .attr("y", y[d.name](index) + y[d.name].bandwidth()/2.)
                            .attr("x", 0)
                            .text(index)
                            .attr("pointer-events", "none");
                    }
                }
            })
            .append("text")
                .attr("class", "dimensionLabel" )
                .attr("id", function(d) { return d.name; })
                .style("text-anchor", "middle")
                .style("font-weight", "bold")
                .style("font-family", "sans-serif")
                .style("font-size", 10)
                // .attr("y", -9)
                .attr("y", function(d, i) { return (i%2) ? -16 : -26; })
                .attr("x", 0)
                .text(function (d) {
                    return d.name;
                })
                .call(drag)
                .on('click', function(d) {
                    if (d3.event.defaultPrevented) return;

                    // if (d.name === 'sample') { return; }
                    if (selectedDimension === d) {
                        d3.select(this).style("fill", "#646464").style("font-size", 10);
                        // svg.selectAll(`#label_${d.name}`).style("fill", "#646464").style("font-size", 10);
                        selectedDimension = null;
                    } else {
                        if (selectedDimension != null) {
                            d3.selectAll(".dimensionLabel")
                                .style("fill", "#646464")
                                .style("font-size", 10);
                            // d3.select(`#${selectedDimension.name}`).style("fill", "#646464").style("font-size", 10);
                            // d3.select(this).style("fill", "#646464").style("font-size", 10);
                            // svg.selectAll(`#label_${selectedDimension.name}`).style("fill", "#646464").style("font-size", 10);
                        }
                        selectedDimension = d;
                        d3.select(this).style("fill", "black").style("font-size", 12);
                        // svg.selectAll(`#label_${d.name}`).style("fill", "black").style("font-size", 12);
                    }
                    
                    updateCorrRectangles();
                })
                .on("mouseover", function(d) {
                    d3.select(this).style("cursor", "move");
                })
                .on("mouseout", function(d) {
                    d3.select(this).style("cursor", "default");
                });
            // .append("circle")
            //     .attr("cx", 0)
            //     .attr("cy", -6)
            //     .attr("r", 4)
            //     .style("stroke", "black")
                // .style(closeButtonStyle)

        // Add and store a brush for each axis.
        g.append("g")
            .attr("class", "brush")
            .each(function (d) {
                if (d.type === 'numerical') {
                    d3.select(this).call(y[d.name].brush = d3.brushY()
                        .extent([
                            [-10, 0],
                            [10, y[d.name].range()[0] + 1]
                            // [10, height]
                        ])
                        .on("brush", brush)
                        .on("end", brush)
                    )
                }
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);
    }

    function getAllProbabilityTooltip(dimension, categoryIndex) {
        const prob = (dimension.bins[categoryIndex] / chartData.length).toFixed(4);
        return `Dimension: ${dimension.name}, Category: ${categoryIndex}\n` +
               `Probability: ${prob} (${dimension.bins[categoryIndex]} / ${chartData.length})\n`;
    }

    function getCategoryProbabilityTooltip (dimension, categoryIndex) {
        const prob = (dimension.selectedBins[categoryIndex] / dimension.bins[categoryIndex]).toFixed(4);
        return `Dimension: ${dimension.name}, Category: ${categoryIndex}\n` +
               `Probability: ${prob} (${dimension.selectedBins[categoryIndex]} / ${dimension.bins[categoryIndex]})\n`;
    }

    // Handles a brush event, toggling the display of foreground lines.
    function brush() {
        actives = [];
        svg.selectAll(".brush")
            .filter(function (dim) {
                y[dim.name].brushSelectionValue = d3.brushSelection(this);
                return d3.brushSelection(this);
            })
            .each(function (d) {
                // Get extents of brush along each active selection axis (the Y axes)
                let brushExtent = d3.brushSelection(this);
                
                if (d.type === 'categorical') {
                    let selected = y[d.name].domain().filter(function (value) {
                        let pos = y[d.name](value) + y[d.name].bandwidth() / 2;
                        return pos > brushExtent[0] && pos < brushExtent[1];
                        // return brushExtent[0] <= y[d](value) && brushExtent[1] >= y[d](value);
                    });
                    actives.push({
                        dimension: d,
                        extent: selected,
                    });
                } else {
                    actives.push({
                        dimension: d,
                        extent: d3.brushSelection(this).map(y[d.name].invert)
                    });
                }
            });
        
        dimensions.forEach((dim) => {
            if (dim.type === 'categorical') {
                if (dim.selected.size > 0) {
                    actives.push({
                        dimension: dim,
                        extent: [...dim.selected],
                    })
                }
            }
        });
        // console.log(actives);
        hasActiveSelections = actives.length > 0;
        selectLines(actives);
        drawLines();
        updateSelectionGraphics();
    }

    function path(d, ctx) {
        dimensions.forEach(function (dim, i) {
            if (i < dimensions.length - 1) {
                let dimNext = dimensions[i + 1];
                if (!isNaN(d[dim.name]) && !isNaN(d[dimNext.name])) {
                    if (dim.type === 'categorical') {
                        let randomY = Math.random() * (y[dim.name].bandwidth()/4) - (y[dim.name].bandwidth() / 8);
                        ctx.beginPath();
                        ctx.moveTo(x(dim.name), y[dim.name](d[dim.name]) + (y[dim.name].bandwidth()/2) + randomY);
                        if (dimNext.type === 'categorical') {
                            ctx.lineTo(x(dimNext.name), y[dimNext.name](d[dimNext.name]) + (y[dimNext.name].bandwidth()/2) + randomY);
                        } else {
                            ctx.lineTo(x(dimNext.name), y[dimNext.name](d[dimNext.name]));
                        }
                        ctx.stroke();
                    } else {
                        ctx.beginPath();
                        ctx.moveTo(x(dim.name), y[dim.name](d[dim.name]));
                        ctx.lineTo(x(dimNext.name), y[dimNext.name](d[dimNext.name]));
                        ctx.stroke();
                    }
                }
            }
        });
    }

    // function pathOld(d, ctx) {
    //     ctx.beginPath();
    //     dimensions.map(function (dim, i) {
    //         if (i == 0) {
    //             if (dim.type === 'categorical') {
    //                 let randomY = Math.random() * (y[dim.name].bandwidth()/4) - (y[dim.name].bandwidth() / 8);
    //                 ctx.moveTo(x(dim.name), y[dim.name](d[dim.name]) + (y[dim.name].bandwidth()/2) + randomY);
    //             } else {
    //                 ctx.moveTo(x(dim.name), y[dim.name](d[dim.name]));
    //             }
    //         } else {
    //             if (dim.type === 'categorical') {
    //                 let randomY = Math.random() * (y[dim.name].bandwidth()/4) - (y[dim.name].bandwidth() / 8);
    //                 ctx.lineTo(x(dim.name), y[dim.name](d[dim.name]) + (y[dim.name].bandwidth()/2) + randomY);
    //             } else {
    //                 ctx.lineTo(x(dim.name), y[dim.name](d[dim.name]));
    //             }
    //         }
    //     });
    //     ctx.stroke();
    // };

    function updateCorrRectangles() {
        svg.selectAll(".dimension")
            .each(function(dim) {
                if (selectedDimension && dim.corrMap) {
                    if (dim === selectedDimension) {
                        d3.select(this).select(".corrRect")
                            .attr("opacity", 0);
                        d3.select(this).select(".corrLabel")
                            .attr("opacity", 0);
                    } else {
                        const c = dim.corrMap.get(selectedDimension.name);
                        d3.select(this).select(".corrRect")
                            .attr("fill", corrColorScale(c))
                            .attr("opacity", 1);
                        d3.select(this).select(".corrLabel")
                            .text(c.toFixed(2))
                            .attr("opacity", 1);
                    }
                } else {
                    d3.select(this).select(".corrRect")
                        .attr("opacity", 0);
                    d3.select(this).select(".corrLabel")
                        // .text("r")
                        .attr("opacity", 0);
                }
            });
    }

    function getCategoryProbabilityColor(dim, index) {
        if (!hasActiveSelections || dim.selectedBins[index] == 0) {
            return zeroProbabilityColor;
        }
        return probabilityColorScale(dim.selectedBins[index] / dim.bins[index]);
    }

    function updateSelectionGraphics() {
        let leftActiveDim;
        let rightActiveDim;
        svg.selectAll(".jointProbLine").remove();
        svg.selectAll(".dimension")
            .each(function(dim) {
                if (dim.type === 'categorical') {
                    for (index in dim.selectedBins) {
                        d3.select(this).select(`#probRectCat${index}`)
                            .attr("fill", getCategoryProbabilityColor(dim, index));
                        
                        d3.select(this).select(`#probRectCatTitle${index}`)
                            .text(getCategoryProbabilityTooltip(dim, index));
                            // .attr("fill", probabilityColorScale(dim.selectedBins[index] / dim.bins[index]));
                        // if (index == 1) {
                        //     console.log(dim.selectedBins[index] + "  " + dim.bins[index]);
                        // }
                        // if (hasActiveSelections) {
                        //     d3.select(this).select(`#cat${index}`)
                        //         .attr("fill", probabilityColorScale(dim.selectedBins[index] / dim.bins[index]));
                        // } else {
                        //     d3.select(this).select(`#cat${index}`)
                        //         .attr("fill", probabilityColorScale(dim.bins[index] / chartData.length));
                        // }

                        let isActive = false;
                        d3.select(this).selectAll(".jointProbLine").remove();
                        if (actives && actives.length > 0) {
                            // console.log(actives);
                            for (let i = 0; i < actives.length; i++) {
                                if (actives[i].dimension.name === dim.name) {
                                    // console.log("drawing line " + dim.name);
                                    d3.select(this).append("line")
                                        .attr("class", "jointProbLine")
                                        .attr("x1", 0)
                                        .attr("y1", y[dim.name].range()[0])
                                        // y[dim.name].domain()[0])
                                        .attr("x2", 0)
                                        .attr("y2", y[dim.name].range()[0] + corrTotalHeight)
                                        // .attr("y2", y[dim.name].range()[0] + 20)
                                        // .attr("y2", y[dim.name].domain()[0] + 20)
                                        .attr("stroke", jointProbStrokeColor)
                                        .lower();
                                    if (leftActiveDim) {
                                        leftActiveDim = x(dim.name) < x(leftActiveDim.name) ? dim : leftActiveDim;
                                    } else {
                                        leftActiveDim = dim;
                                    }
                                    if (rightActiveDim) {
                                        rightActiveDim = x(dim.name) > x(rightActiveDim.name) ? dim : rightActiveDim;
                                    } else {
                                        rightActiveDim = dim;
                                    }
                                    
                                }
                            }
                        }
                    }
                    
                    
                }
            });
        
        // console.log(`leftJointProbX: ${leftJointProbX}  rightJointProbX: ${rightJointProbX}`);
        if (leftActiveDim && rightActiveDim) {
            const leftX = x(leftActiveDim.name);
            const rightX = x(rightActiveDim.name);
            const centerX = (leftX + rightX) / 2.;
            
            // .attr("fill", (d) => {
            //     if (d.bins[index] == 0) {
            //         return zeroProbabilityColor;
            //     } else {
            //         return probabilityColorScale(d.bins[index] / chartData.length);
            //     }
            // })
            // calculate expected joint probability
            let expectedProb;
            for (index in actives) {
                let prob = actives[index].dimension.bins[1] / chartData.length;
                if (expectedProb) {
                    expectedProb = expectedProb * prob;
                } else {
                    expectedProb = prob;
                }
            }

            // calculate the observed joint probability
            // let observedProb = 0;
            // for (index in actives) {
            //     observedProb = observedProb + actives[index].dimension.bins[1];
            // }
            let observedProb = selected.length / chartData.length;

            // calculate the difference between expected and observed probabilities
            let diffProb = observedProb - expectedProb;

            let leadLineBottom = y[leftActiveDim.name].range()[0] + corrTotalHeight;
            svg.append("line")
                .attr("class", "jointProbLine")
                .attr("x1", x(leftActiveDim.name))
                .attr("y1", leadLineBottom)
                // .attr("y1", y[leftActiveDim.name].range()[0] + 20)
                .attr("x2", x(rightActiveDim.name))
                .attr("y2", leadLineBottom)
                // .attr("y2", y[rightActiveDim.name].range()[0] + 20)
                .attr("stroke", jointProbStrokeColor);
            svg.append("line")
                .attr("class", "jointProbLine")
                .attr("x1", centerX)
                .attr("y1", leadLineBottom)
                // .attr("y1", y[leftActiveDim.name].range()[0] + 20)
                .attr("x2", centerX)
                .attr("y2", leadLineBottom + jointProbLineHeight)
                // .attr("y2", y[leftActiveDim.name].range()[0] + 30)
                .attr("stroke", jointProbStrokeColor);
            svg.append("text")
                .attr("class", "jointProbLine")
                // .attr("y", y[leftActiveDim.name].range()[0] + 40)
                .attr("y", leadLineBottom + jointProbLineHeight + jointProbTextHeight)
                .attr("x", centerX)
                .style("text-anchor", "middle")
                .style("font-family", "sans-serif")
                .style("font-size", 10)
                .text(`Expected Prob: ${expectedProb.toFixed(4)}`);
            svg.append("text")
                .attr("class", "jointProbLine")
                // .attr("y", y[leftActiveDim.name].range()[0] + 50)
                .attr("y", leadLineBottom + jointProbLineHeight + (2 * jointProbTextHeight))
                .attr("x", centerX)
                .style("text-anchor", "middle")
                .style("font-family", "sans-serif")
                .style("font-size", 10)
                .text(`Observed Prob: ${observedProb.toFixed(4)}`);
            svg.append("text")
                .attr("class", "jointProbLine")
                .attr("y", leadLineBottom + jointProbLineHeight + (3 * jointProbTextHeight))
                // .attr("y", y[leftActiveDim.name].range()[0] + 60)
                .attr("x", centerX)
                .style("text-anchor", "middle")
                .style("font-family", "sans-serif")
                .style("font-size", 10)
                .text(`Difference: ${diffProb.toFixed(4)}`);

        }
    }

    function selectLines(actives) {
        if (actives.length > 0) {
            selected = [];
            unselected = [];
            
            chartData.map(function (d) {
                if (queryMode === "AND") {
                    return actives.every(function (p, i) {
                        if (p.dimension.type === 'categorical') {
                            return p.extent.indexOf(d[p.dimension.name]) >= 0;
                        } else {
                            return d[p.dimension.name] <= p.extent[0] && d[p.dimension.name] >= p.extent[1];
                        }
                    }) ? selected.push(d) : unselected.push(d);
                } else if (queryMode === "OR") {
                    let lineSelected = false;
                    for (index in actives) {
                        if (actives[index].dimension.type === 'categorical') {
                            if (actives[index].extent.indexOf(d[actives[index].dimension.name]) >= 0) {
                                lineSelected = true;
                                break;
                            }
                        } else {
                            if (d[actives[index].dimension.name] <= actives[index].extent[0] && d[actives[index].dimension.name] >= actives[index].extent[1]) {
                                lineSelected = true;
                                break;
                            }
                        }
                    }
                    return lineSelected ? selected.push(d) : unselected.push(d);
                }
            });
        } else {
            selected = chartData;
            unselected = [];
        }
        // chartData.map(function (d) {
        //     return actives.every(function (p, i) {
        //         if (p.dimension.type === 'categorical') {
        //             return p.extent.indexOf(d[p.dimension.name]) >= 0;
        //         } else {
        //             return d[p.dimension.name] <= p.extent[0] && d[p.dimension.name] >= p.extent[1];
        //         }
        //     }) ? selected.push(d) : unselected.push(d);
        // });

        dimensions.forEach((dim) => {
            dim.selectedBins = [0, 0];
            selected.forEach((d) => {
                dim.selectedBins[d[dim.name]]++;
            })
        });
        calculateDimensionCorrs();
    }

    function drawLines() {
        drawBackgroundLines();
        drawForegroundLines();

        const percentSelected = ((selected.length / chartData.length) * 100.).toFixed(1);
        d3.select(".selection_label")
            .text(`${selected.length} / ${chartData.length} (${percentSelected}%) Lines Selected`);
        let selectionLineWidth = width * (selected.length / chartData.length);
        d3.select(".selection_line")
            .transition().duration(200).delay(100)
            .attr("x2", selectionLineWidth);
    }

    function drawForegroundLines() {
        foreground.clearRect(0, 0, width + 1, height + 1);
        if (showSelected) {
            selected.map(function (d) {
                path(d, foreground);
            });
        }
    }

    function drawBackgroundLines() {
        background.clearRect(0, 0, width + 1, height + 1);
        if (showUnselected) {
            if (unselected) {
                unselected.map(function (d) {
                    path(d, background);
                });
            }
        }
    }

    function calculateDimensionCorrs() {
        const data = (selected && selected.length > 0) ? selected : chartData;
        // console.log(data);
        dimensions.forEach((dim1) => {
            if (dim1.type ==='categorical') {
                dim1.corrMap = new Map();
                d1 = data.map(d => d[dim1.name]);
                // console.log(d1);
                dimensions.forEach((dim2) => {
                    if (dim2.type === 'categorical') {
                        d2 = data.map(d => d[dim2.name]);
                        c = corr(d1, d2);
                        // console.log(`${dim1.name}:${dim2.name} = ${c}`);
                        dim1.corrMap.set(dim2.name, c);
                    }
                })
            } else if (dim1.type === 'numerical') {
                dim1.corrMap = new Map();
                let d1 = data.map(d => d[dim1.name]);
                dimensions.forEach((dim2) => {
                    if (dim2.type === 'numerical') {
                        let d2 = data.map(d => d[dim2.name]);
                        let d1_filtered = [];
                        let d2_filtered = [];
                        for (let i = 0; i < d1.length; i++) {
                            if (!isNaN(d1[i]) && !isNaN(d2[i])) {
                                d1_filtered.push(d1[i]);
                                d2_filtered.push(d2[i]);
                            }
                        }
                        c = corr(d1_filtered, d2_filtered);
                        dim1.corrMap.set(dim2.name, c);
                    }
                });
                // console.log(dim1.corrMap);
            }
        })
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

    chart.dimensions = function (value) {
        if (!arguments.length) {
            return dimensions;
        }
        dimensions = value;
        return chart;
    }

    chart.width = function (value) {
        if (!arguments.length) {
            return width;
        }
        width = value - margin.left - margin.right;
        return chart;
    }

    chart.height = function (value) {
        if (!arguments.length) {
            return height;
        }
        height = value - margin.top - margin.bottom;
        return chart;
    }

    chart.titleText = function (value) {
        if (!arguments.length) {
            return titleText;
        }
        titleText = value;
        return chart;
    }

    chart.showSelectedLines = function (value) {
        if (!arguments.length) {
            return showSelected;
        }
        showSelected = value;
        if (foreground) {
            drawLines();
        }
        return chart;
    }

    chart.showUnselectedLines = function (value) {
        if (!arguments.length) {
            return showUnselected;
        }
        showUnselected = value;
        if (background) {
            drawLines();
        }
        return chart;
    }

    chart.selectedLineOpacity = function (value) {
        if (!arguments.length) {
            return selectedLineOpacity;
        }
        selectedLineOpacity = value;
        if (foreground) {
            foreground.globalAlpha = selectedLineOpacity;
            drawForegroundLines();
        }
        return chart;
    }

    chart.queryMode = function (value) {
        if (!arguments.length) {
            return queryMode;
        }
        queryMode = value;
        return chart;
    }

    chart.unselectedLineOpacity = function (value) {
        if (!arguments.length) {
            return unselectedLineOpacity;
        }
        unselectedLineOpacity = value;
        if (background) {
            background.globalAlpha = unselectedLineOpacity;
            drawBackgroundLines();
        }
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
        // resizeChart();
        return chart;
    }

    return chart;
}