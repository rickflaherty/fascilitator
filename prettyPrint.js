const facil = require("./facilitate");
const odo = require('./odo');

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

  process.stdout.write('Person 1: \n');
  process.stdout.write('Spoke ' + entry.speech1 + ' times\n');
  process.stdout.write('  Response: ' + entry.response1 + '\n');
  process.stdout.write('  Score: ' + Math.round(entry.score1 * 100) + '% |');
  for (i = 0; i < Math.floor(10 * entry.score1); i++) {
    process.stdout.write('■');
  }
  process.stdout.write('\nPerson 2: \n');
  process.stdout.write('  Spoke ' + entry.speech2 + ' times\n');
  process.stdout.write('  Response: ' + entry.response2 + '\n');
  process.stdout.write('  Score: ' + Math.round(entry.score2 * 100) + '% |');
  for (i = 0; i < Math.floor(10 * entry.score2); i++) {
    process.stdout.write('■');
  }
  process.stdout.write('\nPerson 3: \n');
  process.stdout.write('  Spoke ' + entry.speech3 + ' times\n');
  process.stdout.write('  Response: ' + entry.response3 + '\n');
  process.stdout.write('  Score: ' + Math.round(entry.score3 * 100) + '% |');
  for (i = 0; i < Math.floor(10 * entry.score3); i++) {
    process.stdout.write('■');
  }
  //process.stdout.write('\nExclusivity: '+entry.exclusivity + '\n\n');
  process.stdout.write('\nExclusivity: ' + Math.round(entry.exclusivity * 100) + '% |');
  for (i = 0; i < Math.floor(10 * entry.exclusivity); i++) {
    process.stdout.write('■');
  }
  process.stdout.write('\n\n');
}

exports.ppSphero = function(){
  process.stdout.write('\nPos: ' + odo.getPos() + ' Pos(º): '+ odo.getPosa() + ' Dist: '+ odo.getDist());
  process.stdout.write('\nMode: ' + facil.getMovMode());
  process.stdout.write('\nTarget: ' + facil.getTarget());
  process.stdout.write('\n');
}