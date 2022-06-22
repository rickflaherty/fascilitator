var EventEmitter = require('events')
//var doa = require("./doa.js");
var contrib = require('./contrib.js');
var sphero = require("sphero");
var logger = require('./logger.js');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function coord_convert(a) {
  var b = (450 - a) % 360;
  return b;
}

function pers2dir(person) {
  directions = {1: 60, 2: 180, 3: 300};
  return directions[person];
}

function dir2pers(direction) {
  people = {1: [0, 119], 2: [120, 269], 3: [270, 359]};
  person = 0;
  for (const [p, d] of Object.entries(people)){
    if (d[0] <= direction && direction <= d[1]){
      person = p;
    }
  }
  return person;
}

function reached_target(pos, target) {
  var slack = 15;
  start_a = target - slack;
  end_a = target + slack;

  var start_dist = pos - start_a;
  var pos_rel_a = 0;
  if (start_dist > 0) {
    pos_rel_a = start_dist;
  } else {
    pos_rel_a = start_dist + 360;
  }
  
  var target_width = 2 * slack;

  var dist = Math.sqrt(global.posx * global.posx + global.posy * global.posy);
  var valid_dist = (dist > 80 || dist < 70) ? false : true;

  return (0 <= pos_rel_a && pos_rel_a <= target_width && valid_dist)
}

function target_spoke(person) {
  var spoke = global.data[global.data.length - 1]['person_speaking'] == person;
  if (spoke) {
    console.log('Target spoke');
  }
  return spoke;
}

function pretty_print(entry) {
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
  //process.stdout.write('\nInclusivity: '+entry.inclusivity + '\n\n');
  process.stdout.write('\nInclusivity: ' + Math.round(entry.inclusivity * 100) + '% |');
  for (i = 0; i < Math.floor(10 * entry.inclusivity); i++) {
    process.stdout.write('■');
  }
  process.stdout.write('\n\n');
}

async function streamOdo() {
  sprkp.streamOdometer(1);

  sprkp.on('odometer', function(data) {
  global.posx = data.xOdometer.value[0];
  //console.log('  x: ' + global.posx + data.xOdometer.units);
  global.posy = data.yOdometer.value[0];
  //console.log('  y: ' + global.posy + data.yOdometer.units);
});
}

async function streamDoa() {
  try {
    global.doa = 0;
    global.data = [];
    global.direction = 0;
    var start_dt = new Date();
    global.section_start_time = start_dt.getTime();
    var data = [];
    var pyshell = contrib.setUp();
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

      global.section_start_time = log_vars.start_time;
      global.avrg_sp_t = log_vars.avrg_speech_time;

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
            interests[i] = interest;
          }
        }
        var interest_sum = 0;
        for (i = 0; i < 3; i++) {
          interest_sum += interests[i];
        }
        if (interest_sum != 0) {
          roll_to = interests.indexOf(Math.max(...interests)) + 1;
          // console.log('Roll to Person ' + roll_to);
        }
      }

      global.doa = log_vars.doa;
      global.data = data;
      global.roll_to = roll_to;
      if (roll_to != 0){
        global.direction = pers2dir(roll_to);
      }
    });

    contrib.contrib(pyshell, myEmitter);

    process.on('SIGINT', async () => {
      await delay(2000).then(() => {
        logger.createConvoLogfile(data, start_dt).then(() => {
          process.exit(0);
        });
      });
    });

    function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  } catch (error) {
    console.error(error);
  }
}

