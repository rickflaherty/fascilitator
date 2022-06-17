var createCsvWriter = require('csv-writer').createObjectCsvWriter;

exports.createDoaLogfile = function createDoaLogfile(data, start_dt) {
  const path = 'logs/' + start_dt.getFullYear() + '-' + start_dt.getMonth() + '-' + start_dt.getDate() + '-' + start_dt.getHours() + '-' + start_dt.getMinutes() + '-' + start_dt.getSeconds() + '.csv';
  const csvWriter = createCsvWriter({
    path: path,
    header: [
      { id: 'timestamp', title: 'Timestamp' },
      { id: 'doa', title: 'DOA' },
    ]
  });
  csvWriter
    .writeRecords(data)
    .then(() => console.log('The CSV file was written successfully'));
}

exports.createConvoLogfile = async function createConvoLogfile(data, start_dt) {
  const path = 'logs/' + start_dt.getFullYear() + '-' + start_dt.getMonth() + '-' + start_dt.getDate() + '-' + start_dt.getHours() + '-' + start_dt.getMinutes() + '-' + start_dt.getSeconds() + '.csv';
  const csvWriter = createCsvWriter({
    path: path,
    header: [
      { id: 'timestamp', title: 'Timestamp' },
      { id: 'doa', title: 'DOA' },
      { id: 'person_speaking', title: 'Person Speaking' },
      { id: 'speech1', title: 'Times Person 1 has Spoken' },
      { id: 'speech2', title: 'Times Person 2 has Spoken' },
      { id: 'speech3', title: 'Times Person 3 has Spoken' },
      { id: 'response1', title: 'Responses to Person 1' },
      { id: 'response2', title: 'Responses to Person 2' },
      { id: 'response3', title: 'Responses to Person 3' },
      { id: 'score1', title: 'Person 1\'s Score' },
      { id: 'score2', title: 'Person 2\'s Score' },
      { id: 'score3', title: 'Person 3\'s Score' },
      { id: 'inclusivity', title: 'Inclusivity' },
    ]
  });
  // console.log('log', data)
  await csvWriter.writeRecords(data).then(() => console.log('The CSV file was written successfully'));
}

