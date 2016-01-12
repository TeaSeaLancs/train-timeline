"use strict";

const fs = require('fs');
const bigXml = require('big-xml');

const Schedule = require('../util/schedule-parser');

const ROOTS = /^Journey$/;

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

function streamXML(filename) {
    return new Promise((resolve, reject) => {
        const parser = bigXml.createReader(filename, ROOTS, {});
        
        parser.on('record', record => console.log(record));
    });
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
    streamXML,
    read
};