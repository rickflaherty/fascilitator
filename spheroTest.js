const process = require('process')
const sp = require('./doa');
const people = require("./people");
const odo = require('./odo');
const sphero = require('sphero');
const facil = require('./facilitate');

const spheros = {0: null, 1: 'EF:C6:25:73:1A:31', 2: 'D0:4D:38:49:00:32'}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function initiate() {
  console.log('Setup…');
  sprkp.color('orange');
  await facil.initialRoll(sprkp);
}

function main() {
  console.log('Start!');
  sprkp.color('white');
  facil.facilitate(sprkp);
}

// Choose Sphero
let deviceID = "EF:C6:25:73:1A:31";
// let deviceID = "D0:4D:38:49:00:32";
let useBall = true;
if (process.argv.length >= 2) {
  if (process.argv[2] == 0) {useBall = false;}
  if (useBall) {
    deviceID = spheros[process.argv[2]];
  }
}
const sprkp = sphero(deviceID);

// Set # of people
// Currently only supports 3 people
let numOfPeople = 3;
people.setNumOfPeople(numOfPeople);
// console.log(sp.getPeopleRange(), sp.getPeopleDirections());

// Connect to Sphero
if (useBall) {
  console.log('Connecting to ' + deviceID + '…')
  sprkp.connect().then(async () => {
    try {
      // Stream Sphero position and speech information
      odo.streamOdo(sprkp);
      sp.streamDoa();
      await delay(500);
      await initiate();
      await delay(500);
      main();
    } catch (error) {
      console.error(error);
    }
  });
} else { // Or analyze using Mic-Array w/o Sphero
  console.log('Analysis…');
  sp.streamDoa();
}
