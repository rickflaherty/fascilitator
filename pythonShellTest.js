//let {PythonShell} = require('python-shell');
let EventEmitter = require('events')
let doa = require('./shellModTest.js');
let sphero = require("sphero");

/*function readMessage(shell) {
  return new Promise((resolve) => {
    shell.on('message', function(message) {
      resolve(message);
    })
  })
}*/

/*async function doa(shell) {
  shell.send('doa');
  //msg = await readMessage(shell);
  //msg = Number(msg);
  msg = Number(await readMessage(shell));
  console.log(msg);
}
*/

let myEmitter = new EventEmitter();
    myEmitter.on('doa', function(msg){
      console.log("DOA: " + msg + "º");
      global.direction = msg;
    });

let pyshell = doa.setUp();
//console.log(pyshell);
doa.doaRepeat(pyshell, myEmitter);
doa.endShell(pyshell);
