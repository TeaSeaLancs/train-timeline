"use strict";

const Journeys = require('../../models/journeys');
const Users = require('../../models/users');

const sync = require('../../sync/sync');

const debug = require('../../util/debug');

function error(operation, journey, err) {
    console.error(`Journey: Error performing ${operation} on ${journey.uid}`, err, err.stack);
}

function success(operation, journey) {
    console.log(`Journey: Successfully performed ${operation} on ${journey.uid}`);
}

function noop(operation, journey) {
    debug(`Journey: Nothing to be done for ${operation} on ${journey.uid}`);
}

function updateUser(user, journey) {
    if (!user) {
        return Promise.resolve(false);
    }
    if (user) {
        return sync.update(user, journey);
    }
}

Journeys.on('update', function(journey) {
    Users.findForJourney(journey.uid)
        .then((user) => updateUser(user, journey))
        .then((updated) => updated ? success('update', journey) : noop('update', journey))
        .catch((err) => error('update', journey, err));
});