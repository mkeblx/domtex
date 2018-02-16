var http = require('http');
var _url = require('url');
var querystring = require('querystring');
const { execFile } = require('child_process');

var PORT = 8080;
const server = http.createServer();
server.on('request', (request, response) => {
  console.log('processing request...');

  const { method, url } = request;

  if (method !== 'GET' || !url.startsWith('/generate')) {
    console.log('invalid request');
    response.statusCode = 404;
    response.end();
    return;
  }

  var urlParts = _url.parse(url, true);
  var query = urlParts.query;
  console.log('query: ' + JSON.stringify(query));

  if (query.url === undefined) {
    console.log('missing url parameter');
    res.statusMessage = 'Missing required url parameter';
    res.statusCode = 400;
    response.end();
    return;
  }

  var siteUrl = decodeURI(query.url);
  console.log('site URL: ' + siteUrl);

  var sel = null;
  if (query.sel) {
    sel = decodeURI(query.sel);
    console.log('selectors: ' + sel);
  }


  request.on('error', (err) => {
    console.error(err.stack);
  }).on('data', (chunk) => {

  }).on('end', createResponse);

  function createResponse(json) {

    var args = ['screenshot.js'];
    args.push('--url='+siteUrl);
    if (sel)
      args.push('--sel='+sel);

    const child = execFile('node', args, (error, stdout, stderr) => {
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
