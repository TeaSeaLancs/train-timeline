"use strict";

const MongoClient = require("mongodb").MongoClient;
const config = require("./config");

let singletonPromise = null;
let singleton = null;

function connect() {
    if (singletonPromise) {
        return singletonPromise;
    } else {
        singletonPromise = new Promise(function(resolve, reject) {
            const mongoURL = config.mongolab.uri;
            MongoClient.connect(mongoURL, function(err, db) {
               if (err) {
                   reject(err);
               } else {
                   singleton = db;
                   resolve(db);
               }
            });
        });
        return singletonPromise;
    }
}

function disconnect() {
    if (singleton) {
        singleton.close();
        singletonPromise = null;
        singletonPromise = null;
    }
}

module.exports = {
    connect,
    disconnect
};