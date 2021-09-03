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
var adal = require('../lib/adal.js');
var async = require('async');
var url = require('url');
var MemoryCache = require('../lib/memory-cache');

var AuthenticationContext = adal.AuthenticationContext;

function turnOnLogging() {
    var log = adal.Logging;
    log.setLoggingOptions(
        {
            level : log.LOGGING_LEVEL.VERBOSE,
            log : function (level, message, error) {
                console.log(message);
                if (error) {
                    console.log(error);
                }
            }
        });
}

/*
 * You can override the default account information by providing a JSON file
 * with the same parameters as the sampleParameters variable below.  Either
 * through a command line argument, 'node sample.js parameters.json', or
 * specifying in an environment variable.
 * {
 *    "tenant" : "rrandallaad1.onmicrosoft.com",
 *    "authorityHostUrl" : "https://login.windows.net",
 *    "clientId" : "624ac9bd-4c1c-4687-aec8-b56a8991cfb3",
 *    "clientSecret" : "verySecret=""
 * }
 */
var parametersFile = process.argv[2] || process.env['ADAL_SAMPLE_PARAMETERS_FILE' ];

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
        tenant : 'convergeTest.onmicrosoft.com',
        authorityHostUrl : 'https://login.microsoftonline.com',
        clientId : '',
        anothertenant: ''
    };
}

var authorityUrl = sampleParameters.authorityHostUrl + '/' + sampleParameters.tenant;

var resource = '00000002-0000-0000-c000-000000000000';
var userId = '';

//turnOnLogging();

var cache = new MemoryCache();

var context = new AuthenticationContext(authorityUrl, null, cache);
context.acquireUserCode(resource, sampleParameters.clientId, 'es-mx', function (err, response) {
    if (err) {
        console.log('well that didn\'t work: ' + err.stack);
    } else {
        console.log(response);
        console.log('calling acquire token with device code');
        context.acquireTokenWithDeviceCode(resource, sampleParameters.clientId, response, function (err, tokenResponse) {
            if (err) {
                console.log('error happens when acquiring token with device code');
                console.log(err);
            }
            else {
                authorityUrl = sampleParameters.authorityHostUrl + '/' + sampleParameters.anothertenant;
                
                var context2 = new AuthenticationContext(authorityUrl, null, cache);
                context2.acquireToken(resource, userId, sampleParameters.clientId, function (err, tokenResponse) {
                    if (err) {
                        console.log('error happens when acquiring token with device code');
                        console.log(err);
                    }
                    else {
                        console.log(tokenResponse);
                    }
                });
            }
        });
    }
});

