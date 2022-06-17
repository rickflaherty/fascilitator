let { PythonShell } = require('python-shell');
let EventEmitter = require('events');

/*var curr_msg = ''

function readMessage(shell) {
  return new Promise((resolve) => {
    shell.on('message', function(message) {
      // console.log('Curr: ' + curr_msg + ', Msg: ' + message)
      if (message != curr_msg) {
        console.log('Curr: ' + curr_msg + ', Msg: ' + message)
        curr_msg = message;
        resolve(message);
      }
    })
  })
}*/

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
  //console.log('contrib');
  shell.send('contrib');
  // console.log(shell)
  //console.log(emitter)
  //var current = '';
  //var msg = ''

  shell.on('message', message => {
    //msg = message;
    //console.log(message);
    emitter.emit('contrib', message);
    /*if (message != current) {
      current = message;
      emitter.emit('contrib', message);
      //console.log(message);
    }*/
  });
}

