"use strict";

const Journeys = require('../../models/journeys');
const Users = require('../../models/users');

const sync = require('../../sync/sync');
const watcher = require('../../sync/watch');

const debug = require('../../util/debug');

function error(operation, journey, err) {
    console.error(`Journey: Error performing ${operation} on ${journey.uid}`, err, err.stack);
}

function success(operation, journey) {
    console.log(`Journey: Successfully performed ${operation} on ${journey.uid}`);
}

function noop(operation, journey) {
    const log = watcher.isJourneyWatched(journey.uid, journey.ssd) ? console.log : debug;
    log(`Journey: Nothing to be done for ${operation} on ${journey.uid}`);
}

function updateUsers(users, journey) {
    if (watcher.isJourneyWatched(journey.uid, journey.ssd)) {
        console.log(`Journey: Found users for watched journey ${journey.uid}-${journey.ssd}`, users);
    }
    if (!users || !users.length) {
        return Promise.resolve(false);
    }
    
    return Promise.all(users.map(user => sync.update(user, journey)));
}

Journeys.on('update', function(journey, updates) {
    Users.findForJourney(journey.uid, journey.ssd)
        .then((users) => updateUsers(users, journey))
        .then((updated) => updated ? success('update', journey) : noop('update', journey))
        .catch((err) => error('update', journey, err));
});