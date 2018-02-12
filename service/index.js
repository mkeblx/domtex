var http = require('http');
var _url = require('url');
var querystring = require('querystring');

var PORT = 8080;
const server = http.createServer();
server.on('request', (request, response) => {
  console.log('processing request...');

  const { method, url } = request;

  var urlParts = _url.parse(url, true);
  var query = urlParts.query;
  var queryParts = querystring.parse(query);
  var siteUrl = queryParts.url;

  request.on('error', (err) => {
    console.error(err.stack);
  }).on('data', (chunk) => {

  }).on('end', () => {
    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST');

    var resp = {};
    resp.requestUrl = url;
    resp.url = siteUrl;
    resp.width = 512;
    resp.height = 512;
    resp.path = '/output/612c1b08.png';

    var json = JSON.stringify(resp);
    console.log(json);
    response.write(json);

    response.end();
  })

}).listen(PORT, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }
});

console.log(`listening on port ${PORT}`);
