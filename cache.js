// cache utils
// currently clears cache
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const argv = require('yargs')
  .usage('Usage $0 command')
  .demandCommand(1)
  .argv;

var args = argv._;
var command = argv._[0];

const directory = 'output';


switch (command) {
  case 'clear':
    clear();
    break;
  case 'size':
    details();
    break;
  default:
    console.log('default');
}

function details() {
  // TODO: also, provide # of files
  var child = exec('du -sh '+directory, function(error, stdout, stderr){
    console.log(stdout);
  });
}

// clear all
function clear() {
  fs.readdir(directory, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      if (file.charAt(0) == '.')
        continue;
      console.log('file: ' + file);
      fs.unlink(path.join(directory, file), err => {
        if (err)
          throw err;
      });
    }
  });
}