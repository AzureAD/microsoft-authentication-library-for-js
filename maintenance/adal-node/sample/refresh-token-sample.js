'use strict';

var adal = require('adal-node');
var fs = require('fs');
var https = require('https');

var AuthenticationContext = adal.AuthenticationContext;

function turnOnLogging() {
  var log = adal.Logging;
  log.setLoggingOptions(
  {
    level : log.LOGGING_LEVEL.VERBOSE,
    log : function(level, message, error) {
      console.log(message);
      if (error) {
        console.log(error);
      }
    }
  });
}

turnOnLogging();


/*
 * You can override the default account information by providing a JSON file
 * with the same parameters as the sampleParameters variable below.  Either
 * through a command line argument, 'node sample.js parameters.json', or
 * specifying in an environment variable.
 * {
 *    "tenant" : "rrandallaad1.onmicrosoft.com",
 *    "authorityHostUrl" : "https://login.windows.net",
 *    "clientId" : "624ac9bd-4c1c-4687-aec8-b56a8991cfb3",
 *    "username" : "user1",
 *    "password" : "verySecurePassword"
 * }
 */
var parametersFile = process.argv[2] || process.env['ADAL_SAMPLE_PARAMETERS_FILE'];

var sampleParameters;
if (parametersFile) {
  var jsonFile = fs.readFileSync(parametersFile);
  if (jsonFile) {
    sampleParameters = JSON.parse(jsonFile);
  } else {
    console.log('File not found, falling back to defaults: ' + parametersFile);
  }
}

if (!parametersFile) {
  sampleParameters = {
    tenant : 'rrandallaad1.onmicrosoft.com',
    authorityHostUrl : 'https://login.windows.net',
    clientId : '624ac9bd-4c1c-4686-aec8-b56a8991cfb3',
    username : 'frizzo@naturalcauses.com',
    password : ''
  };
}

var authorityUrl = sampleParameters.authorityHostUrl + '/' + sampleParameters.tenant;

var resource = '00000002-0000-0000-c000-000000000000';

var casjson = fs.readFileSync('./cas.json');
var cas = JSON.parse(casjson);

https.globalAgent.options.ca = cas;


var context = new AuthenticationContext(authorityUrl);

context.acquireTokenWithUsernamePassword(resource, sampleParameters.username, sampleParameters.password, sampleParameters.clientId, function(err, tokenResponse) {
  if (err) {
    console.log('well that didn\'t work: ' + err.stack);
    return;
  } else {
    console.log(tokenResponse);
    console.log('\nRefreshing token.\n');

    context.acquireTokenWithRefreshToken(tokenResponse['refreshToken'], sampleParameters.clientId, null, function(err, tokenResponse) {
      if (err) {
        console.log('well refreshing didn\'t work: ' + err.stack);
        return;
      } else {
        console.log(tokenResponse);
      }
    });
  }
});
