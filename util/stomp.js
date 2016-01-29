"use strict";

let Stomp = require('stompjs');
let zlib = require('zlib');

const config = require('../util/config');

const pushPortNS = {
    ns: 'http://www.thalesgroup.com/rtti/PushPort/v12',
    ns3: 'http://www.thalesgroup.com/rtti/PushPort/Forecasts/v2'
};

const WAIT_TIME = 30 * 1000;
const DEAD_TIME = WAIT_TIME*2;

let singleton = null;

function connect() {
    if (singleton) {
        return Promise.resolve(singleton);
    }

    return new Promise((resolve, reject) => {
        console.log("Starting stomp listener");
        const client = Stomp.overTCP('datafeeds.nationalrail.co.uk', 61613);
        
        function connected() {
            singleton = client;
            console.log("Started stomp listener");
            resolve(singleton);
        }
        
        function error(err) {
            reject(err);
        }
        
        client.connect(config.stomp.user, config.stomp.password, connected, error);
    });
}

function disconnect() {
    if (singleton) {
        singleton.disconnect();
        singleton = null;
    }
}

function subscribe(client, cb) {
    client.subscribe(config.stomp.queue, (message) => {
        zlib.gunzip(message.body, function (err, body) {
            if (err) {
                console.log("Stomp: ", err);
            }

            cb(body.toString("UTF-8"));
        });
    });
}

function tick(cb) {
    return new Promise((resolve, reject) => {
        function tock() {
            if (cb()) {
                console.log("Stomp: Tick");
                return setTimeout(tock, WAIT_TIME);
            }
            reject();
        }
        tock();
    });
}

function track(callback) {
    let lastMessageTime = Date.now();
    
    tick(() => (Date.now() - lastMessageTime) < DEAD_TIME)
        .catch((err) => {
            if (err) {
                console.error(err);
            } else {
                resurrect(callback);
            }
        });
        
    return function(message) {
        lastMessageTime = Date.now();
        callback(message);
    };
}

function resurrect(cb) {
    console.log("Stomp: Oh he dead. Resurrecting!");
    disconnect();
    return getMessages(cb);
}

function getMessages(cb) {
    return connect().then((client) => {
        subscribe(client, track(cb));
    });
}

module.exports = {
    connect,
    disconnect,
    getMessages,
    pushPortNS
};
