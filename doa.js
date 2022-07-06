const EventEmitter = require('events');
const contrib = require('./contrib.js');
const logger = require('./logger.js');
const prp = require('./prettyPrint.js');
const people = require("./people.js");

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let doa = 90;
let data = [];
let direction = 0;
let roll_to = 0;
let section_start_time;
let avrg_sp_t = 0;
let person_speaking = 0;

exports.getDoa = function getDoa() {
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
    let start_dt = new Date();
    section_start_time = start_dt.getTime();
    const pyshell = contrib.setUp();

    let myEmitter = new EventEmitter();
    myEmitter.on('contrib', function(msg) {
      // Timestamp for section
      let dt = new Date();
      let time_stmp = dt.getFullYear() + '-' + dt.getMonth() + '-' + dt.getDate() + ' ' + dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds() + '.' + dt.getMilliseconds()

      // Section data
      let log_vars = JSON.parse(msg)
      let entry = {'timestamp': time_stmp,
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
      'inclusivity': log_vars.inclusivity}
      data.push(entry);

      section_start_time = log_vars.start_time;
      person_speaking = log_vars.person_speaking;

      // Overall data
      avrg_sp_t = log_vars.avrg_speech_time;
      let responses = [log_vars.response1, log_vars.response2, log_vars.response3]
      let scores = [log_vars.score1, log_vars.score2, log_vars.score3]

      // Print data
      prp.pretty_print(data[data.length - 1]);

      // Interest and who to roll to
      if (log_vars.person_speaking != 0) {
        let speaker_i = log_vars.person_speaking - 1;
        let response_sum = 0;
        for (i = 0; i < people.getNumOfPeople(); i++) {
          response_sum += responses[speaker_i][i];
        }

        let interests = []
        for (i=0;i<people.getNumOfPeople();i++) {
          interests.push(0);
        }
        console.log(interests);

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
        }
      }
      if (roll_to != 0){
        direction = people.pers2dir(roll_to);
      }
      // DOA
      doa = log_vars.doa;
    });

    contrib.contrib(pyshell, myEmitter);
    data = this.getData();

    process.on('SIGINT', async () => {
      await delay(1000).then(() => {
        logger.createConvoLogfile(data, start_dt).then(() => {
          process.exit(0);
        });
      });
    });

  } catch (error) {
    console.error(error);
  }
}