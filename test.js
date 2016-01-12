"use strict";

const Journeys = require('./models/journeys');
const moment = require('moment');

Journeys.find('MOTO', 'MELS', moment("14:08", "HH:mm").toDate())
    .then((journeys) => {
        console.log(journeys);
    })
    .catch((err) => {
        console.error(err);
    });