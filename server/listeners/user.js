"use strict";

const Users = require('../../models/users');
const sync = require('../../sync/sync');

function error(operation, user, err) {
    console.error(`User: Error performing ${operation} on ${user._id}`, err, err.stack);
}

function success(operation, user) {
    console.log(`User: Successfully performed ${operation} on ${user._id}`);
}

Users.on('insert', (user) => {
    sync.populate(user)
        .then(() => success('insert', user))
        .catch(err => error('insert', user, err));
    });

Users.on('upsert', (user, oldUser) => {
    sync.cleanup(oldUser)
        .then(() => success('upsert', user))
        .catch(err => error('upsert', user, err));
    });