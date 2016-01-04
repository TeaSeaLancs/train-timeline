"use strict";

function parseStop(stop, isStart) {
    var station = stop.attr("tpl");
    var time = stop.attr(isStart ? "wtd" : "wta");
    
    if (!station || !time) {
        throw "Incorrect attributes for " + stop.toString();
    }
    
    return {
        station: station.value(),
        time: time.value()
    };
}

function parse(xml, start, stop) {
    var id = xml.attr('rid').value();
    
    var fromStop = xml.get(`*[@tpl="${start}"]`);
    var toStop = xml.get(`*[@tpl="${stop}"]`);
    
    if (!fromStop || !toStop) {
        throw "No stops for " + xml.toString();
    }
    
    var from = parseStop(fromStop, true);
    var to = parseStop(toStop, false);
    
    return {
        id,
        from,
        to
    };
}

module.exports = {
    parse: parse
};
