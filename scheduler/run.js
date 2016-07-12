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

const watcher = require('../sync/watch');

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
            .then(() => console.log("Scheduler: Updated users"))
            .then(() => watcher.update())
            .then(() => console.log("Scheduler: Updated watched users"));
    });
}

function clearJourneys(passthrough) {
    console.log("Scheduler: Clearing existing journeys");
    return mongodb.connect().then(mongo => mongo.collection('journeys').remove({}))
        .then(() => passthrough);
}

function disconnect() {
    mongodb.disconnect();
    ftp.disconnect();
    console.log("Scheduler: Disconnected");
    process.exit(0);
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
                .then(scheduleName => clearJourneys(scheduleName))
                .then(scheduleName => getSchedule(scheduleName, ftp))
                .then(fileName => parseSchedule(fileName))
                .then(updateUsers)
                .then(disconnect);
        }))
        .catch(handleError);
}

// Callable functions
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

function doSync() {
    updateUsers()
        .then(disconnect)
        .catch(handleError);
}

function doWatch(userID) {
    watcher.watch(userID)
        .then(disconnect);
}

function doAddUser(params) {
    params = params.split('&').reduce((params, param) => {
        const split = param.split('=');
        params[split[0]] = split[1];
        return params;
    }, {});

    let watch = false;

    if (params.watch) {
        watch = true;
        delete params.watch;
    }

    console.log("Creating user", params);
    Users.upsert(Users.fromParams(params))
        .then(user => {
            console.log("Created user", user);
            return sync.populate(user).then(() => user);
        })
        .then(user => {
            if (watch) {
                return watcher.watch(user._id);
            }
        })
        .then(disconnect);
}

function doDump() {
    ftp.connect()
        .then(ftp => {
            return findSchedule(ftp)
                .then(scheduleName => getSchedule(scheduleName, ftp))
                .then(() => disconnect());
        })
        .catch(err => console.error(err));
}

args.forEach((arg) => {
    if (arg === '--sync') {
        processed = true;
        doSync();
    } else if (arg.startsWith('--watch')) {
        processed = true;
        doWatch(getArgValue(arg, '--watch'));
    } else if (arg.startsWith('--add')) {
        processed = true;
        doAddUser(getArgValue(arg, '--add'));
    } else if (arg.startsWith('--dump')) {
        processed = true;
        doDump();
    }
});

if (!processed) {
    update();
}
