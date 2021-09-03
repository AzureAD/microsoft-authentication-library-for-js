/*
 * @copyright
 * Copyright © Microsoft Open Technologies, Inc.
 *
 * All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http: *www.apache.org/licenses/LICENSE-2.0
 *
 * THIS CODE IS PROVIDED *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS
 * OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION
 * ANY IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A
 * PARTICULAR PURPOSE, MERCHANTABILITY OR NON-INFRINGEMENT.
 *
 * See the Apache License, Version 2.0 for the specific language
 * governing permissions and limitations under the License.
 */
'use strict';

var adal = require('../lib/adal');
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
    clientId : 'd3590ed6-52b3-4102-aeff-aad2292ab01c',
    username : '',
    password : ''
  };
}

var authorityUrl = sampleParameters.authorityHostUrl + '/' + sampleParameters.tenant;

var resource = '00000002-0000-0000-c000-000000000000';

// +++++ Using a Private CA ++++++
// If you are testing against an ADFS instance whose SSL cert was issued by
// a private CA then you need to tell node to trust that CA.  The following
// few lines of code does that.  The cas.json file is an array of PEM files,
// one per entry.  Once you override one CA you must override them all.
// As a result, the cas.json file contains a PEM file for each CA that
// is trusted by node and mozilla by default, plus a perm file for the
// private CA that the test adfs server fs.naturalcauses.com uses.  Add your
// own CA PEM file as an entry to this file if necessary.
var casjson = fs.readFileSync('./cas.json');
var cas = JSON.parse(casjson);
https.globalAgent.options.ca = cas;


var context = new AuthenticationContext(authorityUrl);

context.acquireTokenWithUsernamePassword(resource, sampleParameters.username, sampleParameters.password, sampleParameters.clientId, function(err, tokenResponse) {
  if (err) {
    console.log('well that didn\'t work: ' + err.stack);
  } else {
    console.log(tokenResponse);
  }
});
