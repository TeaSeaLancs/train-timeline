"use strict";

const states = require('./states');
const _ = require('underscore');

const delayMap = {
    '0.25': states.ok,
    '0.75': states.warning,
    '1.00': states.buggered
};

module.exports = userJourney => {
    const journeyCount = _.size(userJourney.journeys);
    const delayedCount = _.reduce(userJourney.journeys, (delayed, journey) => {
        
        if (journey.delayed || (journey.actualTime - journey.predictedTime) > 0) {
            delayed += 1;
        }
        
        return delayed;
    }, 0);
    
    if (!delayedCount) {
        return states.ok;
    } else {
        const delayedRatio = delayedCount / journeyCount;
        return _.find(delayMap, (state, delay) => delayedRatio <= +delay);
    }
};