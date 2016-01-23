"use strict";

module.exports = (server, app) => {
    require('./stomp').init(server, app);
    require('./socketio').init(server, app);
};