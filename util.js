// common functions
const crypto = require('crypto');

function hash(obj) {
  var _hash = md5(JSON.stringify(obj)).substring(0, 12);
  return _hash;
}

function md5(string) {
  return crypto.createHash('md5').update(string).digest('hex');
}

function nextPowerOfTwo (n) {
  if (n === 0) return 1;
  n--;
  n |= n >> 1;
  n |= n >> 2;
  n |= n >> 4;
  n |= n >> 8;
  n |= n >> 16;
  return n+1;
}

module.exports = {
  hash: hash,
  nextPowerOfTwo: nextPowerOfTwo
};