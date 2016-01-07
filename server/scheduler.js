"use strict";

var xmljs = require('libxmljs');
var fs = require('fs');

var Schedule = require('./schedule');

function readSchedule(path) {
    return new Promise(function (resolve, reject) {
        fs.readFile(path, function (err, data) {
            if (err) {
                reject(err);
            } else {
                console.log("Read schedule");
                resolve(data);
            }
        });
    });
}

function removeAll(document, type) {
    document.find(`//ns:${type}`, Schedule.findOptions).forEach(function (el) {
        el.remove();
    });
}

function loadSchedule(path) {
    return readSchedule(path).then(function (data) {
        var document = xmljs.parseXml(data);
        console.log("Parsed schedule");
        removeAll(document, 'PP');
        removeAll(document, 'OPIP');
        console.log("Prepared schedule");
        return Schedule.parse(document);
    });
}

loadSchedule('../../test/20160103020744_v8.xml').then(function (schedule) {
    
}).catch(function(err) {
    console.log("Error", err);
});
