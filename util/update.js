"use strict";

const debug = require('./debug');

const updates = new Map();

const DEFAULT_TIME = 30 * 1000;

function pause(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function queue(id, data, time) {
    time = time || DEFAULT_TIME;
    if (!updates.has(id)) {
        debug(`Queueing update for ${id} in ${time/1000} seconds`, data);
        updates.set(id, {
            promise: pause(time)
                .then(() => updates.delete(id))
                .then(() => data)
        });
    }

    return updates.get(id).promise;
}

module.exports = {
    queue
};
