"use strict";

let Stomp = require('stompjs');
let zlib = require('zlib');

const config = require('../util/config');

const pushPortNS = {
    ns: 'http://www.thalesgroup.com/rtti/PushPort/v12',
    ns3: 'http://www.thalesgroup.com/rtti/PushPort/Forecasts/v2'
};

let singleton = null;

function connect() {
    if (singleton) {
        return Promise.resolve(singleton);
    }

    return new Promise((resolve, reject) => {
        const client = Stomp.overTCP('datafeeds.nationalrail.co.uk', 61613);
        
        function connected() {
            singleton = client;
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

function getMessages(cb) {
    return connect().then((client) => {
        client.subscribe(config.stomp.queue, (message) => {
            zlib.gunzip(message.body, function (err, body) {
                if (err) {
                    console.log(err);
                }
                
                cb(body.toString("UTF-8"));
            });
        });
    });
}

module.exports = {
    connect,
    disconnect,
    getMessages,
    pushPortNS
};
