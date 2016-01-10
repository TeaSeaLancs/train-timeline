"use strict";

class GenericError {
    constructor(message, error) {
        this.message = message;
        this.error = error;
    }
    
    respond(res) {
        res.status(this.status).json({
            message: this.message,
            error: this.error
        });
    }
}

class BadRequest extends GenericError {
    get status() {
        return 400;
    }
}

class ServerError extends GenericError {
    get status() {
        return 500;
    }
}

function getParams(req) {
    const params = Array.prototype.slice.call(arguments, 1);
    
    return Promise.resolve(req).then(function(req) {
        return params.reduce((result, param) => {
            let optional = false;
            
            if (param.endsWith("?")) {
                param = param.substring(0, param.length-1);
                optional = true;
            }
            if (!req.query[param] && !optional) {
                throw new BadRequest(`Missing ${param} parameter`);
            }
            result[param] = req.query[param];
            return result;
        }, {});
    });
}

function handleError(res, err) {
    if (typeof err.respond === 'function') {
        err.respond(res);
    } else {
        console.log(err);
        (new ServerError('Something bad happened', err.trace)).respond(res);
    }
}

module.exports = {
    getParams,
    handleError,
    Errors: {
        BadRequest,
        ServerError
    }
};
