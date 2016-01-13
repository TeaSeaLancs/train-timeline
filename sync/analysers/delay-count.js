"use strict";

const states = require('./states');
const _ = require('underscore');

const delayMap = {
    '0.20': states.ok,
    '0.55': states.warning,
    '1.00': states.buggered
};

module.exports = userJourney => {
    const now = new Date();
    const stats = _.reduce(userJourney.journeys, (stats, journey) => {
        stats.count += 1;

        if (journey.delayed || (journey.actualTime - journey.predictedTime) > 0) {
            // Journeys which take place after now count half as much in terms of delays
            const delayFactor = ((journey.actualTime - now) > 0) ? 0.5 : 1;
            stats.delayed += delayFactor;
        }

        return stats;
    }, {
        count: 0,
        delayed: 0
    });


    if (!stats.delayed || !stats.count) {
        return {
            state: states.ok,
            stats
        };
    } else {
        const delayedRatio = stats.delayed / stats.count;
        const state = _.find(delayMap, (state, delay) => delayedRatio < +delay);
        return {
            state,
            stats: _.extend(stats, {
                delayedRatio
            })
        };
    }
};