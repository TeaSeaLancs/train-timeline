"use strict";

const ftp = require('./nr-ftp');
const mongodb = require('../util/mongodb');
const scheduler = require('./scheduler');

// Internal functions for sorting out everything
function x(fn) {
    return function xPanded(results) {
        return fn.apply(this, results);
    };
}

function findSchedule(ftp) {
    return ftp.findSchedule();
}

function getSchedule(ftp, scheduleName) {
    return ftp.getSchedule(scheduleName);
}

function parseSchedule(schedule) {
    return scheduler.parse(schedule);
}

function insertSchedule(mongo, schedule) {
    return mongo.collection('journeys').insertMany(schedule.journeys);
}

// Callable functions
function insertFromFile(filename) {
    mongodb.connect().then((mongo) => {
        return scheduler.load(filename)
            .then((schedule) => {
                return insertSchedule(mongo, schedule);
            }).then(() => {
                mongodb.disconnect();
            });
    }).catch((err) => {
        console.error(err);
        mongodb.disconnect();
    });
}

function dumpSchedule(filename) {
    ftp.connect().then((ftp) => {
        return findSchedule(ftp)
            .then((scheduleName) => {
                return ftp.dumpSchedule(scheduleName, filename);
            })
            .then(() => {
                ftp.disconnect();
            });
    }).catch((err) => {
        console.error(err);
        ftp.disconnect();
    });
}

function clearJourneys(mongo) {
    console.log("Clearing journeys");
    return mongo.collection('journeys').remove({});
}

function clear() {
    console.log("Connecting to MongoDB");
    mongodb.connect().then((mongo) => {
        return clearJourneys(mongo).then(() => {
            mongodb.disconnect();
        });
    }).catch((err) => {
        console.error(err);
        mongodb.disconnect();
    });
}

function update() {
    Promise.all([ftp.connect(), mongodb.connect()])
        .then(x((ftp, mongo) => {
            return findSchedule(ftp)
                .then(getSchedule.bind(undefined, ftp))
                .then(parseSchedule)
                .then(insertSchedule.bind(undefined, mongo))
                .then(function () {
                    ftp.disconnect();
                    mongodb.disconnect();
                });
        }))
        .catch((err) => {
            console.error(err);
            ftp.disconnect();
            mongodb.disconnect();
        });
}

const args = process.argv.slice(2);
let processed = false;

function getArgValue(arg, name) {
    const val = arg.substring(name.length+1);
    if (!val) {
        console.error(`You need to supply a value for ${name}`);
        process.exit(1);
    }
    
    return val;
}

args.forEach((arg) => {
    if (arg === '--clear') {
        processed = true;
        clear();
    } else if (arg.startsWith("--file")) {
        processed = true;
        insertFromFile(getArgValue(arg, '--file'));
    } else if (arg.startsWith("--dump")) {
        processed = true;
        dumpSchedule(getArgValue(arg, '--dump'));
    }
});

if (!processed) {
    update();
}
