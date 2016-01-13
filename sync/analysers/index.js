"use strict";

const analysers = [
    require('./delay-count')
];

const states = require('./states');

function analyse(userJourney) {
    return analysers.map(analyser => analyser(userJourney));
}

module.exports = {
    analyse,
    states
};