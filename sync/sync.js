"use strict";

const moment = require('moment');
const _ = require('underscore');
const EventEmitter = require('events');

const Journeys = require('../models/journeys');
const Users = require('../models/users');

const timeline = require('../util/timeline');
const updater = require('../util/update');

const analyser = require('./analysers');
const watcher = require('./watch');

const emitter = new EventEmitter();

function generateDate(time) {
    return moment(time, 'HH:mm').toDate();
}

function analyseSection(section) {
    const analyserResults = analyser.analyse(section);
    const currentStatus = section.status;
    
    const counts = _.countBy(analyserResults, 'state');
    const results = _.reduce(counts, (biggest, count, status) => {
        if (!biggest || count > biggest.count) {
            biggest = {
                count,
                status
            };
        }
        
        return biggest;
    }, 0);
    
    return {
        changed: results.status !== currentStatus,
        from: currentStatus,
        to: results.status,
        details: analyserResults
    };
}

function analyse(user) {
    const analysis = {
        out: analyseSection(user.out),
        return: analyseSection(user.return)
    };
    
    if (watcher.isUserWatched(user._id)) {
        console.log(`Sync: Analysis update for ${user._id}`);
        const closestJourney = Journeys.chooseClosestUserJourney(user.out, user.return);
        if (closestJourney === user.out) {
            console.log("Out: ", JSON.stringify(analysis.out));
        } else {
        console.log("Return: ", JSON.stringify(analysis.return));
        }
    }
    
    user.out.status = analysis.out.to;
    user.return.status = analysis.return.to;
    
    return analysis;
}

function reduce(journeys) {
    return journeys.reduce((journeys, journey) => {
        journeys[journey.uid] = {
            uid: journey.uid,
            ssd: journey.ssd,
            predictedTime: journey.from.predictedTime,
            actualTime: journey.from.actualTime,
            delayed: journey.from.delayed
        };
        
        return journeys;
    }, {});
}

function shouldPushToday(user) {
    return !user.criteria.days || user.criteria.days.indexOf(new Date().getDay()) > -1;
}

function pushToTimeline(user) {
    if (!shouldPushToday(user)) {
        if (watcher.isUserWatched(user._id)) {
            console.log(`Watched user ${user._id} does not travel today, not pushing to timeline`);
        }
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
            const creationDate = new Date();
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
        const stripped = Journeys.stripJourney(journey, section.from, section.to);
        
        if (section.journeys[journey.uid].actualTime !== stripped.from.actualTime) {
            section.journeys[journey.uid].actualTime = stripped.from.actualTime;
            section.updatedAt = new Date();
            return true;
        }
    }
    
    return false;
}

function checkUpdate(data) {
    if (watcher.isUserWatched(data.userID)) {
        console.log(`Executing queued update for watched user ${data.userID}`);
    }
    Users.find(data.userID)
        .then(user => {
            if (user) {
                // Check the user's journey status now. If it's not the same as what it was before the analysis changed
                // then notify the user of that change
                if (user.out.status !== data.outState.from) {
                    timeline.send(user, user.out);
                }
                if (user.return.status !== data.returnState.from) {
                    timeline.send(user, user.return);
                }
            }
        });
}

function queueUpdate(user, outState, returnState) {
    const userID = user._id;
    
    if (watcher.isUserWatched(userID)) {
        console.log(`Queueing timeline update for watched user ${userID}`);
    }
    
    return updater.queue(userID, {
        userID,
        outState,
        returnState
    }).then(data => checkUpdate(data))
    .catch(err => console.error(err, err.stack));
}

function actOnAnalysis(user, analysis) {
    if (analysis.out.changed || analysis.return.changed) {
        queueUpdate(user, analysis.out, analysis.return);
    }
    
    return true;
}

// Updates a user with an altered journey, then recalculates the overall journeys and, if needed, updates their pin
function update(user, journey) {
    if (updateSection(user.out, journey) || updateSection(user.return, journey)) {
        const analysis = analyse(user);
        emitter.emit('analyse', user, analysis);
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

function on(event, cb) {
    return emitter.on(event, cb);
}

module.exports = {
    populate,
    cleanup,
    update,
    on
};