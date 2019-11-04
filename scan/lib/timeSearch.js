
function scanTimeseries(scanPattern, timeseries, valueAccessor) {
    let scanExtent = d3.extent(scanPattern, d => d.date);
    let scanLengthMillis = scanExtent[1] - scanExtent[0];
    console.log(scanExtent);
    
    let dtwScanPattern = [];
    scanPattern.forEach((d) => {
        dtwScanPattern.push([d.date - scanExtent[0], valueAccessor(d)]);
        // let millisOffset = d.date - scanExtent[0];
        // pattern.push({
        //     date: d.date,
        //     millis: d.date - scanExtent[0],
        //     value: d.value,
        // });
        // [millisOffset, d.value]);
    });
    console.log(dtwScanPattern);
    dtwScanPattern = normalize(dtwScanPattern);
    console.log(dtwScanPattern);

    let timeseriesExtent = d3.extent(timeseries, d => d.date);
    let timeseriesLengthMillis = timeseriesExtent[1] - timeseriesExtent[0];
    console.log(timeseriesExtent);
    let dtwTimeseries = [];
    timeseries.forEach((d) => {
        dtwTimeseries.push([d.date - timeseriesExtent[0], valueAccessor(d)]);
        // let millisOffset = d.date - timeseriesExtent[0];
        // source.push([millisOffset, d.value]);
        // source.push({
        //     date: d.date,
        //     millis: d.date - timeseriesExtent[0],
        //     value: d.value,
        // })
    });
    console.log(dtwTimeseries);
    // dtwTimeseries = normalizePattern(dtwTimeSeries);
    // console.log(dtwTimeSeries);

    let scanResults = [];
    let stepSize = scanLengthMillis / 4.;
    let currentStart = 0;
    while (currentStart < timeseriesLengthMillis) {
        // find start and end indices in source array
        let startIndex = findNearestIndex(currentStart, dtwTimeseries);
        let endIndex = findNearestIndex(currentStart + scanLengthMillis, dtwTimeseries);
        console.log(`${currentStart}  --  ${currentStart + scanLengthMillis}`)
        console.log(`startIndex: ${startIndex}  endIndex: ${endIndex}`);
        
        // slice source between start and end indices from source array
        let dtwSegment = dtwTimeseries.slice(startIndex, endIndex + 1);
        let timeseriesSegment = timeseries.slice(startIndex, endIndex + 1);
        console.log(dtwSegment);
        dtwSegment = normalize(dtwSegment);

        // call dtw to comparse slice to pattern
        let dtw = new DynamicTimeWarping(dtwScanPattern, dtwSegment, function (a, b) {
            // let xDiff = a.millis - b.millis;
            // let yDiff = a.value - b.value;
            let xDiff = a[0] - b[0];
            let yDiff = a[1] - b[1];
            return diff = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
        });
        console.log(`dtw result: ${dtw.getDistance() / dtw.getPath().length}`);

        // store results and slice in object within scanresults
        scanResults.push({
            series: timeseriesSegment,
            // dtw: dtw,
            dtwPath: dtw.getPath(),
            dtwDistance: dtw.getDistance() / dtw.getPath().length,
        });

        // update start position to next step
        currentStart = currentStart + stepSize;
    }

    return scanResults;
}

function normalize (data) {
    let xMean = 0;
    let yMean = 0;
    let diffData = [];
    for (let i in data) {
        xMean = xMean + data[i][0];
        yMean = yMean + data[i][1];
    }
    xMean = xMean / data.length;
    yMean = yMean / data.length;
    for (let i in data) {
        diffData[i] = [data[i][0] - xMean, data[i][1] - yMean];
        if (data[i].length == 3) {
            diffData[i][2] = 1;
        }
    }
    return diffData;
}

function findNearestIndex(targetMillis, series) {
    let lastDeltaTime;
    for (let i = 0; i < series.length; i++) {
        if (series[i][0] >= targetMillis) {
        // if (series[i].millis >= targetMillis) {
            return i;
        } else {
            deltaTime = series[i][0] - targetMillis;
            // let deltaTime = series[i].millis - targetMillis;
            if (lastDeltaTime && deltaTime > 0) {
                // we just switch from looking before the target time to after the targe time
                // return the index for this or previous time based on the closer of the two
                if (Math.abs(lastDeltaTime) < Math.abs(deltaTime)) {
                    return i - 1;
                } else {
                    return i;
                }
            } else {
                lastDeltaTime = deltaTime;
            }
        }
    }
    return series.length - 1;
}