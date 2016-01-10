"use strict";

module.exports = (process.argv.indexOf("--debug") === -1) ? 
                    function() {} : 
                    (message) => console.log(message);