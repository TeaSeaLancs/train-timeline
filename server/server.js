"use strict";

const express = require('express');
const http = require('http');

const port = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);

app.use(express.static('web'));

require('./listeners')(server, app);
require('./feeds')();
require('./routers')(app);

server.listen(port, function() {
   console.log(`Server: Started server on ${port}`); 
});