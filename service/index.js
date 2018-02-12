var http = require('http');
var _url = require('url');
var querystring = require('querystring');
const { execFile } = require('child_process');

var PORT = 8080;
const server = http.createServer();
server.on('request', (request, response) => {
  console.log('processing request...');

  const { method, url } = request;

  var urlParts = _url.parse(url, true);
  var query = urlParts.query;
  console.log('query: ' + JSON.stringify(query));

  var siteUrl = decodeURI(query.url);

  console.log('site URL: ' + siteUrl);

  request.on('error', (err) => {
    console.error(err.stack);
  }).on('data', (chunk) => {

  }).on('end', createResponse);

  function createResponse(json) {

    const child = execFile('node', ['screenshot.js','--url='+siteUrl], (error, stdout, stderr) => {
      console.log('callback');
      if (error) {
        throw error;
      }
      console.log('screenshot.js output:');
      console.log(stdout);

      response.statusCode = 200;
      response.setHeader('Content-Type', 'application/json');
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Access-Control-Allow-Methods', 'GET,POST');

      var respJson = stdout;
      console.log(respJson);
      response.write(respJson);

      response.end();
    });
  }

}).listen(PORT, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }
});

console.log(`listening on port ${PORT}`);
