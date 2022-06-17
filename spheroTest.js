var EventEmitter = require('events')
//var doa = require("./doa.js");
var contrib = require('./contrib.js');
var sphero = require("sphero");
var logger = require('./logger.js');
//var { Scanner, Utils } = require("spherov2.js");

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function coord_convert(a) {
  var b = (450 - a) % 360;
  return b;
}

function pers2dir(person) {
  directions = {1: 60, 2: 180, 3: 300};
  return directions[person]
}

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

function locate() {
  var opts = {
    flags: 0x01,
    x: 0x0000,
    y: 0x0000,
    yawTare: 0x0
  };
  sprkp.configureLocator(opts, function(err, data){
    console.log(err || 'data: ' + data);
  });
}

async function readLocator() {
  sprkp.readLocator(function(err, data){
    if (err) {
      console.log("error: ", err);
    } else {
      console.log("data:");
      console.log("  xpos:", data.xpos);
      console.log("  ypos:", data.ypos);
      console.log("  xvel:", data.xvel);
      console.log("  yvel:", data.yvel);
      console.log("  sog:", data.sog);
    }
  });
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
    global.direction = 0;
    var start_dt = new Date();
    global.section_start_time = start_dt.getTime();
    var data = [];
    var pyshell = contrib.setUp();
    var roll_to = 0;

    //console.log(global.section_start_time);

    //var direction = 0;
    var myEmitter = new EventEmitter();
    myEmitter.on('contrib', function(msg) {
      var dt = new Date();
      var time_stmp = dt.getFullYear() + '-' + dt.getMonth() + '-' + dt.getDate() + ' ' + dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds() + '.' + dt.getMilliseconds()

      log_vars = JSON.parse(msg)
      //console.log(log_vars);

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

      global.section_start_time = log_vars.start_time;

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

      if (roll_to == 1){
        sprkp.color('red');
      } else if (roll_to == 2){
        sprkp.color('green');
      } else if (roll_to == 3) {
        sprkp.color('blue');
      } else {
        sprkp.color('white');
      }

      global.doa = log_vars.doa;
      if (roll_to != 0){
        global.direction = pers2dir(roll_to);
      } else {
        global.direction = log_vars.doa;
      }
    });

    //console.log('contrib');
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
  var posa = 0;
  var difference = 0;
  var comp = 0;
  var traj = 0;
  var speed = 0;
  // Calculate position (angle)
  posa = Math.atan2(global.posy, global.posx) * 180 / Math.PI;
  //console.log('Posa: ' + posa + 'º');

  // Calculate angle difference from DOA
  difference = dir - posa;
  if (difference < - 180) {difference += 360;}
  if (difference > 180) {difference -= 360;}
  //console.log('Diff: ' + difference + 'º');

  // clockwise or anti-clockwise or no rotation
  var gen_diff = Math.ceil(difference);
  //var gen_diff = difference;
  //console.log('Diff: ' + gen_diff + 'º');

  var dist = Math.sqrt(global.posx * global.posx + global.posy * global.posy);
  var valid_dist = false;
  //console.log('Dist: ' + dist);
  if (dist > 90) {
    comp = 45;
    //console.log('Far');
  } else if (dist < 80){
    comp = -45;
    //console.log('Close');
  } else {
    valid_dist = true;
    comp = 0;
  }

  //speed = 50;
  speed = Math.abs(gen_diff)* 2/4; 
  if (-8 < gen_diff && gen_diff < 8) {
    traj = (posa + 180) % 360;
    speed = 0;
    //console.log('Stasis');
  } else if (difference >= 8) {
    traj = (posa + 90 + comp) % 360;
    //speed = 25;
  } else {
    traj = (posa + 270 - comp) % 360;
    //speed = 25;
  }

  //console.log(traj);
  //console.log(speed);
  return [traj, speed];
}

async function circle() {
  try {
    var count = 0;
    var trajsp = circle_traj(global.doa);
    while (true) {
      var curr_time = new Date();
      var curr_time_stmp = curr_time.getTime() / 1000;
      var posa = Math.atan2(global.posy, global.posx) * 180 / Math.PI;
      //var trajsp = circle_traj(global.doa);
      var trajsp = circle_traj(global.direction);
      //var trajsp = circle_traj(posa);

      /*if (0 < global.direction < 119){
        sprkp.color('red');
      } else if (120 < global.direction < 239){
        sprkp.color('green');
      } else {
        sprkp.color('blue');
      }*/

      //console.log(curr_time_stmp - global.section_start_time);
      var section_time = curr_time_stmp - global.section_start_time;
      section_time = section_time.toFixed(3);
      //console.log('Section time: ' + section_time + 's');
      //console.log(curr_time_stmp, global.section_start_time);
      if (section_time > 5){
        trajsp = circle_traj(global.direction);
      } else if (section_time > 10) {
        global.section_start_time = curr_time_stmp;
      }
      var traj = trajsp[0];
      var speed = trajsp[1];
      //console.log(traj, speed);

      // Roll
      sph_traj = coord_convert(traj);
      //console.log(sph_traj);
      //await   sprkp.roll(speed, posa % 360).then(function() { console.log('Pos: ' + posa + 'º' + ' Traj: ' + traj + 'º') });

      sprkp.roll(speed, sph_traj).then(function() {
        //console.log('Pos: ' + posa + 'º' + ' Traj: ' + traj + 'º')
      });

      //await sprkp.roll(speed, traj).then(function() { console.log('Pos: ' + posa + 'º' + ' Traj: ' + traj + 'º') });

      // Interval
      /*count += 1;
      console.log(count);*/
      await delay(500);
    }
  } catch (error) {
    console.error(error);
  }
}

async function doaRoll() {
  try {
    while (true) {
      var traj = coord_convert(global.direction)
      sprkp.roll(20, traj).then(function(){console.log('Roll: ' + global.direction + 'º')});
      await delay(500);
    }
  } catch (error) {
    console.error(error);
  }
}

var sprkp = sphero("EF:C6:25:73:1A:31")
//var sprkp = sphero("D0:4D:38:49:00:32")
//console.log(sprkp)
console.log('Connect…')
sprkp.connect().then(async () => {
  try {
    streamOdo();
    streamDoa();
    //console.log('stream')

    await delay(500);
    console.log('Start');
    //doaRoll();
    circle();

    //await delay(10000);
    //console.log('End');
  } catch (error) {
    console.error(error);
  }
  //await sprkp.disconnect()
  //process.exit()
});
