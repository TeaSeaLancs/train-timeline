"use strict";

const _ = require("underscore");

function Reporter(fn, stream) {
    this.fn = fn;
    this.message = '';
    this.stream = stream || process.stdout;
    this.canWriteInSitu = (typeof this.stream.cursorTo === 'function');
    this.finished = false;
    this.update = _.throttle(this.update.bind(this), 500);
}

function writeInSitu(stream, message) {
    stream.cursorTo(0);
    stream.write(message);
    stream.clearLine(1);
}

Reporter.prototype.update = function update() {
    if (!this.finished) {
        const message = this.fn();
        if (message && message !== this.message) {
            this.message = message;
            if (this.canWriteInSitu) {
                writeInSitu(this.stream, message);
            } else {
                this.stream.write(message);
            }
        }
    }
};

Reporter.prototype.finish = function finish() {
    this.stream.write("\n");
    this.finished = true;
};

module.exports = Reporter;
