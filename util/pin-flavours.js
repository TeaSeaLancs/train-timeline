"use strict";

const Timeline = require('pebble-api').Timeline;
const _ = require('underscore');

const randomEntries = {
    'subtitle': 'subtitle',
    'body': 'body'
};

const ok = {
    tinyIcon: Timeline.Pin.Icon.TIMELINE_SUN,
    backgroundColor: '#81C784',
    subtitle: [
        "Nothing to report",
        "Everything's A-OK",
        "All good things"
    ],
    body: [
        "Trains are running smoothly",
        "Surprisingly, nothing has broken down",
        "I wish there was bad news, but there isn't",
    ]
};

const warning = {
    tinyIcon: Timeline.Pin.Icon.GENERIC_WARNING,
    backgroundColor: '#FFB300',
    subtitle: [
        "Things are a bit delayed",
        "Few delays on the line",
        "Delays delays delays"
    ],
    body: [
        "Be prepared for commuters tutting",
        "Probably not worth running for that next train",
        ""
    ]
};

const buggered = {

};

const failure = {

};

const map = {
    ok,
    warning,
    buggered,
    failure
};

function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function get(status) {
    if (!(status in map)) {
        return;
    }

    var flavour = map[status];

    return _.mapObject(flavour, (val, name) => {
        if (name in randomEntries) {
            return random(val);
        }
        
        return val;
    });
}

module.exports = {
    get: get
};
