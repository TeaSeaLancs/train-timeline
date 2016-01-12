"use strict";

const fs = require('fs');
const _ = require('underscore');
const filesize = require('filesize');

const ftp = require('./nr-ftp');
const mongodb = require('../util/mongodb');
const scheduler = require('./scheduler');

const Journeys = require('../models/journeys');
const Users = require('../models/users');

const sync = require('../sync/sync');

const debug = require('../util/debug');

// Internal functions for sorting out everything
function x(fn) {
    return function xPanded(results) {
        return fn.apply(this, results);
    };
}

function findSchedule(ftp) {
    return ftp.findSchedule();
}

function getSchedule(scheduleName, ftp) {
    return ftp.getSchedule(scheduleName)
        .then(schedule => dumpSchedule(schedule, scheduleName));
}

function dumpSchedule(schedule, filename) {
    return new Promise(function (resolve, reject) {
        fs.writeFile(filename, schedule, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(filename);
            }
        });
    });
}

function logParseProgress(message) {
    if (debug.on()) {
        const memoryUsage = _.mapObject(process.memoryUsage(), val => filesize(val));
        debug(`Memory usage (${message})`, memoryUsage);
    } else {
        console.log(message);
    }
}

function parseSchedule(fileName) {
    
    const batchSaveRequests = [];
    
    let count = 0;
    
    function saveBatch(batch) {
        const insertRequest = Journeys.insert(batch)
            .then(() => Promise.resolve())
            .catch(err => {
                console.log(err);
                return Promise.reject(err);
            });
        
        batchSaveRequests.push(insertRequest);
        count += batch.length;
        logParseProgress(`Parsed ${count} journeys`);
    }
    
    return scheduler.parse(fileName, saveBatch)
        .then(() => Promise.all(_.values(batchSaveRequests)))
        .then(() => true);
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

function disconnect() {
    mongodb.disconnect();
    ftp.disconnect();
}

function handleError(err) {
    console.error(err, err.stack);
    disconnect();
}

 function update() {
        // We don't reference mongodb's returned connection, but we want to make sure we can connect
        // before we continue
        Promise.all([ftp.connect(), mongodb.connect()])
            .then(x((ftp) => {
                return findSchedule(ftp)
                    .then(scheduleName => getSchedule(scheduleName, ftp))
                    .then(fileName => parseSchedule(fileName))
                    .then(updateUsers)
                    .then(disconnect);
            }))
            .catch(handleError);
    }

// Callable functions
/*
const callable = {
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

    function doSync() {
        updateUsers().then(disconnect)
            .catch(handleError);
    }

    function parse(filename) {
        parseSchedule(filename)
            .catch(handleError);
    }
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
    } else if (arg.startsWith('--parse')) {
        processed = true;
        parse(getArgValue(arg, '--parse'));
    } else if (arg.startsWith("--file")) {
        processed = true;
        insertFromFile(getArgValue(arg, '--file'));
    } else if (arg.startsWith("--dump")) {
        processed = true;
        dumpSchedule(getArgValue(arg, '--dump'));
    }
});*/

const processed = false;

if (!processed) {
    update();
}
