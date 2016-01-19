"use strict";

const _ = require('underscore');
const Timeline = require('pebble-api').Timeline;
const moment = require('moment');

const flavours = require('./pin-flavours');
const debug = require('./debug');
const config = require('./config');

const timeline = new Timeline();

function generateID(userJourney) {
    // The ID is always deterministic so the same journey on the same day will always match
    return [userJourney.from, userJourney.to, moment(userJourney.date).format('YYYY-MM-DD')].join('-');
}

function timeOfDay(date) {
    const hr = date.getHours();

    if (hr < 12) {
        return 'morning';
    } else if (hr < 18) {
        return 'afternoon';
    } else {
        return 'evening';
    }
}   

function generatePin(userJourney, oldStatus) {
    const flavourText = flavours.get(userJourney.status);

    const layout = _.extend(flavourText, {
        type: Timeline.Pin.LayoutType.GENERIC_PIN,
        title: `Your ${timeOfDay(userJourney.date)} commute`,
        lastUpdated: userJourney.updatedAt,
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
    if (config.environment === 'test') {
        console.log(`Timeline: TEST Would have sent pin to ${user._id} for ${userJourney.from} - ${userJourney.to}`);
        return Promise.resolve();
    }
    
    return new Promise(function (resolve, reject) {
        try {
            const pin = generatePin(userJourney, oldStatus);
            debug(`Timeline: Sending pin ${pin.id} to ${user._id} for ${userJourney.from} - ${userJourney.to}`);
            debug(JSON.stringify(pin));
            timeline.sendUserPin(user._id.toString(), pin, (err) => {
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
            debug(`Timeline: Removing pin ${pin.id} for ${user._id} for ${userJourney.from} - ${userJourney.to}`);
            timeline.deleteUserPin(user._id.toString(), pin, (err) => {
                if (err) {
                    reject(err);
                } else {
                    debug(`Timeline: Removed pin`);
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
