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
        "All good things",
        "Yes! Yes! Yes!",
        ":)",
        "Yeah baby!"
    ],
    body: [
        "Trains are running smoothly",
        "I wish there was bad news, but there isn't",
        "Get prepared for a commute as smooth as a baby's face",
        "If you're running late, i'd shift it, because the trains aren't",
        "Looks like the train-dance worked. Try a money-dance next time?",
        "I'm no meteorologist, but i'm pretty sure it's raining trains!",
        "You get a train! And you get a train! Everybody get a train!",
        "Trains, trains everywhere...",
        "Oh if only every day were like this... you'd quickly uninstall this app because everything was always on time... what a horrible world that would be"
    ]
};

const warning = {
    tinyIcon: Timeline.Pin.Icon.GENERIC_WARNING,
    backgroundColor: '#FFB300',
    subtitle: [
        "Things are a bit delayed",
        "Few delays on the line",
        "Trains are running slowly",
        "Could be worse...",
        "Could be better...",
        ":\\",
        ""
    ],
    body: [
        "Unplug your earphones and listen to the sound of commuters sighing",
        "Probably not worth running for that next train",
        "The concept of 'on time' is relative anyway, surely?",
        "I can see you reaching for that tweet button, and I don't blame you",
        "Well I guess there's lots of stuff happening on Facebook, right? Right?",
        "Hope you've got your running shoes on in case of platform changes!",
        "'I wolfed down two pieces of toast while putting a tie on for this?!'",
        "'Observe, the commuter, in it's natural habitat, running for a train which is not there yet, with an immaculate suit, a jaunty tie, and pink neon trainers...'"
    ]
};

const buggered = {
    tinyIcon: Timeline.Pin.Icon.NOTIFICATION_FLAG,
    backgroundColor: '#B71C1C',
    subtitle: [
        "All hell has broken loose",
        "Nope",
        "Delays, delays everywhere",
        "www.nope.co.uk",
        ":(",
        "You guessed it, delays"
    ],
    body: [
        "Now is a great time to tweet your disappointment",
        "Well i'm not surprised, really",
        "Good job you've got this app, isn't it? Now you can be disappointed before everyone else!",
        "They apologise for the inconvenience",
        "They're always sorry, perhaps they should talk to someone about it",
        "I hope you're not overly fond of personal space, because you're about to lose yours...",
        "I recommend you pray to some train-based deity...",
        "Everything is running according to schedule... just not yours",
        "Here's an idea: Start a sweepstakes with your fellow commuters for when they'll get home!",
        "Why not strike up a conversation about these delays? Nothing brings British people together like shared misery",
        "Here's an idea: Move to another area so you'll hopefully have better journeys. It's not unheard of!",
        "Try not to think about how much you pay for this privilege",
        "Well at least now you've got more time to work on that novel you've been writing...",
        "Because who doesn't like working from home?",
        "There are an infinite number of universes, with infinite possibilities, and in all of them, you're still waiting for this damn train"
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

    const flavour = map[status];

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
