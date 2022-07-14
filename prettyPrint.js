const readline = require('readline');
const people = require('./people');
const facil = require('./facilitate');
const odo = require('./odo');
const sp = require('./doa');

exports.pretty_print = function pretty_print(entry) {
  // let date = new Date(entry.timestamp);
  process.stdout.write('Timestamp: ' + entry.timestamp + '\n')
  process.stdout.write('Section time: ' + entry.section_time + '\n')
  process.stdout.write('Average speech time: ' + entry.avrg_speech_time + '\n')
  process.stdout.write('DOA: |');
  for (i = 0; i < Math.floor(entry.doa / 12); i++) {
    process.stdout.write(' ');
  }
  process.stdout.write('|');
  for (i = 30; i > Math.floor(entry.doa / 12); i--) {
    process.stdout.write(' ');
  }
  process.stdout.write('| ' + entry.doa + 'º\n');

  process.stdout.write('Person speaking: ' + entry.person_speaking + '\n');

  const n = people.getNumOfPeople()
  for (let i=0;i<n;i++) {
    let score_cubes = '';
    for (let j = 0; j < Math.floor(10 * entry.scores[i]); j++) {
      score_cubes += '■';
    }
    process.stdout.write(`Person ${i}: 
    Spoke ${entry.speech[i]} times
    Response: ${entry.responses[i]}
    Score: ${Math.round(entry.scores[i]*100)}% | ${score_cubes}
`);
  }

  let exclusivity_cubes = '';
  for (i = 0; i < Math.floor(10 * entry.exclusivity); i++) {
    exclusivity_cubes += '■';
  }
  process.stdout.write(`Exclusivity: ' ${Math.round(entry.exclusivity * 100)}% | ${exclusivity_cubes}`);
  process.stdout.write('\n\n');
}

function lineClear(n) {
  readline.clearLine(process.stdout, 0);
  readline.clearLine(process.stdout, 0);
  readline.clearLine(process.stdout, 0);
  // readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0, n);
}

exports.ppSphero = function ppSphero(){
  lineClear(8);
  process.stdout.write('DOA: ' + sp.getDoa() + 'º\n');
  process.stdout.write('Pos: ' + odo.getPos() + ' Pos(º): '+ odo.getPosa() + ' Dist: '+ odo.getDist() + '\n');
  process.stdout.write('Mode: ' + facil.getMovMode() + '\n');
  process.stdout.write('Target: ' + facil.getTargetPerson() + '\n');
  // process.stdout.write('\r\n');
}