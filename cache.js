// cache utils
// currently clears cache
const fs = require('fs');
const path = require('path');

var directory = 'output';

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