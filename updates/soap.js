"use strict";

var soap = require('soap');

var token = '1bf33be6-40b0-465d-9a3a-2b8cba980af4';

var options = {
    forceSoap12Headers: true
};

soap.createClient('../wsdl/ldbms-wsdl.aspx', options, function(err, client) {
    if (err) {
        throw err;
    }
    client.addSoapHeader({
        'cta:AccessToken': {
            'cta:TokenValue': token
        }
    });
    
    var params = {
        numRows: 10,
        crs: 'SAC',
        filterCrs: 'STP',
        filterType: 'to',
        timeOffset: 0,
        timeWindow: 120
    };
    
    client.GetDepartureBoard(params, function(err, result) {
        if (err) {
            throw err;
        }
        console.log(client.lastRequest);
        console.log(result.GetStationBoardResult.trainServices);
    });
});
