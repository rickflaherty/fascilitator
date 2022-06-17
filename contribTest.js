var EventEmitter = require('events');
var contrib = require('./contrib.js');
var logger = require("./logger.js");


function pretty_print(entry) {
  process.stdout.write('Timestamp: ' + entry.timestamp + '\n')
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
  //process.stdout.write('\nInclusivity: '+entry.inclusivity + '\n\n');
  process.stdout.write('\nInclusivity: ' + Math.round(entry.inclusivity * 100) + '% |');
  for (i = 0; i < Math.floor(10 * entry.inclusivity); i++) {
    process.stdout.write('■');
  }
  process.stdout.write('\n\n');
}


var start_dt = new Date();
var data = [];
var roll_to = 0;

var myEmitter = new EventEmitter();
myEmitter.on('contrib', function(msg) {
  var dt = new Date();
  var time_stmp = dt.getFullYear() + '-' + dt.getMonth() + '-' + dt.getDate() + ' ' + dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds() + '.' + dt.getMilliseconds()

  log_vars = JSON.parse(msg)
  // console.log(log_vars);

  data.push({
    'timestamp': time_stmp,
    'doa': log_vars.doa,
    'person_speaking': log_vars.person_speaking,
    'start_time': log_vars.start_time,
    'speech1': log_vars.speech1,
    'speech2': log_vars.speech2,
    'speech3': log_vars.speech3,
    'response1': log_vars.response1,
    'response2': log_vars.response2,
    'response3': log_vars.response3,
    'score1': log_vars.score1,
    'score2': log_vars.score2,
    'score3': log_vars.score3,
    'inclusivity': log_vars.inclusivity
  });

  var responses = [log_vars.response1, log_vars.response2, log_vars.response3]
  var scores = [log_vars.score1, log_vars.score2, log_vars.score3]

  pretty_print(log_vars);
  //console.log(time_stmp + " Log: " + msg);
  if (log_vars.person_speaking != 0) {
    var speaker_i = log_vars.person_speaking - 1;
    var response_sum = 0;
    for (i = 0; i < 3; i++) {
      response_sum += responses[speaker_i][i];
    }

    var interests = [0, 0, 0]

    for (i = 0; i < 3; i++) {
      if (i != speaker_i) {
        var prob_other_repsonds = 0.5;
        if (response_sum != 0) {
          prob_other_repsonds = 1 - (responses[speaker_i][i] / response_sum);
        }
        var interest = scores[i] * prob_other_repsonds;
        // console.log('Interest ' + (i + 1) + ': ' + interest, prob_other_repsonds, scores[i]);
        interests[i] = interest;
      }
    }
    var interest_sum = 0;
    for (i = 0; i < 3; i++) {
      interest_sum += interests[i];
    }
    if (interest_sum != 0) {
      roll_to = interests.indexOf(Math.max(...interests)) + 1;
      console.log('Roll to Person ' + roll_to);
    }
  }
  if (roll_to != 0){
    global.direction = pers2dir(roll_to);
  }
});

var pyshell = contrib.setUp();
contrib.contrib(pyshell, myEmitter);

process.on('SIGINT', async () => {
  console.log('SIGNIT');
  await delay(2000).then(() => {
    console.log('Create File');
    logger.createConvoLogfile(data, start_dt).then(() => {
      process.exit(0);
    });
  });
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

