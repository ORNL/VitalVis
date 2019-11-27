const readFiles = (files, fileReadComplete) => {
  if (files) {
    let promises = [];
    for (let i = 0; i < files.length; i++) {
      let promise = new Promise(resolve => {
        let reader = new FileReader();
        reader.readAsText(files[i]);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
      promises.push(promise);
    }

    let allFileData = [];
    Promise.all(promises)
      .then(fileContents => {
        fileContents.forEach(fileContent => {
            try {
                const fileData = JSON.parse(fileContent);
                processJSONData(fileData);
                allFileData.push(fileData);
            } catch (error) {
                console.log(error);
            }
        });
        fileReadComplete(allFileData);
      })
      .catch(error => {
        console.log(error);
      });
  }
};

const processJSONData = data => {
  const fileDateExtent = [null, null];
  
  let newDrugArray = [];
  Object.keys(data.drugs).forEach(drugKey => {
    data.drugs[drugKey].values.forEach(d => {
      d.time = new Date(d.time);
      if (!fileDateExtent[0] || d.time < fileDateExtent[0]) {
        fileDateExtent[0] = d.time;
      }
      if (!fileDateExtent[1] || d.time > fileDateExtent[1]) {
        fileDateExtent[1] = d.time;
      }
      newDrugArray.push({
        group: data.drugs[drugKey].group,
        name: data.drugs[drugKey].name,
        time: d.time,
        value: d.value,
      })
    });
  });
  data.drugs = newDrugArray;

  let newFluidsArray = [];
  Object.keys(data.fluids).forEach(fluidKey => {
    data.fluids[fluidKey].values.forEach(d => {
      d.time = new Date(d.time);
      if (!fileDateExtent[0] || d.time < fileDateExtent[0]) {
        fileDateExtent[0] = d.time;
      }
      if (!fileDateExtent[1] || d.time > fileDateExtent[1]) {
        fileDateExtent[1] = d.time;
      }
      newFluidsArray.push({
        group: data.fluids[fluidKey].group,
        name: data.fluids[fluidKey].name,
        time: d.time,
        value: d.value,
      })
    });
  });
  data.fluids = newFluidsArray;

  let newVitalsArray = [];
  Object.keys(data.vitals).forEach(vitalKey => {
    data.vitals[vitalKey].values.forEach(d => {
      d.time = new Date(d.time);
      if (!fileDateExtent[0] || d.time < fileDateExtent[0]) {
          fileDateExtent[0] = d.time;
      }
      if (!fileDateExtent[1] || d.time > fileDateExtent[1]) {
          fileDateExtent[1] = d.time;
      }
    });
    let sortedValues = data.vitals[vitalKey].values.map(d => d.value).sort(d3.ascending);
    data.vitals[vitalKey].mean = d3.mean(sortedValues);
    data.vitals[vitalKey].stdev = d3.deviation(sortedValues);
    data.vitals[vitalKey].median = d3.median(sortedValues);
    data.vitals[vitalKey].q1 = d3.quantile(sortedValues, 0.25);
    data.vitals[vitalKey].q3 = d3.quantile(sortedValues, 0.75);
    data.vitals[vitalKey].iqr = data.vitals[vitalKey].q3 - data.vitals[vitalKey].q1;
    data.vitals[vitalKey].min = sortedValues[0];
    data.vitals[vitalKey].max = sortedValues[sortedValues.length - 1];
    data.vitals[vitalKey].r0 = Math.max(data.vitals[vitalKey].min, data.vitals[vitalKey].q1 - data.vitals[vitalKey].iqr * 1.5);
    data.vitals[vitalKey].r1 = Math.min(data.vitals[vitalKey].max, data.vitals[vitalKey].q3 + data.vitals[vitalKey].iqr * 1.5);
    newVitalsArray.push(data.vitals[vitalKey]);
  });
  data.vitals = newVitalsArray;

  data.dateExtent = fileDateExtent;
  data.durationSec = (fileDateExtent[1] - fileDateExtent[0]) / 60000.;
};
