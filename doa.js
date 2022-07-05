const { PythonShell } = require('python-shell');
const EventEmitter = require('events');
const contrib = require('./contrib.js');
const logger = require('./logger.js');
const prp = require('./prettyPrint.js');


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function readMessage(shell) {
  return new Promise((resolve) => {
    shell.on('message', function(message) {
      resolve(message);
    })
  })
}

function pers2dir(person) {
  const directions = {1: 60, 2: 180, 3: 300};
  return directions[person];
}

exports.dir2pers = function dir2pers(direction) {
  people = {1: [0, 119], 2: [120, 269], 3: [270, 359]};
  person = 0;
  for (const [p, d] of Object.entries(people)){
    if (d[0] <= direction && direction <= d[1]){
      person = p;
    }
  }
  return person;
}

exports.main = async function main() {
  var pyshell = new PythonShell('doa.py');
  pyshell.send('main');
}

exports.setUp = function setUp() {
  var shell = new PythonShell('doa.py');
  shell.send('setup');
  return shell
}

exports.endShell = function endShell(shell) {
  shell.end(function(err, code, signal) {
    if (err) throw err
    console.log("The exit code was " + code);
    console.log("The exit signal was " + signal);
    console.log("finished");
  })
}

exports.doa = async function doa(shell) {
  shell.send('doa');
  msg = Number(await readMessage(shell));
  //console.log(msg);
  return msg;
}

exports.doaEvent = async function doaEvent(shell, emitter) {
  shell.send('doa');
  msg = Number(await readMessage(shell));
  console.log(msg)
  emitter.emit('doa', msg);
  //return msg
}

exports.doaRepeat = async function doaRepeat(shell, emitter) {
  shell.send('doaRepeat');
  msg = 0;
  shell.on('message', function(message) {
    msg = Number(message);
    emitter.emit('doa', msg);
    //console.log(msg);
  });
  await readMessage(shell);
}

let doa = 90;
let data = [];
let direction = 0;
let roll_to = 0;
let section_start_time;
let avrg_sp_t = 0;
let person_speaking = 0;

exports.getDoa = function getDoa() {
  // return this.coord_convert(doa);
  return doa
}

exports.getData = function getData() {
  return data;
}

exports.getDirection = function getDirection() {
  return direction;
}

exports.getRollTo = function getRollTo() {
  return roll_to;
}

exports.getSectionStartTime = function getSectionStartTime() {
  return section_start_time;
}

exports.setSectionStartTime = function getSectionStartTime(new_time) {
  section_start_time = new_time;
}

exports.getAvrgSpT = function getAvrgSpT() {
  return avrg_sp_t;
}

exports.setAvrgSpT = function setAvrgSpT(new_time) {
  avrg_sp_t = new_time;
}

exports.getPersonSpeaking = function getPersonSpeaking() {
  return person_speaking;
}

exports.target_spoke = function target_spoke(person) {
  let spoke = person_speaking == person;
  if (spoke) {
    console.log('Target spoke');
  }
  return spoke;
}

exports.streamDoa = async function streamDoa() {
  try {
    // global.doa = 90;
    // global.data = [];
    // global.direction = 0;
    let start_dt = new Date();
    section_start_time = start_dt.getTime();
    // let data = [];
    const pyshell = contrib.setUp();
    // let roll_to = 0;

    let myEmitter = new EventEmitter();
    myEmitter.on('contrib', function(msg) {
      let dt = new Date();
      let time_stmp = dt.getFullYear() + '-' + dt.getMonth() + '-' + dt.getDate() + ' ' + dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds() + '.' + dt.getMilliseconds()

      let log_vars = JSON.parse(msg)
      // console.log(log_vars);

      data.push({
        'timestamp': time_stmp,
        'doa': log_vars.doa,
        'person_speaking': log_vars.person_speaking,
        'start_time': log_vars.start_time,
        'section_time': log_vars.section_time, 
        'avrg_speech_time': log_vars.avrg_speech_time, 
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

      section_start_time = log_vars.start_time;
      avrg_sp_t = log_vars.avrg_speech_time;
      person_speaking = log_vars.person_speaking;

      let responses = [log_vars.response1, log_vars.response2, log_vars.response3]
      let scores = [log_vars.score1, log_vars.score2, log_vars.score3]

      // prp.pretty_print(log_vars);
      // prp.pretty_print(data[data.length - 1]);
      //console.log(time_stmp + " Log: " + msg);
      if (log_vars.person_speaking != 0) {
        let speaker_i = log_vars.person_speaking - 1;
        let response_sum = 0;
        for (i = 0; i < 3; i++) {
          response_sum += responses[speaker_i][i];
        }

        let interests = [0, 0, 0]

        for (i = 0; i < 3; i++) {
          if (i != speaker_i) {
            let prob_other_repsonds = 0.5;
            if (response_sum != 0) {
              prob_other_repsonds = 1 - (responses[speaker_i][i] / response_sum);
            }
            let interest = scores[i] * prob_other_repsonds;
            interests[i] = interest;
          }
        }
        let interest_sum = 0;
        for (i = 0; i < 3; i++) {
          interest_sum += interests[i];
        }
        if (interest_sum != 0) {
          roll_to = interests.indexOf(Math.max(...interests)) + 1;
          // console.log('Roll to Person ' + roll_to);
        }
      }

      // global.doa = log_vars.doa;
      doa = log_vars.doa;
      // global.data = data;
      // global.roll_to = roll_to;
      if (roll_to != 0){
        // global.direction = pers2dir(roll_to);
        direction = pers2dir(roll_to);
      }
    });

    contrib.contrib(pyshell, myEmitter);
    data = this.getData();

    process.on('SIGINT', async () => {
      await delay(2000).then(() => {
        logger.createConvoLogfile(data, start_dt).then(() => {
          process.exit(0);
        });
      });
    });

  } catch (error) {
    console.error(error);
  }
}