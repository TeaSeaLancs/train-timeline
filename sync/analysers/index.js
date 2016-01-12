"use strict";

const analysers = [
    require('./delay-count')
];

const states = require('./states');

function analyse(journey) {
    return analysers.map(analyser => analyser(journey));
}

module.exports = {
    analyse,
    states
};