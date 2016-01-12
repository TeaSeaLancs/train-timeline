"use strict";

const _ = require('underscore');
const Timeline = require('pebble-api').Timeline;

const flavours = require('./pin-flavours');
const debug = require('./debug');

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

function generatePin(userJourney/*, oldStatus TODO IMPLEMENT*/) {
    const flavourText = flavours.get(userJourney.status);

    const layout = _.extend(flavourText, {
        type: Timeline.Pin.LayoutType.GENERIC_PIN,
        title: `Your ${timeOfDay(userJourney.date)} commute`
    });

    const pin = {
        id: generateID(userJourney),
        time: userJourney.date,
        layout: layout
    };
    
    if (userJourney.createdAt.getTime() !== userJourney.updatedAt.getTime()) {
        pin.updateNotification = {
            time: userJourney.updatedAt,
            layout: layout
        };
    }

    return new Timeline.Pin(pin);
}

function send(user, userJourney, oldStatus) {
    return new Promise(function (resolve, reject) {
        try {
            debug(`Timeline: Sending pin to ${user.id} for ${userJourney.from} - ${userJourney.to}`);
            const pin = generatePin(userJourney, oldStatus);
            timeline.sendUserPin(user._id, pin, (err) => {
                if (err) {
                    reject(err);
                } else {
                    debug(`Timeline: Sent pin`);
                    resolve();
                }
            });
        } catch (err) {
            reject(err);
        }
    });
}

function remove(user, userJourney) {
    return new Promise(function (resolve, reject) {
        try {
            // This is annoying, but we actually have to generate the full pin again 
            // to delete it, even though only the ID is required
            const pin = generatePin(userJourney);
            timeline.deleteUserPin(user._id, pin, (err) => {
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
    send,
    remove
};
