"use strict";

const moment = require("moment");

const findOptions = {
    'ns': 'http://www.thalesgroup.com/rtti/XmlTimetable/v8'
};

const passengerServiceCodes = {
    OL: 'OL',
    OO: 'OO',
    OW: 'OW',
    XC: 'XC',
    XD: 'XD',
    XI: 'XI',
    XR: 'XR',
    XX: 'XX',
    XZ: 'XZ'
};

const validStopTags = {
    OR: 'OR',
    IP: 'IP',
    DT: 'DT'
};

function parseTime(date, time) {
    return moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm').toDate();
}

function getTime(sourceStop, ssd, prefix) {
    let time = (sourceStop.attrs[`${prefix}d`] || sourceStop.attrs[`${prefix}a`]);
    if (!time) {
        return null;
    }

    return parseTime(ssd, time);
}

function getTimes(sourceStop) {
    return ['pta', 'wta', 'ptd', 'wtd'].reduce((results, attr) => {
        const val = sourceStop.attrs[attr];
        if (val) {
            results[attr] = val;
        }

        return results;
    }, {});
}

function getPredictedTime(sourceStop, ssd) {
    return getTime(sourceStop, ssd, 'pt');
}

function getWorkingTime(sourceStop, ssd) {
    return getTime(sourceStop, ssd, 'wt');
}

function parseJourney(sourceJourney) {
    const trainCat = sourceJourney.attrs.trainCat;

    if (trainCat && !(trainCat in passengerServiceCodes)) {
        return null;
    } else {
        const uid = sourceJourney.attrs.uid;
        const trainID = sourceJourney.attrs.trainId;
        const ssd = sourceJourney.attrs.ssd;

        const journey = {
            uid,
            trainID,
            ssd,
            stops: {}
        };

        sourceJourney.children.reduce(parseStop, journey);
        return journey;
    }
}

function parseStop(journey, sourceStop, idx) {
    if (sourceStop.tag in validStopTags) {
        const station = sourceStop.attrs.tpl;

        const predictedTime = getPredictedTime(sourceStop, journey.ssd);
        const actualTime = getWorkingTime(sourceStop, journey.ssd);

        const times = getTimes(sourceStop);

        if (!predictedTime || !actualTime) {
            throw new Error({
                message: 'Could not find predicted and working time!',
                journey,
                sourceStop
            });
        }

        const forStation = journey.stops[station] || (journey.stops[station] = []);

        forStation.push({
            idx,
            station,
            predictedTime,
            actualTime,
            times,
            delayed: false
        });
    }

    return journey;
}

module.exports = {
    parseJourney,
    findOptions,
    parseTime
};