"use strict";

const express = require('express');

const app = express();
app.set('port', (process.env.PORT || 5000));
app.use(express.static('web'));

require('./listeners')();
require('./feeds')();
require('./routers')(app);

app.listen(app.get('port'), function() {
   console.log(`Server: Started server on ${app.get('port')}`); 
});