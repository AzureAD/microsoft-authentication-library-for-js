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

var fs = require('fs');
var adal = require('adal-node');


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

function getPrivateKey(filename) {
  var privatePem = fs.readFileSync(filename, { encoding : 'utf8'});
  return privatePem;
}

/*
 * You can override the default account information by providing a JSON file
 * with the same parameters as the sampleParameters variable below.  Either
 * through a command line argument, 'node sample.js parameters.json', or
 * specifying in an environment variable.
 * privateKeyFile must contain a PEM encoded cert with private key.
 * thumbprint must be the thumbprint of the privateKeyFile.
 * {
 *   tenant : 'naturalcauses.onmicrosoft.com',
 *   authorityHostUrl : 'https://login.windows.net',
 *   clientId : 'd6835713-b745-48d1-bb62-7a8248477d35',
 *   thumbprint : 'C1:5D:EA:86:56:AD:DF:67:BE:80:31:D8:5E:BD:DC:5A:D6:C4:36:E1',
 *   privateKeyFile : 'ncwebCTKey.pem'
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

sampleParameters = {
  tenant : 'naturalcauses.com',
  authorityHostUrl : 'https://login.windows.net',
  clientId : 'd6835713-b745-48d1-bb62-7a8248477d35',
  thumbprint : 'C15DEA8656ADDF67BE8031D85EBDDC5AD6C436E1',
  privateKeyFile : ''
};

var authorityUrl = sampleParameters.authorityHostUrl + '/' + sampleParameters.tenant;

var resource = '00000002-0000-0000-c000-000000000000';

turnOnLogging();

var context = new AuthenticationContext(authorityUrl);
var key = getPrivateKey(sampleParameters.privateKeyFile);

context.acquireTokenWithClientCertificate(resource, sampleParameters.clientId, key, sampleParameters.thumbprint, function(err, tokenResponse) {
  if (err) {
    console.log('well that didn\'t work: ' + err.stack);
  } else {
    console.log(tokenResponse);
  }
});
