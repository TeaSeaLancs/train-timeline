"use strict";

const Users = require('../../models/users');
const sync = require('../../sync/sync');

function handleUpdateError(err) {
    console.log("Error updating user", err);
}

function success() {
    console.log("Sent pins!");
}

Users.on('insert', (user) => sync.populate(user).then(success).catch(handleUpdateError));