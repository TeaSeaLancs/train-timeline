"use strict";

const xmljs = require('libxmljs');

const Stomp = require('../../util/stomp');
const Schedule = require('../../util/schedule-parser');
const debug = require('../../util/debug');

const Journeys = require('../../models/journeys');

function getStop(stops, times) {
    if (!stops) {
        return;
    } else if (stops.length === 1) {
        return {
            stop: stops[0],
            idx: 0
        };
    } else {
        // Given multiple stops, we narrow down the stop by finding the one which matches the times provided
        let stop = null,
            idx = -1;
        stops.some((s, i) => {
            if ((times.pta && times.pta === s.times.pta) || (times.ptd && times.ptd === s.times.ptd)) {
                stop = s;
                idx = i;
            }
            return !!stop;
        });
        
        return {
            stop,
            idx
        };
    }
}

function parsePredictionPart(part) {
    if (!part) {
        return null;
    }

    const delayed = part.attr("delayed");
    const et = part.attr("et");
    const at = part.attr("at");

    return {
        time: (at && at.value() || et && et.value()),
        delayed: !!(delayed && delayed.value() === 'true')
    };
}

function parsePrediction(journey) {
    const arrival = parsePredictionPart(journey.get('ns3:arr', Stomp.pushPortNS));
    const departure = parsePredictionPart(journey.get('ns3:dep', Stomp.pushPortNS));

    return {
        arrival,
        departure,
        delayed: !((arrival && arrival.delayed) || (departure && departure.delayed))
    };
}

function updateJourney(update, journey, uid, ssd) {
    if (!journey) {
        debug(`Update received for ${uid} ${ssd}, but it's not in the DB`);
        return false;
    }

    let updated = false;
    const updates = update.find('ns3:Location', Stomp.pushPortNS).reduce((updates, location) => {
        const tpl = location.attr("tpl").value();
        const times = Schedule.getTimes(location);

        const found = getStop(journey.stops[tpl], times);

        if (!found) {
            if (journey.stops[tpl]) {
                console.error("Mismatched update");
                console.error(location.toString());
                console.log(journey.stops[tpl]);
            }
        } else {
            const stop = found.stop;
            const idx = found.idx;

            const prediction = parsePrediction(location);
            // Check to see if what we're concerned with is the arrival or departure
            const predictionArea = stop.times.ptd ? prediction.departure : prediction.arrival;
            if (predictionArea) {
                const predictionTime = Schedule.parseTime(journey.ssd, predictionArea.time);
                if (predictionTime.getTime() !== stop.actualTime.getTime()) {
                    updated = true;
                    updates[`stops.${tpl}.${idx}.actualTime`] = predictionTime;
                    updates[`stops.${tpl}.${idx}.delayed`] = prediction.delayed;
                }
            }
        }

        return updates;
    }, {});
    
    if (!updated) {
        return updated;
    } else {
        return Journeys.update(journey.uid, journey.ssd, updates)
            .then(() => {
                debug(`Processed update for ${journey.uid} - ${journey.ssd}`);
                return updated;
            });
    }
}

function parseUpdate(update) {
    const uid = update.attr('uid').value();
    const ssd = update.attr('ssd').value();

    if (!uid || !ssd) {
        console.error("Update retrieved, but no idea what it is");
        return;
    }

    return Journeys.findByID(uid, ssd)
        .then(journey => updateJourney(update, journey, uid, ssd))
        .catch((err) => {
            console.error("Error parsing update", err, err.stack);
        });
}

let tick = null;

module.exports = () => {
    console.log("Starting stomp listener");
    tick = new Date();
    Stomp.getMessages(message => {
        const xMessage = xmljs.parseXml(message);
        const xTS = xMessage.get('ns:uR/ns:TS', Stomp.pushPortNS);
        if (xTS) {
            parseUpdate(xTS).then((result) => {
                const now = new Date();
                if (result) {
                    tick = now;
                } else if ((now.getTime() - tick.getTime()) > 5000) {
                    tick = now;
                    debug("Still alive");
                }
            });
        }
    });
};
