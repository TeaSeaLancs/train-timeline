"use strict";

const fs = require('fs');
const filesize = require('filesize');
const _ = require('underscore');

const ftp = require('./nr-ftp');
const mongodb = require('../util/mongodb');
const scheduler = require('./scheduler');

const Journeys = require('../models/journeys');
const Users = require('../models/users');

const sync = require('../sync/sync');

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

function insertSchedule(schedule) {
    return Journeys.insert(schedule.journeys);
}

function updateUsers() {
    console.log("Scheduler: Updating users");

    return Users.getAll().then(users => {
        return Promise.all(users.map(user => sync.populate(user)))
            .then(() => console.log("Scheduler: Updated users"));
    });
}

function clearJourneys(mongo) {
    console.log("Scheduler: Clearing journeys");
    return mongo.collection('journeys').remove({});
}

function dump(schedule, filename) {
    return new Promise(function (resolve, reject) {
        fs.writeFile(filename, schedule, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function disconnect() {
    mongodb.disconnect();
    ftp.disconnect();
}

function handleError(err) {
    console.error(err, err.stack);
    disconnect();
}

// Callable functions
function insertFromFile(filename) {
    mongodb.connect().then(() => {
        return scheduler.load(filename)
            .then(schedule => insertSchedule(schedule))
            .then(disconnect);
    }).catch(handleError);
}

function dumpSchedule(filename) {
    ftp.connect().then((ftp) => {
        return findSchedule(ftp)
            .then(scheduleName => ftp.getSchedule(scheduleName))
            .then(schedule => dump(schedule, filename))
            .then(disconnect);
    }).catch(handleError);
}

function clear() {
    mongodb.connect().then((mongo) => {
        return clearJourneys(mongo).then(disconnect);
    }).catch(handleError);
}

function update() {
    // We don't reference mongodb's returned connection, but we want to make sure we can connect
    // before we continue
    Promise.all([ftp.connect(), mongodb.connect()])
        .then(x((ftp) => {
            return findSchedule(ftp)
                .then(getSchedule.bind(null, ftp))
                .then(parseSchedule)
                .then(insertSchedule)
                .then(updateUsers)
                .then(disconnect);
        }))
        .catch(handleError);
}

function doSync() {
    updateUsers().then(disconnect)
        .catch(handleError);
}

function logMemoryUsage(message, passthrough) {
    const memoryUsage = _.mapObject(process.memoryUsage(), val => filesize(val));
    
    console.log(`Memory usage (${message})`, memoryUsage);
    return passthrough;
}

function toXML(filename) {
    logMemoryUsage('pre-load');
    return scheduler.read(filename)
        .then(file => logMemoryUsage('post-load', file))
        .then(file => scheduler.toXML(file))
        .then(() => logMemoryUsage('post-parse'))
        .catch(handleError);
}

const args = process.argv.slice(2);
let processed = false;

function getArgValue(arg, name) {
    const val = arg.substring(name.length + 1);
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
    } else if (arg === '--sync') {
        processed = true;
        doSync();
    } else if (arg.startsWith('--toXML')) {
        processed = true;
        toXML(getArgValue(arg, '--toXML'));
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
