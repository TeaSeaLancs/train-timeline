"use strict";

const hasDebug = process.argv.indexOf("--debug") > -1;

const debug = (!hasDebug) ? 
                    function() {} : 
                    () => console.log.apply(console, arguments);

debug.on = function() { return hasDebug; };

module.exports = debug;