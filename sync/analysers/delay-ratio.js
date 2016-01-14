"use strict";

const _ = require('underscore');
const moment = require('moment');

const states = require('./states');

const delayMap = {
    '0.15': states.ok,
    '0.49': states.warning,
    '1.01': states.buggered
};

const TIME_BEFORE_TRAVEL = 45;
const TIME_FACTOR = TIME_BEFORE_TRAVEL * 2;

const SEVERITY_FACTOR = 10;

module.exports = userJourney => {
    const now = moment();
    const travelDate = moment(userJourney.date);
    
    const stats = _.reduce(userJourney.journeys, (stats, journey) => {
        // We calculate a maximum delay factor by comparing this journey's predicted time to when the user wants to travel
        // We assume that stats start 45 minutes before the user wants to travel (TODO Centralise this).
        // At 45 minutes to travel, the factor is 0.5. At 0 minutes onwards, it's 1.
        const timeUntilTravel = travelDate.diff(journey.predictedTime, 'minutes', true);
        const maxDelayFactor = Math.min(1 - (timeUntilTravel / TIME_FACTOR), 1);
        
        // Then calculate the delay severity by looking at the difference between the actual time and predicted time. This reaches 1 at 10 minutes delay.
        const delayTime = moment(journey.actualTime).diff(journey.predictedTime, 'minutes', true);
        let delaySeverity = Math.min(delayTime / SEVERITY_FACTOR, 1);
        
        // If this journey is marked as delayed, but there's no delay time, just assume the severity is 1 anyway.
        if (!delayTime && journey.delayed) {
            delaySeverity = 1;
        }
        
        // Journeys which take place before now (And before the date of travel) count half as much
        const hasGone = now.isAfter(journey.actualTime) && travelDate.isAfter(journey.actualTime);
        if (hasGone) {
            delaySeverity = delaySeverity / 2;
        }
        
        // And then calculate the delay factor by multiplying the two together.
        const delayFactor = maxDelayFactor * delaySeverity;
        
        // Log it all into the stats and continue
        stats.delayFactor += delayFactor;
        stats.maxDelayFactor += maxDelayFactor;
        stats.rawData[`${journey.uid}-${journey.ssd}`] = {
            timeUntilTravel,
            maxDelayFactor,
            delayTime,
            delaySeverity,
            hasGone
        };

        return stats;
    }, {
        delayRatio: 0,
        delayFactor: 0,
        maxDelayFactor: 0,
        rawData: {}
    });
    
    const result = {
        stats,
        state: states.ok
    };
    
    // Finally we can see how buggered we are by creating a ratio of the delay factor and max delay factor, and comparing that to our lookup charts.
    if (stats.delayFactor) {
        const delayRatio = stats.delayFactor / stats.maxDelayFactor;
        stats.delayRatio = delayRatio;
        result.state = _.find(delayMap, (state, delay) => delayRatio < +delay);
    }
    
    return result;
};