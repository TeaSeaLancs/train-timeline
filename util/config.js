"use strict";

const vars = ['MONGOLAB_URL', 
              'FTP_USER', 
              'FTP_PASSWORD', 
              'STOMP_QUEUE', 
              'STOMP_USER', 
              'STOMP_PASS'];

module.exports = vars.reduce((config, variable) => {
    const val = process.env[variable];
    if (!val) {
        throw `Missing environment variable ${variable}`;
    }
    const parts = variable.toLowerCase().split("_");
    
    const varName = parts.pop();
    const loc = parts.reduce((loc, name) => {
        if (!loc[name]) {
            loc[name] = {};
        }
        return loc[name];
    }, config);
    
    loc[varName] = val;
    
    return config;
}, {});