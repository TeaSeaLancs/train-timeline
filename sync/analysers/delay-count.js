"use strict";

const states = require('./states');
const _ = require('underscore');

const delayMap = {
    '0.25': states.ok,
    '0.75': states.warning,
    '1.00': states.buggered
};

module.exports = userJourney => {
    const now = new Date();
    const stats = _.reduce(userJourney.journeys, (stats, journey) => {
        
        // Only take into account journeys which are after now
        if ((journey.actualTime - now) > 0) {
            stats.count += 1;
            
            if (journey.delayed || (journey.actualTime - journey.predictedTime) > 0) {
                stats.delayed += 1;
            }
        }
        
        return stats;
    }, {count: 0, delayed: 0});
    
    if (!stats.delayed || !stats.count) {
        return states.ok;
    } else {
        const delayedRatio = stats.delayed / stats.count;
        return _.find(delayMap, (state, delay) => delayedRatio <= +delay);
    }
};