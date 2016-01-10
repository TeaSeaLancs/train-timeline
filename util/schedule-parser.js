"use strict";

const moment = require("moment");
const Reporter = require("../util/reporter");

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

function parseTime(date, time) {
    return moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm').toDate();
}

function getTime(xStop, ssd, prefix) {
    let time = (xStop.attr(`${prefix}d`) || xStop.attr(`${prefix}a`));
    if (!time) {
        return null;
    }

    return parseTime(ssd, time);
}

function getPredictedTime(xStop, ssd) {
    return getTime(xStop, ssd, 'pt');
}

function getWorkingTime(xStop, ssd) {
    return getTime(xStop, ssd, 'wt');
}

function getAttr(el, name) {
    const attr = el.attr(name);
    return (attr && attr.value()) || null;
}

function getTimes(xStop) {
    return ['pta', 'wta', 'ptd', 'wtd'].reduce((results, attr) => {
        const val = getAttr(xStop, attr);
        if (val) {
            results[attr] = val;
        }
        
        return results;
    }, {});
}

function parseStop(journey, xStop, idx) {
    const station = xStop.attr("tpl").value();

    const predictedTime = getPredictedTime(xStop, journey.ssd);
    const actualTime = getWorkingTime(xStop, journey.ssd);

    const times = getTimes(xStop);

    if (!predictedTime || !actualTime) {
        throw new Error({
            message: 'Could not find predicted and working time!',
            journey,
            xStop
        });
    }

    const forStation = journey.stops[station] || (journey.stops[station] = []);

    forStation.push({
        idx,
        station,
        predictedTime,
        actualTime,
        times
    });

    return journey;
}

function parseJourney(reporter, schedule, xJourney) {
    const trainCat = xJourney.attr("trainCat");

    if (trainCat && !(trainCat.value() in passengerServiceCodes)) {
        schedule.skipped += 1;
    } else {
        const uid = xJourney.attr("uid").value();
        const trainID = xJourney.attr("trainId").value();
        const ssd = xJourney.attr("ssd").value();

        const journey = {
            uid,
            trainID,
            ssd,
            stops: {}
        };

        xJourney.find("ns:OR | ns:IP | ns:DT", findOptions).reduce(parseStop, journey);

        schedule.journeys.push(journey);
    }

    reporter.update();

    return schedule;
}

function parse(xSchedule) {
    const scheduleID = xSchedule.root().attr("timetableID").value();
    const date = moment(scheduleID, "YYYYMMDDHHmmss").toDate();

    const schedule = {
        scheduleID,
        date,
        journeys: [],
            skipped: 0
    };

    const xJourneys = xSchedule.find('ns:Journey', findOptions);

    const reporter = new Reporter(() => {
        return `Parsed ${schedule.journeys.length + schedule.skipped} of ${xJourneys.length} (Skipped ${schedule.skipped})`;
    });

    xJourneys.reduce(parseJourney.bind(undefined, reporter), schedule);

    reporter.finish();

    return schedule;
}

module.exports = {
    parse,
    findOptions,
    parseTime,
    getTimes
};