function circle_traj(dir) {
  var posa = Math.atan2(global.posy, global.posx) * 180 / Math.PI;;
  var difference = 0;
  var comp = 0;
  var traj = 0;
  var speed = 0;

  // Calculate angle difference from DOA
  difference = dir - posa;
  if (difference < - 180) {difference += 360;}
  if (difference > 180) {difference -= 360;}

  // clockwise or anti-clockwise or no rotation
  var gen_diff = Math.ceil(difference);

  var dist = Math.sqrt(global.posx * global.posx + global.posy * global.posy);

  if (dist > 80) { // Far
    comp = 45;
  } else if (dist < 70){ // Close
    comp = -45;
  } else { // Just right
    comp = 0;
  }

  speed = Math.abs(gen_diff) * 2/4 + 10; 
  if (-8 < gen_diff && gen_diff < 8) {
    traj = (posa + 180) % 360;
    speed = 0; // Stasis
  } else if (difference >= 8) {
    traj = (posa + 90 + comp) % 360;
  } else {
    traj = (posa + 270 - comp) % 360;
  }

  return [traj, speed];
}

async function circle() {
  try {
    var target_reached = reached_target(posa, global.doa);
    var trajsp = circle_traj(global.doa);
    var mov_mode = 'listen';
    var target = 0;
    var traget_speaking = false;
    var targeting_start_time;
    while (true) {
      var curr_time = new Date();
      var curr_time_stmp = curr_time.getTime() / 1000;
      var posa = Math.atan2(global.posy, global.posx) * 180 / Math.PI;
      target_reached = reached_target(posa, global.direction);
      var trajsp = circle_traj(global.direction);

      var section_time = curr_time_stmp - global.section_start_time;
      section_time = section_time.toFixed(3);
      // console.log('Section time: ' + section_time + 's');

      if (mov_mode == 'listen'){
        target_reached = reached_target(posa, global.doa);
        trajsp = circle_traj(global.doa);
        // sprkp.color('white');

        var threshold = global.avrg_sp_t > 5 ? global.avrg_sp_t : 5;
        if (section_time > threshold && global.roll_to != 0){
          mov_mode = 'target';
          target = global.direction;
        }
      } else if (mov_mode == 'target'){
        target_reached = reached_target(posa, target);
        trajsp = circle_traj(target);
        var target_person = dir2pers(target);
        var target_spoken = target_spoke(target_person);
        if (!traget_speaking && target_spoken){
          traget_speaking = true;
          targeting_start_time = curr_time_stmp;
        } else if (traget_speaking && !target_spoken) {
          target_speaking = false;
        }
        // console.log('Target: ', target, target_person, global.data[global.data.length - 1]['person_speaking'], target_person, target_spoken);
        // if (target_person == 1) {
        //   sprkp.color('green');
        // } else if (target_person == 2) {
        //   sprkp.color('blue');
        // } else if (target_person == 3) {
        //   sprkp.color('purple');
        // } else {
        //   sprkp.color('red');
        // }

        var targeting_time = curr_time_stmp - targeting_start_time;
        if (section_time > 20 || (target_spoken && targeting_time >= 1)){
          global.section_start_time = curr_time_stmp;
          section_time = curr_time_stmp - global.section_start_time;
          section_time = section_time.toFixed(3);
          mov_mode = 'listen';
        }
      }

      var traj = trajsp[0];
      var speed = trajsp[1];

      // Roll
      sph_traj = coord_convert(traj);
  
      if (!target_reached) {
        sprkp.roll(speed, sph_traj).then(function() {
          //console.log('Pos: ' + posa + 'º' + ' Traj: ' + traj + 'º')
        });
      }
      await delay(500);
    }
  } catch (error) {
    console.error(error);
  }
}

async function doaRoll() {
  try {
    while (true) {
      var traj = coord_convert(global.DOMMatrix)
      sprkp.roll(20, traj).then(function(){console.log('Roll: ' + global.direction + 'º')});
      await delay(500);
    }
  } catch (error) {
    console.error(error);
  }
}

// var sprkp = sphero("EF:C6:25:73:1A:31")
var sprkp = sphero("D0:4D:38:49:00:32")
console.log('Connect…')
sprkp.connect().then(async () => {
  try {
    streamOdo();
    streamDoa();
    await delay(500);
    console.log('Start');
    circle();
  } catch (error) {
    console.error(error);
  }
});
