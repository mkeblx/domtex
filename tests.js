const { execFile } = require('child_process');

console.log('Running tests...');

var tests = [
  ['generate.js','--url=https://nytimes.com']
];

execFile('node', tests[0], (error, stdout, stderr) => {
  if (error) {
    throw error;
  }
  console.log(stdout);
});

// console.log('Tests complete.');