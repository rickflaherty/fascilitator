const {PythonShell} = require('python-shell');
const EventEmitter = require('events');
const doa = require('./doa.js');
const contrib = require('./contrib.js');
const logger = require('./logger.js');
const sphero = require('sphero');


function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
}

function pretty_print(entry) {
  process.stdout.write('Timestamp: ' + entry.timestamp + '\n')
  process.stdout.write('DOA: |');
  for (i=0;i < Math.floor(entry.doa/12); i++){
    process.stdout.write(' ');
  }
  process.stdout.write('|');
  for (i=30;i > Math.floor(entry.doa/12); i--){ 
    process.stdout.write(' ');
  }
  process.stdout.write('| '+entry.doa+'º\n');

  process.stdout.write('Person speaking: ' + entry.person_speaking + '\n');

  process.stdout.write('Person 1: \n');
  process.stdout.write('Spoke '+entry.speech1+' times\n');
  process.stdout.write('  Response: '+entry.response1 + '\n');
  process.stdout.write('  Score: ' + Math.round(entry.score1 * 100) + '% |');
  for(i=0;i < Math.floor(10 * entry.score1); i++){
    process.stdout.write('■');
  }
  process.stdout.write('\nPerson 2: \n');
  process.stdout.write('  Spoke '+entry.speech2+' times\n');
  process.stdout.write('  Response: '+entry.response2 + '\n');
  process.stdout.write('  Score: ' + Math.round(entry.score2 * 100) + '% |');
  for(i=0;i < Math.floor(10 * entry.score2); i++){ 
    process.stdout.write('■');
  }
  process.stdout.write('\nPerson 3: \n');
  process.stdout.write('  Spoke '+entry.speech3+' times\n');
  process.stdout.write('  Response: '+entry.response3+'\n');
  process.stdout.write('  Score: ' + Math.round(entry.score3 * 100) + '% |');
  for(i=0;i < Math.floor(10 * entry.score3); i++){ 
    process.stdout.write('■');
  }
  //process.stdout.write('\nInclusivity: '+entry.inclusivity + '\n\n');
  process.stdout.write('\nInclusivity: ' + Math.round(entry.inclusivity * 100) + '% |');
  for(i=0;i < Math.floor(10 * entry.inclusivity); i++){ 
    process.stdout.write('■');
  }
  process.stdout.write('\n\n');
}

async function streamDoa() {
  try {
    var start_dt = new Date();
    var doaShell = doa.setUp();
    var contribShell = contrib.setUp();
    var data = [];
    console.log('Start');

    //var direction = 0;
    var myEmitter = new EventEmitter();
    /*myEmitter.on('doa', msg => {
      console.log("DOA: " + msg + "º");
      global.direction = msg;
    });*/
    myEmitter.on('contrib', msg => {
      var dt = new Date();
      var time_stmp = dt.getFullYear() + '-' + dt.getMonth() + '-' + dt.getDate() + ' ' + dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds() + '.' + dt.getMilliseconds()

      var log_vars = JSON.parse(msg)
      //console.log(log_vars);

      data.push({
        'timestamp': time_stmp,
        'doa': log_vars.doa,
        'person_speaking': log_vars.person_speaking,
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
      console.log(time_stmp + " Log: " + msg);
      pretty_print(log_vars);
      global.direction = log_vars.doa
    });

    //doa.doaRepeat(doaShell, myEmitter);
    contrib.contrib(contribShell, myEmitter);

    process.on('SIGINT', async () => {
      await delay(2000).then(() => {
        /*logger.createConvoLogfile(data, start_dt).then(() => {
          process.exit(0);
        });*/
        //console.log(data);
        process.exit(0);
      });
    });

    /*function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }*/
  } catch (error) {
    console.error(error);
  }
}

var sprkp = sphero("EF:C6:25:73:1A:31");
// var sprkp = sphero("D0:4D:38:49:00:32");
sprkp.connect().then(async function() {
  // Get DOA
  // streamDoa();

  //var pyshell = doa.setUp();
  //doa.endShell(pyshell);
  //console.log(pyshell);
  //var pyshell = new PythonShell('doa.py');
  //pyshell.send('hello');

  /*pyshell.on('message', function (message) {
    // received a message sent from the Python script (a simple "print" statement)
    console.log(message);
  });*/

  //var myEmitter = new EventEmitter();
  //  myEmitter.on('doa', function(msg){
  //    console.log("DOA: " + msg + "º");
  //    global.direction = msg;
  //  });

  //doa.doaRepeat(pyshell, myEmitter);
  //pyshell.send('doaRepeat');

  // roll sprkp in a random direction, changing direction every second
  setInterval(function() {
    var direction = Math.floor(Math.random() * 360);
    sprkp.roll(50, direction);
  }, 1000);
  
});
