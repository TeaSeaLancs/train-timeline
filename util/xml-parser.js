"use strict";

function getAttr(el, name) {
    const attr = el.attr(name);
    return (attr && attr.value()) || null;
}

function getTimes(xStop) {
    return ['pta', 'wta', 'ptd', 'wtd'].reduce((results, attr) => {
        const val = getAttr(xStop, attr);
        if (val) {
            results[attr] = val;
        }
        
        return results;
    }, {});
}

module.exports = {
    getTimes
}