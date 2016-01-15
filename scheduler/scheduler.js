"use strict";

const fs = require('fs');
const bigXml = require('big-xml');

const Schedule = require('../util/schedule-parser');

const ROOTS = /^Journey$/;
const BATCH_SIZE = 1000;

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

function parse(filename, emit) {
    return new Promise((resolve, reject) => {
        try {
            const parser = bigXml.createReader(filename, ROOTS, {});

            let batch = [];
            parser.on('record', record => {
                const journey = Schedule.parseJourney(record);
                if (journey) {
                    batch.push(journey);
                    if (batch.length === BATCH_SIZE) {
                        emit(batch);
                        batch = [];
                    }
                }
            });

            parser.on('end', () => {
                emit(batch);
                resolve();
            });

            parser.on('error', err => reject(err));
        } catch(err) {
            reject(err);
        }
    });
}


function load(path) {
    return read(path).then(parse);
}

module.exports = {
    parse,
    load,
    read
};