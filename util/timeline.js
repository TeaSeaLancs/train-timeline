"use strict";

const Timeline = require('pebble-api').Timeline;

const flavours = require('./pin-flavours');
const _ = require('underscore');

const timeline = new Timeline();

function generateID(userJourney) {
    // The ID is always deterministic so the same journey on the same day will always match
    return [userJourney.from, userJourney.to, userJourney.date.getTime()].join('-');
}

function timeOfDay(date) {
    var hr = date.getHours();

    if (hr < 12) {
        return 'morning';
    } else if (hr < 18) {
        return 'afternoon';
    } else {
        return 'evening';
    }
}

// TODO Put in status, generate notifications, etc
function generatePin(userJourney) {
    const flavourText = flavours.get(userJourney.status);

    const layout = _.extend(flavourText, {
        type: Timeline.Pin.LayoutType.GENERIC_PIN,
        title: `Your ${timeOfDay(userJourney.date)} commute`
    });
    
    const pin = {
        id: generateID(userJourney),
        time: userJourney.date,
        layout: layout,
        updateNotification: {
            time: userJourney.updatedAt,
            layout: layout
        }
    };

    return new Timeline.Pin(pin);
}

function send(user, userJourney) {
    return new Promise(function (resolve, reject) {
        try {
            const pin = generatePin(userJourney);
            require('fs').appendFileSync('pins.json', `${JSON.stringify(pin)}\n`);
            timeline.sendUserPin(user._id, pin, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = {
    send
};
