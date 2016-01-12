"use strict";

const xmljs = require('libxmljs');
const fs = require('fs');

const Schedule = require('../util/schedule-parser');

function read(path) {
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

function removeAll(document, type) {
    document.find(`//ns:${type}`, Schedule.findOptions).forEach(function (el) {
        el.remove();
    });
}

function toXML(data) {
    const document = xmljs.parseXml(data);
    removeAll(document, 'PP');
    removeAll(document, 'OPIP');
    removeAll(document, 'Association');
    return document;
}

function parse(data) {
    return Schedule.parse(toXML(data));
}

function load(path) {
    return read(path).then(parse);
}

module.exports = {
    parse,
    load,
    toXML,
    read
};