"use strict";

const Client = require('ftp');
const zlib = require('zlib');
const filesize = require('filesize');

const config = require('../util/config');
const Reporter = require('../util/reporter');
const debug = require('../util/debug');

let singleton = null;
let singletonPromise = null;

function scheduleFilter(file) {
    return file.type === '-' &&
        file.name.endsWith('.xml.gz') &&
        !file.name.includes("_ref_");
}

function Connection(connection) {
    this.connection = connection;
}

Connection.prototype.findSchedule = function () {
    return new Promise((resolve, reject) => {
        this.connection.list((err, list) => {
            if (err) {
                reject(err);
            } else {
                const schedule = list.filter(scheduleFilter)[0];
                if (!schedule) {
                    reject(new Error("No schedule exists on servers, this is a big problem!"));
                } else {
                    console.log("Scheduler: New schedule is " + filesize(schedule.size));
                    resolve(schedule.name);
                }
            }
        });
    });
};

function downloadSchedule(connection, scheduleName) {
    return new Promise((resolve, reject) => {
       connection.get(scheduleName, (err, stream) => {
           if (err) {
               reject(err);
           } else {
               let output = new Buffer(0);
               
               const reporter = new Reporter(() => {
                   return `Downloaded ${filesize(output.length)}`;
               });
               
               stream.on('data', data => {
                   output = Buffer.concat([output, data]);
                   reporter.update();
               });
               
               stream.once('end', () => {
                   reporter.finish();
                   resolve(output);
               });
           }
       });
    });
}

function unzipSchedule(schedule) {
    console.log("Scheduler: Unzipping schedule");
    return new Promise((resolve, reject) => {
        zlib.gunzip(schedule, (err, unzipped) => {
            console.log("Scheduler: Unzipped schedule");
            if (err) {
                reject(err);
            } else {
                resolve(unzipped.toString("UTF-8"));
            }
        });
    });
}

Connection.prototype.getSchedule = function (scheduleName) {
    return downloadSchedule(this.connection, scheduleName)
        .then(schedule => unzipSchedule(schedule));
};

Connection.prototype.disconnect = function () {
    this.connection.end();
};

function connect() {
    if (singletonPromise) {
        return singletonPromise;
    } else {
        singletonPromise = new Promise(function (resolve, reject) {
            const connection = new Client();
            connection.on('ready', () => {
                singleton = new Connection(connection);
                resolve(singleton);
            });
            connection.on('error', (err) => reject(err));

            debug("Connecting to FTP");
            connection.connect({
                host: 'datafeeds.nationalrail.co.uk',
                user: config.ftp.user,
                password: config.ftp.password
            });
        });
        return singletonPromise;
    }
}

function disconnect() {
    if (singleton) {
        debug("Disconnecting from FTP");
        singleton.disconnect();
        singleton = null;
        singletonPromise = null;
    }
}

module.exports = {
    connect,
    disconnect
};
