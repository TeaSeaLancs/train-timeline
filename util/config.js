"use strict";

const vars = ['MONGOLAB_URI', 
              'FTP_USER', 
              'FTP_PASSWORD', 
              'STOMP_QUEUE', 
              'STOMP_USER', 
              'STOMP_PASSWORD',
              'ENVIRONMENT'];

const defaults = {
    ENVIRONMENT: 'production'
};

module.exports = vars.reduce((config, variable) => {
    let val = process.env[variable] || defaults[variable];
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