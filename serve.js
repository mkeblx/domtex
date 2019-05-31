'use strict';

// serve files out of samples
const path = require('path');
var express = require('express');
var app = express();

var dir = path.join(__dirname, '.');

const PORT = 8000;

app.use(express.static(dir));

app.get('/examples/js/three.js', function(req, res) {
  res.sendFile(__dirname + '/node_modules/three/build/three.js');
});

app.listen(PORT, function () {
    console.log('Listening on http://localhost:' + PORT);
});