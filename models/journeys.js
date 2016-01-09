"use strict";

const moment = require('moment');

const mongodb = require('../util/mongodb');

function direction(from, to, result) {
    return result.stops[from].idx < result.stops[to].idx;
}

function queryForJourneys(from, to, around, mongo) {
    const query = {}, projection = {}, sort = {};
    
    const mmt = moment(around);
    
    const lowerBound = moment(mmt).subtract(30, 'minutes');
    const upperBound = moment(mmt).add(30, 'minutes');
    
    query[`stops.${from}.predictedTime`] = {$gte: lowerBound.toDate(), $lte: upperBound.toDate()};
    query[`stops.${to}`] = {$exists: true};
    
    projection.uid = 1;
    projection.trainID = 1;
    projection[`stops.${from}`] = 1;
    projection[`stops.${to}`] = 1;
    
    sort[`stops.${from}.predictedTime`] = 1;
    
    const directionFilter = direction.bind(undefined, from, to);
    
    return mongo.collection('journeys')
        .find(query, projection)
        .sort(sort)
        .toArray()
        .then((results) => results.filter(directionFilter));
}

function find(from, to, around) {
    return mongodb.connect()
        .then(queryForJourneys.bind(undefined, from, to, around));
}

module.exports = {
    find
};