let { PythonShell } = require('python-shell');
let EventEmitter = require('events');

exports.setUp = function setUp() {
  var shell = new PythonShell('contribution_analysis.py');
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

exports.contrib = function contrib(shell, emitter) {
  shell.send('contrib');
  shell.on('message', message => {
    emitter.emit('contrib', message);
  });
}

