"use strict";

const Timeline = require('pebble-api').Timeline;
const _ = require('underscore');

const randomEntries = {
    'subtitle': 'subtitle',
    'body': 'body'
};

const ok = {
    tinyIcon: Timeline.Pin.Icon.MUSIC_EVENT,
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
        "Trains are running slowly"
    ],
    body: [
        "Be prepared for commuters tutting",
        "Probably not worth running for that next train",
        "The concept of 'on time' is relative anyway, surely?"
    ]
};

const buggered = {
    tinyIcon: Timeline.Pin.Icon.NOTIFICATION_FLAG,
    backgroundColor: '#B71C1C',
    subtitle: [
        "All hell has broken loose",
        "Nope",
        "Delays, delays everywhere"
    ],
    body: [
        "Now is a great time to tweet your disappointment",
        "Well i'm not surprised, really",
        "This is why this app was developed"
    ]
};

const failure = {
    tinyIcon: Timeline.Pin.Icon.NOTIFICATION_LIGHTHOUSE,
    backgroundColor: '#EDE7F6',
    subtitle: [
        "Uh, dunno",
        "There's been a problem",
        "Your guess is as good as mine"
    ],
    body: [
        "The system seems to be down. Sorry",
        "The data feeds have stopped for some reason, sorry!",
        "The spirit is willing Captain, but we just don't have the data!"
    ]
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
