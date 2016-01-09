"use strict";

const express = require('express');

const app = express();
app.set('port', (process.env.PORT || 5000));
app.use(express.static('web'));

require('./listeners/all')();
require('./routers/all')(app);

app.listen(app.get('port'), function() {
   console.log(`Started server on ${app.get('port')}`); 
});