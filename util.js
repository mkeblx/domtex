// common functions
const crypto = require('crypto');

function hash(obj) {
  var _hash = md5(JSON.stringify(obj)).substring(0, 12);
  return _hash;
}

function md5(string) {
  return crypto.createHash('md5').update(string).digest('hex');
}

module.exports = {
  hash: hash
};