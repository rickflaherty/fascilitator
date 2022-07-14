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

exports.setSectionStartTime = function setSectionStartTime(new_time) {
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
  // if (spoke) {
  //   console.log('Target spoke');
  // }
  return spoke;
}

exports.streamDoa = async function streamDoa(n) {
  try {
    let start_dt = new Date();
    section_start_time = start_dt.getTime();
    const pyshell = contrib.setUp(n);

    let myEmitter = new EventEmitter();
    myEmitter.on('contrib', function(msg) {
      // Timestamp for section
      let dt = new Date();
      let time_stmp = dt.getFullYear() + '-' + dt.getMonth() + '-' + dt.getDate() + ' ' + dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds() + '.' + dt.getMilliseconds()

      // Section data
      let log_vars = JSON.parse(msg)
      let snap = {
        'timestamp': time_stmp,
        'start_time': log_vars.start_time,
        'section_time': log_vars.section_time, 
        'avrg_speech_time': log_vars.avrg_speech_time, 
        'doa': log_vars.doa,
        'person_speaking': log_vars.person_speaking,
        'speech': log_vars.speech, 
        'responses': log_vars.responses,
        'scores': log_vars.scores,
        'exclusivity': log_vars.exclusivity
      }
      data.push(snap);

      section_start_time = log_vars.start_time * 1000;
      person_speaking = log_vars.person_speaking;

      // Overall data
      avrg_sp_t = log_vars.avrg_speech_time;
      let responses = log_vars.responses
      let scores = log_vars.scores

      // Print data
      prp.pretty_print(data[data.length - 1]);

      // Interest and who to roll to
      // TODO Move this to the Python code
      // vars: speaker, num_of_people, responses, scores, participants[speaker][mid]
      if (log_vars.person_speaking != null) {
        let speaker_i = log_vars.person_speaking;
        let response_sum = 0;
        for (i = 0; i < people.getNumOfPeople(); i++) {
          response_sum += responses[speaker_i][i];
        }

        let interests = []
        for (i=0;i<people.getNumOfPeople();i++) {
          interests.push(0);
        }

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