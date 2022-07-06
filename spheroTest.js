const process = require('process')
const sphero = require('sphero');
const odo = require('./odo');
const sp = require('./doa');
const people = require("./people");
const facil = require('./facilitate');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function selectSphero(spheros) {
  let deviceID = "EF:C6:25:73:1A:31";
  // let deviceID = "D0:4D:38:49:00:32";
  let useBall = true;
  if (process.argv.length >= 2) {
    if (process.argv[2] == 0) {
      useBall = false;
      return useBall;
    }
    if (useBall) {
      deviceID = spheros[process.argv[2]];
      return sphero(deviceID);
    }
  }
}

async function initiate(sprkp) {
  console.log('Setup…');
  sprkp.color('orange');
  await facil.initialRoll(sprkp);
}

function main(sprkp) {
  console.log('Start!');
  sprkp.color('white');
  facil.facilitate(sprkp);
}

// Select Sphero
const spheros = {0: null, 1: 'EF:C6:25:73:1A:31', 2: 'D0:4D:38:49:00:32'}
const sprkp = selectSphero(spheros);

// Set # of people
// Currently only supports 3 people
people.setNumOfPeople(3);
for (i=1;i<=3;i++) {
  console.log('Person '+i+': ' + people.pers2dir(i) +'º');
}

// Connect to Sphero
if (sprkp) {
  console.log('Connecting…')
  sprkp.connect().then(async () => {
    try {
      // Stream Sphero position and speech information
      odo.streamOdo(sprkp);
      sp.streamDoa();
      await delay(500);
      await initiate(sprkp);
      await delay(500);
      main(sprkp);
    } catch (error) {
      console.error(error);
    }
  });
} else { // Or analyze using Mic-Array w/o Sphero
  console.log('Analysis…');
  sp.streamDoa();
}
