"use strict";

const _ = require('underscore');
const EventEmitter = require('events');

const mongodb = require('../util/mongodb');

const emitter = new EventEmitter();

function find(userID) {
    return mongodb.connect().then((db) => {
        return db.collection('users').findOne({
            _id: userID
        });
    });
}

function upsert(user) {
    return mongodb.connect().then((db) => {
        const query = {_id: user._id};
        return db.collection('users').update(query, user, {
            upsert: true
        }).then(() => {
            emitter.emit('insert', user);
            return user;
        });
    });
}

function update(user) {
    return mongodb.connect().then((db) => {
        const query = {_id: user._id};
        return db.collection('users').update(query, user, {
            upsert: false
        }).then(() => {
            emitter.emit('update', user);
            return user;
        });
    });
}

function getAll() {
    return mongodb.connect().then((db) => {
        return db.collection('users').find();
    });
}

function fromParams(params) {
    return {
        _id: params.userID,
        criteria: {
            home: params.home,
            work: params.work,
            outTime: params.out_time,
            returnTime: params.return_time
        }
    };
}

const comparisonKeys = ['_id', 'criteria'];

function areEqual(u1, u2) {
    return _.isEqual(_.pick(u1, comparisonKeys), _.pick(u2, comparisonKeys));
}

function on(event, cb) {
    return emitter.on(event, cb);
}

module.exports = {
    find,
    upsert,
    update,
    getAll,
    fromParams,
    areEqual,
    on
};