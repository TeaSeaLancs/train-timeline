"use strict";

const analysers = [
    require('./delay-ratio')
];

const states = require('./states');

function analyse(userJourney) {
    return analysers.map(analyser => analyser(userJourney));
}

module.exports = {
    analyse,
    states
};