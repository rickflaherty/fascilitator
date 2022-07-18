const createCsvWriter = require('csv-writer').createObjectCsvWriter;

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

exports.createConvoLogfile = async function createConvoLogfile(data, n, start_dt) {
  const path = 'logs/' + start_dt.getFullYear() + '-' + start_dt.getMonth() + '-' + start_dt.getDate() + '-' + start_dt.getHours() + '-' + start_dt.getMinutes() + '-' + start_dt.getSeconds() + '.csv';
  let header = [
    { id: 'timestamp', title: 'Timestamp' },
    { id: 'doa', title: 'DOA' },
    { id: 'person_speaking', title: 'Person Speaking' },
  ]
  for (let i=0;i<n;i++) {header.push({id: `speech${i}`, title: `Times Person ${i} spoke`});}
  for (let i=0;i<n;i++) {header.push({id: `response${i}`, title: `Responses to Person ${i}`});}
  for (let i=0;i<n;i++) {header.push({id: `score${i}`, title: `Spreadability of Person ${i}`});}
  header.push({ id: 'exclusivity', title: 'Exclusivity' });
  header.push({ id: 'next_speaker', title: 'Should Speak Next' });
  const csvWriter = createCsvWriter({
    path: path,
    header: header
  });

  await csvWriter.writeRecords(data).then(() => console.log('The CSV file was written successfully'));
}

