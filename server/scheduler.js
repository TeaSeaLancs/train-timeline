"use strict";

var xmljs = require('libxmljs');
var fs = require('fs');

var Journey = require('./journey');

function readSchedule(path) {
    return new Promise(function (resolve, reject) {
        fs.readFile(path, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

var findOptions = {
    'ns': 'http://www.thalesgroup.com/rtti/XmlTimetable/v8'
};

// TODO Refactor this to take a CRS and map into multiple TPLs rather than just one TPL
function findAllJourneys(data, from, to) {
    var journeys = data.find(`ns:Journey[*[@tpl="${from}"]/following-sibling::*[@tpl="${to}"]]`, findOptions) || [];
    return journeys.map(function (journey) {
        return Journey.parse(journey, from, to);
    });
}

function removeAll(document, type) {
    document.find(`//ns:${type}`, findOptions).forEach(function (el) {
        el.remove();
    });
}

function loadSchedule(path) {
    return readSchedule(path).then(function (data) {
        var document = xmljs.parseXml(data);
        removeAll(document, 'PP');
        removeAll(document, 'OPIP');
        return document;
    });
}


loadSchedule('../../test/20160103020744_v8.xml').then(function (schedule) {
    console.log(findAllJourneys(schedule, 'STALBCY', 'STPXBOX'));
}).catch(function(err) {
    console.log("Error", err);
});
