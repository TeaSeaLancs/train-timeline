"use strict";

const moment = require('moment');

const Journeys = require('../models/journeys');
const Users = require('../models/users');

const timeline = require('../util/timeline');

function generateDate(time) {
    return moment(time, 'HH:mm').toDate();
}

function analyseSection(section) {
    // TODO Actually do some damn analysis
    const analysis = {
        changed: false,
        from: null,
        to: null
    };
    
    section.status = 'ok';
    
    return analysis;
}

function analyse(user) {
    return {
        out: analyseSection(user.out),
        return: analyseSection(user.return)
    };
}

function reduce(journeys) {
    return journeys.reduce((journeys, journey) => {
        journeys[journey.uid] = {
            uid: journey.uid,
            predictedTime: journey.from.predictedTime,
            actualTime: journey.from.actualTime
        };
        
        return journeys;
    }, {});
}

function shouldPushToday(user) {
    return !user.criteria.days || user.criteria.days.indexOf(new Date().getDay()) > -1;
}

function pushToTimeline(user) {
    if (!shouldPushToday(user)) {
        return Promise.resolve();
    }
    
    return Promise.all([
        timeline.send(user, user.out),
        timeline.send(user, user.return)
    ]);
}

function generateUserJourney(from, to, date) {
    return Journeys.find(from, to, date)
        .then((journeys) => {
            var creationDate = new Date();
            journeys = reduce(journeys);
            return {
                from,
                to,
                date,
                journeys,
                status: 'ok',
                delayed: false,
                createdAt: creationDate,
                updatedAt: creationDate
            };
        });
}

// Populates a user with relevant journeys from today's schedule, and pushes pins for those journeys
// to the user's timeline
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

function updateSection(section, journey) {
    if (journey.uid in section.journeys) {
        const station = section.from;
        const stripped = Journeys.stripJourney(journey, section.from, section.to);
        
        if (section.journeys[journey.uid].actualTime !== stripped.from.actualTime) {
            console.log(`Updating user from ${section.from}`);
            console.log(section.journeys[journey.uid]);
            console.log(stripped.from);
            
            section.journeys[journey.uid].actualTime = stripped.from.actualTime;
            section.updatedAt = new Date();
            return true;
        }
    }
    
    return false;
}

function actOnAnalysis(user, analysis) {
    var updates = [];
    if (analysis.out.changed) {
        updates.push(timeline.send(user, user.out, analysis.out.from));
    }
    
    if (analysis.in.changed) {
        updates.push(timeline.send(user, user.in, analysis.in.from));
    }
    
    return Promise.all(updates);
}

// Updates a user with an altered journey, then recalculates the overall journeys and, if needed, updates their pin
function update(user, journey) {
    if (updateSection(user.out, journey) || updateSection(user.return, journey)) {
        const analysis = analyse(user);
        // Trigger off the DB update and any pin pushing at the same time, then return true as we updated
        return Promise.all([Users.update(user), actOnAnalysis(user, analysis)])
            .then(() => true);
    }
    
    return Promise.resolve(false);
}

// Cleans up a given user, removing pins for today's schedule from their timeline
function cleanup(user) {
    return Promise.all([
        timeline.remove(user, user.out),
        timeline.remove(user, user.return)
    ]);
}

module.exports = {
    populate,
    cleanup,
    update
};