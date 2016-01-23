"use strict";

const socketio = require('socket.io');
let io = null;

function handleConnect(socket) {
    console.log("Got connection");
}

function init(server, app) {
    io = socketio.listen(server);
    io.sockets.on('connection', handleConnect);
    console.log("Set up socketio connection");
}

module.exports = {
    init
};