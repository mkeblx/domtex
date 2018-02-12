var http = require('http');
var url = require('url');
var querystring = require('querystring');

const server = http.createServer();
server.on('request', (request, response) => {

  const { method, url } = request;

  var urlParts = url.parse(url, true);
  var query = urlParts.query;
  var queryParts = querystring.parse(query);
  var siteUrl = queryParts.url;

  request.on('error', (err) => {
    console.error(err.stack);
  });

  request.on('end', () => {
    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json');

    var resp = {};
    resp.requestUrl = url;
    resp.url = siteUrl;
    resp.width = 512;
    resp.height = 512;
    resp.path = 'output/test.png';

    response.write(JSON.stringify(resp));

    response.end();
  })

});

var PORT = 8080;
server.listen(PORT);
