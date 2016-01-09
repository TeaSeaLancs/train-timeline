"use strict";

const moment = require('moment');

const Journeys = require('../models/journeys');
const Users = require('../models/users');

const timeline = require('../util/timeline');

function generateDate(time) {
    return moment(time, 'HH:mm').toDate();
}

function analyse(user) {
    // TODO Actually do some damn analysis
    user.out.status = 'ok';
    user.return.status = 'ok';
}

function pushToTimeline(user) {
    return Promise.all([
        timeline.send(user, user.out),
        timeline.send(user, user.return)
    ]);
}

function generateUserJourney(from, to, date) {
    return Journeys.find(from, to, date)
        .then((journeys) => {
            var creationDate = new Date();
            return {
                from,
                to,
                date,
                journeys,
                status: 'ok',
                createdAt: creationDate,
                updatedAt: creationDate
            };
        });
}

function populate(user) {
    const outDate = generateDate(user.criteria.outTime);
    const returnDate = generateDate(user.criteria.returnTime);
    
    const to = generateUserJourney(user.criteria.home, user.criteria.work, outDate);
    const from = generateUserJourney(user.criteria.work, user.criteria.home, returnDate);
    
    return Promise.all([to, from])
        .then((results) => {
            user.out = results[0];
            user.return = results[1];
        
            analyse(user);
            return user;
        })
        .then((user) => Users.update(user))
        .then((user) => pushToTimeline(user));
}

module.exports = {
    populate
};