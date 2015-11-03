'use strict';

var express = require( 'express' ),
    app = express(),
    _ = require( 'lodash' ),
    bodyParser = require( 'body-parser' ),
    q = require( 'q' ),
    http = require( 'http' );

app.use( bodyParser.json() );


var yahooUrl = 'finance.yahoo.com';
var yahooPath = '/webservice/v1/symbols/';

var makeRequest = function( ticker ) {
    var deferred = q.defer();

    var requestOptions = {
        method: 'GET',
        host: yahooUrl,
        path: yahooPath + ticker + '/quote?format=json'
    };

    var result = '';
    var request = http.request( requestOptions, function( response) {
       response.on( 'data', function( chunk) {
           result += chunk;
       }).on( 'end', function() {
          deferred.resolve( result );
       });
    });

    request.on( 'error', function(err) {
        deferred.reject( err );
    });

    request.end();
    return deferred.promise;
}

app.get( '/price', function( req, res ) {
    var query = req.query;
    var ticker = query['q'];
    console.log( 'Ticker: ' + ticker );
    makeRequest( ticker).then( function (response) {
        var jsonObject = JSON.parse( response );
        var list = jsonObject['list'];
        var resources = list['resources'];
        var price = resources[0];
        var resource = price['resource'];
        var fields = resource['fields'];
        var p = fields['price'];

        res.setHeader( 'Content-Type', 'text/plain' );
        res.send( p );
    }).catch( function( error ) {
       console.log( error );
        res.status( 500 ).send( { error: error } );
    });
});

function start( ) {
    app.listen( 3000 );
}

var exitHandler = function( error ) {
  if ( error ){
      console.log( 'Error occurred: ' + error );
  } else {
      console.log( 'Exiting...' );
  }
  process.exit();
};

process.on( 'uncaughtException', exitHandler );
process.on( 'exit', exitHandler );
process.on( 'SIGINT', exitHandler );

start();