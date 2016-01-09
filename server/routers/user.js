"use strict";

const moment = require('moment');

const Users = require('../../models/users');
const Common = require('../common');

function checkTime() {
    const times = Array.prototype.slice.call(arguments, 0);
    times.forEach((time) => {
       if (!moment(time, 'HH:mm').isValid()) {
           throw new Common.Errors.BadRequest(`Bad time '${time}' passed. Needs to be in the format HH:mm`);
       } 
    });
}

function registerUser(req, res) {
    Common.getParams(req, 'userID', 'home', 'work', 'out_time', 'return_time')
        .then((params) => {
            checkTime(params.out_time, params.return_time);
            return Users.find(params.userID)
                .then(createOrUpdate.bind(null, Users.fromParams(params)))
                .then(() => {
                    res.json({status: 'OK'});
                });
        })
        .catch(Common.handleError.bind(undefined, res));
}

function createOrUpdate(passedUser, existingUser) {
    if (!existingUser || !Users.areEqual(passedUser, existingUser)) {
        console.log("Upserting user", passedUser);
        return Users.upsert(passedUser);
    }
    
    console.log("Nothing to be updated for ", passedUser);
    return Promise.resolve();
}

module.exports = (app) => {
    app.post('/register', registerUser);
};