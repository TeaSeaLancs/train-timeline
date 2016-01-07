"use strict";

const moment = require("moment");
const Reporter = require("./reporter");

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
    return moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm');
}

function parseStop(journey, xStop) {
    const station = xStop.attr("tpl").value();
    
    let predictedTime = (xStop.attr("ptd") || xStop.attr("pta"));
    let workingTime = (xStop.attr("wtd") || xStop.attr("wta"));
    
    if (!predictedTime || !workingTime) {
        throw new Error({
            message: 'Could not find predicted and working time!',
            journey,
            xStop
        });
    }
    
    predictedTime = parseTime(journey.ssd, predictedTime.value());
    workingTime = parseTime(journey.ssd, workingTime.value());
    
    journey.stops[station] = {
        station,
        predictedTime,
        workingTime
    };
    
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
    const date = moment(scheduleID, "YYYYMMDDHHmmss");
    
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
    findOptions
};