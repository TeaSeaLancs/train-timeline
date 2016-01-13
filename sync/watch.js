"use strict";

const _ = require('underscore');

const mongodb = require('../util/mongodb');
const Users = require('../models/users');

let watched = {
    users: {},
    journeys: {}
};

const mongoQuery = {
    '_id': 'watched'
};

function toObject(arr) {
    return arr.reduce((obj, val) => {
        obj[val] = true;
        return obj;
    }, {});
}

function toArray(obj) {
    return Object.keys(obj);
}

let loadTimeout = null;

function load() {
    clearTimeout(loadTimeout);
    return mongodb.connect()
        .then(db => db.collection('settings').findOne(mongoQuery))
        .then(results => {
            if (results) {
                watched.users = toObject(results.users);
                watched.journeys = toObject(results.journeys);
            }
        })
        .then(() => loadTimeout = setTimeout(load, (30 * 60 * 1000)))
        .catch(err => console.error("Watch: Could not load watch settings!", err, err.stack));
}

function sync() {
    const prepared = {
        users: toArray(watched.users),
        journeys: toArray(watched.journeys)
    };

    console.log("Syncing watched users/journeys", prepared);
    return mongodb.connect()
        .then(db => db.collection('settings').update(mongoQuery, prepared, {
            upsert: true
        }));
}

function isUserWatched(userID) {
    if (!userID) {
        throw new Error("Missing user ID");
    }
    return (userID in watched.users);
}

function isJourneyWatched(uid, ssd) {
    if (!uid || !ssd) {
        throw new Error("Missing UID or SSD");
    }
    return (`${uid}-${ssd}` in watched.journeys);
}

function pushJourneys(journeys) {
    _.each(journeys, journey => {
        watched.journeys[`${journey.uid}-${journey.ssd}`] = true;
    });
}

function watch(userID) {
    if (isUserWatched(userID)) {
        console.log(`Watch: User ${userID} is already watched`);
        return;
    }
    return Users.find(userID)
        .then(user => {
            if (!user) {
                console.log(`Watch: Could not watch ${userID}, user does not exist`);
            } else {
                watched.users[userID] = true;
                pushJourneys(user.out.journeys);
                pushJourneys(user.return.journeys);
                return sync();
            }
        })
        .then(() => console.log(`Watch: Watched user ${userID}`))
        .catch(err => console.error(`Watch: Error watching user ${userID}`, err));
}

function update() {
    return load().then(() => {
        const users = toArray(watched.users);
        watched.users = {};
        watched.journeys = {};

        return Promise.all(users.map(user => watch(user)));
    }).catch(err => console.log("Derp", err));
}

load();

module.exports = {
    isUserWatched,
    isJourneyWatched,
    watch,
    update
};