"use strict";

var _ = require('underscore');

// Analyses the given set of journeys by calculating a factor of how much a delay in any given journey is
// going to likely impact the user in question.
module.exports = (userJourney) => {
    const idealTime = userJourney.date;

    const delays = _.mapObject(userJourney.journeys, journey => {
        let relevance = 0,
            score = 0;
        // Calculate the delay between the prediction and the actual time.
        const delay = journey.predictedTime - journey.actualTime;

        if (delay > 0) {
            // Calculate a relevance factor from the predicted time and the ideal time of travel
            relevance = Math.min(journey.predictedTime, idealTime) / Math.max(journey.predictedTime, idealTime);

            // And generate the score by dividing the two
            score = delay / relevance;
        }

        return {
            uid: journey.uid,
            delay,
            relevance,
            score
        };
    });

    console.log(`Analysis for user journey ${userJourney.from}-${userJourney.to} @ ${userJourney.date}"`, delays);
    return;
};
