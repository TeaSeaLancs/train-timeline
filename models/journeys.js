"use strict";

const EventEmitter = require('events');
const moment = require('moment');
const _ = require('underscore');

const mongodb = require('../util/mongodb');

const emitter = new EventEmitter();

function findStops(journey, from, to) {
    const fromStops = journey.stops[from];
    const toStops = journey.stops[to];

    if (fromStops.length === 1 && toStops.length === 1) {
        if (fromStops[0].idx < toStops[0].idx) {
            return {
                from: fromStops[0],
                to: toStops[0]
            };
        }
        return null;
    }

    const closest = fromStops.reduce((closest, fromStop) => {
        return toStops.reduce((closest, toStop) => {
            const distance = toStop.idx - fromStop.idx;
            if (distance > 0 && (!closest.distance || distance < closest.distance)) {
                closest.from = fromStop;
                closest.to = toStop;
                closest.distance = distance;
            }
            return closest;
        }, closest);
    }, {
        from: null,
        to: null,
        distance: 0
    });

    return closest.distance ? closest : null;
}

function stripJourney(journey, from, to) {
    const stops = findStops(journey, from, to);
    if (stops) {
        return {
            uid: journey.uid,
            trainID: journey.trainID,
            ssd: journey.ssd,
            from: stops.from,
            to: stops.to
        };
    }

    return null;
}

function constructUserJourneys(results, from, to) {
    return results.reduce((journeys, journey) => {
        const userJourney = stripJourney(journey, from, to);
        if (userJourney) {
            journeys.push(userJourney);
        }

        return journeys;
    }, []);
}

function queryForJourneys(from, to, around, db) {
    const query = {},
        projection = {};

    const mmt = moment(around);

    const lowerBound = moment(mmt).subtract(45, 'minutes');
    const upperBound = moment(mmt).add(15, 'minutes');

    query[`stops.${from}`] = {
        $elemMatch: {
            predictedTime: {
                $gte: lowerBound.toDate(),
                $lte: upperBound.toDate()
            }
        }
    };
    query[`stops.${to}`] = {
        $exists: true
    };

    projection.uid = 1;
    projection.trainID = 1;
    projection.ssd = 1;
    projection[`stops.${from}`] = 1;
    projection[`stops.${to}`] = 1;

    return db.collection('journeys')
        .find(query, projection)
        .toArray()
        .then(results => constructUserJourneys(results, from, to));
}

function find(from, to, around) {
    return mongodb.connect()
        .then(queryForJourneys.bind(undefined, from, to, around));
}

function insert(journeys) {
    return mongodb.connect()
        .then((db) => db.collection('journeys').insertMany(journeys));
}

function findByID(uid, ssd) {
    return mongodb.connect()
        .then((db) => db.collection('journeys').findOne({
            uid, ssd
        }));
}

// TODO Actually make this handle N-level objects. It's too much to think about at this time of day.
function flatten(obj) {
    return _.reduce(obj, (flattened, subObject, subKey) => {
        return _.reduce(subObject, (flattened, val, key) => {
            flattened[`${subKey}.${key}`] = val;
            return flattened;
        }, flattened);
    }, {});
}

function update(uid, ssd, updates) {

    const updateObj = {
        $set: flatten(updates)
    };

    return mongodb.connect()
        .then((db) => db.collection('journeys').findOneAndUpdate({
            uid, ssd
        }, updateObj, {
            returnOriginal: false
        }))
        .then((result) => {
            if (result.value) {
                emitter.emit('update', result.value, updates);
            }
        });
}

function chooseClosestUserJourney() {
    const userJourneys = Array.prototype.slice.call(arguments, 0);
    if (!userJourneys.length) {
        return null;
    }
    const now = moment();
    
    const times = userJourneys.map(userJourney => {
        return {
            diff: Math.abs(now.diff(userJourney.date)),
            userJourney
        };
    });
    
    return times.reduce((closest, userJourney) => {
        if (userJourney.diff < closest.diff) {
            closest = userJourney;
        }
        return closest;
    }).userJourney;
}

function on(event, cb) {
    return emitter.on(event, cb);
}

module.exports = {
    find,
    findByID,
    chooseClosestUserJourney,
    stripJourney,
    insert,
    update,
    on,
    flatten
};
