// cache utils
// currently clears cache
const fs = require('fs');
const path = require('path');

const argv = require('yargs')
  .usage('Usage $0 command')
  .demandCommand(1)
  .argv;

var args = argv._;
var command = argv._[0];

const directory = 'output';


if (command == 'clear') {
  clear();
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