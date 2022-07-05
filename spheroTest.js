const sp = require("./doa.js");
const odo = require('./odo.js');
const sphero = require('sphero');
const facil = require('./facilitate.js');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function initiate() {
  console.log('Start');
  sprkp.color('orange');
  await facil.initialRoll(sprkp);
}

function main() {
  console.log('Go!');
  sprkp.color('white');
  facil.facilitate(sprkp);
}

// Choose Sphero
const sprkp = sphero("EF:C6:25:73:1A:31")
// const sprkp = sphero("D0:4D:38:49:00:32")

//Connect to Sphero
console.log('Connect…')
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
