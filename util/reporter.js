"use strict";

const _ = require("underscore");

function Reporter(fn, stream) {
    this.fn = fn;
    this.message = '';
    this.stream = stream || process.stdout;
    this.finished = false;
    this.update = _.throttle(this.update.bind(this), 500);
}

Reporter.prototype.update = function update() {
    if (!this.finished) {
        const message = this.fn();
        if (message && message !== this.message) {
            this.stream.cursorTo(0);
            this.stream.write(message);
            this.stream.clearLine(1);
            this.message = message;
        }
    }
};

Reporter.prototype.finish = function finish() {
    this.stream.write("\n");
    this.finished = true;
};

module.exports = Reporter;
