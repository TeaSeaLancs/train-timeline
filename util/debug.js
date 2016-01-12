"use strict";

const hasDebug = process.argv.indexOf("--debug") > -1;

const debug = (!hasDebug) ? 
                    function() {} : 
                    (message) => console.log(message);

debug.on = function() { return hasDebug; }

module.exports = debug;