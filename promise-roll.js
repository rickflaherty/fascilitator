"use strict";

var EventEmitter = require('events')
var doa = require("./doa.js");
var sphero = require("sphero");


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function streamOdo() {
  sprkp.streamOdometer();

  sprkp.on('odometer', function(data) {
  global.posx = data.xOdometer.value[0];
  console.log('  x: ' + global.posx + data.xOdometer.units);
  global.posy = data.yOdometer.value[0];
  console.log('  y: ' + global.posy + data.yOdometer.units);
});
}

async function streamDoa() {
  try {
    var pyshell = doa.setUp();
    //var direction = 0;
    var myEmitter = new EventEmitter();
    myEmitter.on('doa', function(msg){
      console.log("DOA: " + msg + "º");
      global.direction = msg;
    });

    await doa.doaRepeat(pyshell, myEmitter);
  } catch (error) {
    console.error(error);
  }
}


async function circle_traj() {
  try {
    var posa = 0;
    var difference = 0;
    var comp = 0;
    var traj = 0;
    var speed = 0;
    // Calculate position (angle)
    posa = Math.atan2(global.posy, global.posx) * 180 / Math.PI;
    //console.log('Posa: ' + posa + 'º');

    // Calculate angle difference from DOA
    difference = global.direction - posa;
    if (difference < - 180) {difference += 360;}
    if (difference > 180) {difference -= 360;}
    //console.log('Diff: ' + difference + 'º');

    // clockwise or anti-clockwise or no rotation
    var gen_diff = Math.ceil(difference/5)*5;
    //console.log('Diff: ' + gen_diff + 'º');

    if (gen_diff == 0) {
      traj = posa % 360;
      speed = 10;
    } else if (difference > 0) {
      traj = (posa + 90 + comp) % 360;
      speed = 20;
    } else {
      traj = (posa + 270 - comp) % 360;
      speed = 20;
    }
    //console.log(traj);
    //console.log(speed);
    return [traj, speed];
  } catch (error) {
    console.error(error);
  }
}

async function circle() {
  try {
    var count = 0;
    while (true) {
      var posa = Math.atan2(global.posy, global.posx) * 180 / Math.PI;
      var trajsp = await circle_traj();
      var traj = trajsp[0];
      var speed = trajsp[1];
      //console.log(traj, speed);

      // Roll
      sph_traj = await coord_convert(traj);
      //console.log(sph_traj);
      //await   sprkp.roll(speed, posa % 360).then(function() { console.log('Pos: ' + posa + 'º' + ' Traj: ' + traj + 'º') });

      await sprkp.roll(speed, sph_traj).then(function() {console.log('Pos: ' + posa + 'º' + ' Traj: ' + traj + 'º')});

      //await sprkp.roll(speed, traj).then(function() { console.log('Pos: ' + posa + 'º' + ' Traj: ' + traj + 'º') });

      // Interval
      count += 1;
      console.log(count);
      await delay(50);
    }
  } catch (error) {
    console.error(error);
  }
}


async function doaRoll() {
  try {
    while (true) {
      var traj = await coord_convert(global.direction)
      await sprkp.roll(20, traj).then(function(){console.log('Roll: ' + global.direction + 'º')});
      await delay(500);
    }
  } catch (error) {
    console.error(error);
  }
}


// var sprkp = sphero("D0:4D:38:49:00:32");
var sprkp = sphero("EF:C6:25:73:1A:31")

console.log('Connect');
sprkp.connect().then(async function() {
  try {
    streamOdo();
    global.direction = 0;
    streamDoa();

    // roll orb in a random direction, changing direction every second
    while (true) {
      var direction = Math.floor(Math.random() * 360);
      sprkp.roll(10, direction);
      await delay(1000)
    }
  } catch (error) {
    console.error(error);
  }
});
