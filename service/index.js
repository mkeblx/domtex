const http = require('http');
const _url = require('url');
const querystring = require('querystring');
const { spawn, fork } = require('child_process');

const util = require('./../util.js');

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
  var force = null;
  if (query.force && query.force === 'true') {
    force = true;
  }
  var atlas = null;
  if (query.atlas && query.atlas === 'true') {
    console.log('atlas is true...');
    atlas = true;
  }


  request.on('error', (err) => {
    console.error(err.stack);
  }).on('data', (chunk) => {

  }).on('end', createResponse);

  function createResponse(json) {

    var args = ['generate.js'];
    args.push('--url='+siteUrl);
    if (sel)
      args.push('--sel='+sel);
    if (force)
      args.push('--force');
    if (atlas)
      args.push('--atlas');

    console.log(args);

    const child = spawn('node', args);

    child.stdout.on('data', (data) => {
      data = `${data}`;
      console.log(data);
      if (data.startsWith(':::')) {
        console.log('json generated');

        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET,POST');

        var respJson = data.slice(3);
        response.write(respJson);

        response.end();
      } else {
        console.log(data);
      }
    });
    child.stderr.on('data', (data) => {
      console.log(`${data}`);
    });
    child.on('message', (data) => {
      console.log(`${data}`);
    });
    child.on('close', (code, signal) => {
      console.log('spawn closed');
      if (code !== 0) {
        console.log(`process exited with code ${code}`);
      }
    });
  }

}).listen(PORT, (err) => {
  console.log(`listening on port ${PORT}`);

  if (err) {
    return console.log('something bad happened', err);
  }
});
