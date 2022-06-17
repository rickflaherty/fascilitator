let { PythonShell } = require('python-shell');
let EventEmitter = require('events');


function readMessage(shell) {
  return new Promise((resolve) => {
    shell.on('message', function(message) {
      resolve(message);
    })
  })
}

exports.main = async function main() {
  var pyshell = new PythonShell('doa.py');
  pyshell.send('main');
}

exports.setUp = function setUp() {
  var shell = new PythonShell('doa.py');
  shell.send('setup');
  return shell
}

exports.endShell = function endShell(shell) {
  shell.end(function(err, code, signal) {
    if (err) throw err
    console.log("The exit code was " + code);
    console.log("The exit signal was " + signal);
    console.log("finished");
  })
}

exports.doa = async function doa(shell) {
  shell.send('doa');
  msg = Number(await readMessage(shell));
  //console.log(msg);
  return msg;
}

exports.doaEvent = async function doaEvent(shell, emitter) {
  shell.send('doa');
  msg = Number(await readMessage(shell));
  console.log(msg)
  emitter.emit('doa', msg);
  //return msg
}

exports.doaRepeat = async function doaRepeat(shell, emitter) {
  shell.send('doaRepeat');
  msg = 0;
  shell.on('message', function(message) {
    msg = Number(message);
    emitter.emit('doa', msg);
    //console.log(msg);
  });
  await readMessage(shell);
}
