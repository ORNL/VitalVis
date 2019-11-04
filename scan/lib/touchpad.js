let touchpad = document.getElementById("touchpad");
let context = touchpad.getContext("2d");
let signature;
let mouseDown = false;
let dtw;
let lastRecord = 0;
let limit;

const touchStart = (event) => {
    let coordinates = extractData(event);
    let date = new Date();
    let milliseconds = date.getTime();
    if (lastRecord + 1000 < milliseconds) {
        let rect = touchpad.getBoundingClientRect();
        touchpad.width = rect.width;
        touchpad.height = rect.height;
        limit = (rect.width + rect.height) / 30;
        signature = coordinates;
    } else {
        coordinates[2] = 1;
        signature = signature.concat(coordinates);
    }
    lastRecord = milliseconds;
    event.preventDefault();
    event.stopPropagation();
}

const touchMove = (event) => {
    let coordinates = extractData(event);
    paintCoordinates(coordinates[coordinates.length - 1]);
    signature = signature.concat(coordinates);
    var date = new Date();
    var milliseconds = date.getTime();
    lastRecord = milliseconds;
    event.preventDefault();
    event.stopPropagation();
}

const getTimeSeriesData = () => {
    timeseries = [];
    yExtent = d3.extent(timeseriesData, (d) => d.value);
    timeseriesData.forEach((d) => {
        timeseries.push([d.x, Math.abs(d.value - yExtent[1])]);
    });
    return timeseries;
}

const touchEnd = (event) => {
    let coordinates = extractData(event);
    paintCoordinates(coordinates[coordinates.length - 1]);
    signature = signature.concat(coordinates)
    let date = new Date();
    let milliseconds = date.getTime();
    lastRecord = milliseconds;
    setTimeout(function() {
        if (lastRecord == milliseconds) {
            timeseries = getTimeSeriesData();
            console.log(timeseries);
            timeseries = prepareSignature(timeseries);
            console.log(timeseries);
            signature = prepareSignature(signature);
            console.log(signature);
            if (signature.length > 0) {
                dtw = new DynamicTimeWarping(signature, timeseries, function (a, b) {
                    let xDiff = a[0] - b[0];
                    let yDiff = a[1] - b[1];
                    return diff = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
                });
                let path = dtw.getPath();
                let result = dtw.getDistance() / path.length;
                // console.log(path);
                console.log(result);
                // console.log(signature);
                // console.log(timeseriesData);
                // let success = document.getElementById("success");
                // let fail = document.getElementById("fail");
                // let resultCanvas = document.getElementById("result");
                // document.getElementById("result-wrapper").className = "";
                // var roundedLimit = Math.round(limit * 1000) / 1000;
                // var roundedResult = Math.round(result * 1000) / 1000;
                // if (result < limit) {
                //     success.innerHTML = "<i class=\"fa fa-check-circle\"></i> Signatures are matching with a distance of " + roundedResult + " by a upper bound of " + roundedLimit + ".";
                //     success.className = "alert alert-success";
                //     fail.className = "alert alert-danger hidden";
                //     resultCanvas.style.backgroundColor = "#cdebcd";
                // } else {
                //     success.className = "alert alert-success hidden";
                //     fail.innerHTML = "<i class=\"fa fa-times-circle\"></i> Signatures are not matching with a distance of " + roundedResult + " by a upper bound of " + roundedLimit + ".";
                //     fail.className = "alert alert-danger";
                //     resultCanvas.style.backgroundColor = "#ebcdcd";
                // }
                paintResult([signature, timeseries]);
                // document.location = "/touch-signature-identification-with-javascript/#message";
            }
        }
    }, 1000);
    event.preventDefault();
    event.stopPropagation();
}

const extractData = (event) => {
    let touches = event.changedTouches;
    let coordinates = [];
    let rect = touchpad.getBoundingClientRect();
    for (let i = 0; i < touches.length; i++) {
        coordinates[i] = [touches[i].clientX - rect.left, touches[i].clientY - rect.top];
    }
    return coordinates;
}

function paintResult(signatures) {
    var colors = ["#eb00eb", "#00ebeb"];
    var result = document.getElementById("result");
    var rect = result.getBoundingClientRect();
    result.width = rect.width;
    result.height = rect.height;
    var xPlus = result.width / 2;
    var yPlus = result.height / 2;
    var context = result.getContext("2d");
    context.lineWidth = 4;
    for (var i = 0; i < signatures.length; i++) {
        context.strokeStyle = colors[i];
        context.beginPath();
        for (var j = 1; j < signatures[i].length; j++) {
            if (signatures[i][j].length == 2) {
                context.moveTo(signatures[i][j - 1][0] + xPlus, signatures[i][j - 1][1] + yPlus);
                context.lineTo(signatures[i][j][0] + xPlus, signatures[i][j][1] + yPlus);
            }
        }
        context.stroke();
    }
    context.lineWidth = 1;
    context.strokeStyle = "#ffffff";
    var dtwPath = dtw.getPath();
    for (var i = 0; i < dtwPath.length; i++) {
        context.beginPath();
        var sig1Index = dtwPath[i][0];
        var sig2Index = dtwPath[i][1];
        context.moveTo(signatures[0][sig1Index][0] + xPlus, signatures[0][sig1Index][1] + yPlus);
        context.lineTo(signatures[1][sig2Index][0] + xPlus, signatures[1][sig2Index][1] + yPlus);
        context.stroke();
    }
}

// function extractData(event, number) {
//     var touches = event.changedTouches;
//     var coordinates = [];
//     var rect = touchpads[number].getBoundingClientRect();
//     for (var i = 0; i < touches.length; i++) {
//         coordinates[i] = [touches[i].clientX - rect.left, touches[i].clientY - rect.top];
//     }
//     return coordinates;
// }

const prepareSignature = (data) => {
    var xMean = 0;
    var yMean = 0;
    var diffData = [];
    for (var i = 0; i < data.length; i++) {
        xMean = xMean + data[i][0];
        yMean = yMean + data[i][1];
    }
    xMean = xMean / data.length;
    yMean = yMean / data.length;
    for (var i = 0; i < data.length; i++) {
        diffData[i] = [data[i][0] - xMean, data[i][1] - yMean];
        if (data[i].length == 3) {
            diffData[i][2] = 1;
        }
    }
    return diffData;
}

const paintCoordinates = (coordinates) => {
    // var context = contexts[number];
    context.beginPath();
    let lastCoordinates = signature[signature.length - 1];
    context.moveTo(lastCoordinates[0], lastCoordinates[1]);
    context.lineTo(coordinates[0], coordinates[1]);
    context.strokeStyle = "#ffffff";
    context.lineWidth = 4;
    context.stroke();
}

const mouseToTouchEvent = (event) => {
    event.changedTouches = [{
        clientX: event.clientX,
        clientY: event.clientY
    }];
    return event;
}

touchpad.addEventListener("touchstart", function(event) {
    touchStart(event);
}, false);
touchpad.addEventListener("touchmove", function(event) {
    touchMove(event);
}, false);
touchpad.addEventListener("touchend", function(event) {
    touchEnd(event);
}, false);
touchpad.addEventListener("mousedown", function(event) {
    mouseDown = true;
    touchStart(mouseToTouchEvent(event));
});
touchpad.addEventListener("mousemove", function(event) {
    if (mouseDown) {
        touchMove(mouseToTouchEvent(event));
    }
});
touchpad.addEventListener("mouseup", function(event) {
    touchEnd(mouseToTouchEvent(event));
    mouseDown = false;
});