"use strict";

const analysers = [
    require('./rolling-delays')
];

const states = {
    ok: 'ok',
    warning: 'warning',
    buggered: 'buggered',
    failure: 'failure'
};

function analyse(journey) {
    return analysers.map(analyser => analyser(journey));
}

module.exports = {
    analyse,
    states
};