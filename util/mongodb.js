"use strict";

const MongoClient = require("mongodb").MongoClient;
const config = require("./config");

let singleton = null;

function connect() {
    if (singleton) {
        return Promise.resolve(singleton);
    } else {
        return new Promise(function(resolve, reject) {
            const mongoURL = config.mongolab.url;
            MongoClient.connect(mongoURL, function(err, db) {
               if (err) {
                   reject(err);
               } else {
                   singleton = db;
                   resolve(db);
               }
            });
        });
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