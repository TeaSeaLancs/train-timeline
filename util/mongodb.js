"use strict";

const MongoClient = require("mongodb").MongoClient;
const config = require("./config");

let singleton = null;

function connect() {
    if (singleton) {
        return singleton;
    } else {
        singleton = new Promise(function(resolve, reject) {
            const mongoURL = config.mongolab.uri;
            MongoClient.connect(mongoURL, function(err, db) {
               if (err) {
                   reject(err);
               } else {
                   resolve(db);
               }
            });
        });
        return singleton;
    }
}

function disconnect() {
    if (singleton) {
        singleton.close();
        singleton = null;
    }
}

module.exports = {
    connect,
    disconnect
};