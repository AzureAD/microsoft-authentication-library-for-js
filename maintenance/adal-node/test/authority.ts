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
/* Directive tells jshint that suite and test are globals defined by mocha */
/* global suite */
/* global test */
/* global setup */
/* global teardown */

import * as assert from "assert";

const util = require('./util/util');
const cp = util.commonParameters;
const testRequire = util.testRequire;

var adal = testRequire('adal');
var AuthenticationContext = adal.AuthenticationContext;
var Authority = testRequire('authority').Authority;

/**
 * Tests the Authority class and instance discovery.
 */
suite('Authority', function() {

  setup(function() {
    util.resetLogging();
    util.clearStaticCache();
  });

  teardown(function() {
    util.resetLogging();
    util.clearStaticCache();
  });

  // use this as authority to force dynamic as opposed to static instance discovery.
  var nonHardCodedAuthority = 'https://login.doesntexist.com/' + cp.tenant;
  var nonHardCodedAuthorizeEndpoint = nonHardCodedAuthority + '/oauth2/authorize';


  function setupExpectedInstanceDiscoveryRequestRetries(requestParametersList: any, authority: any) {
    var nocks: any[] = [];

    requestParametersList.forEach(function(request: any) {
      nocks.push(util.setupExpectedInstanceDiscoveryRequest(request.httpCode, request.authority, request.returnDoc, authority));
    });

    return nocks;
  }

  test('success-dynamic-instance-discovery', function(done) {
    var instanceDiscoveryRequest = util.setupExpectedInstanceDiscoveryRequest(
      200,
      cp.authorityHosts.global,
      {
        'tenant_discovery_endpoint' : 'http://test'
      },
      nonHardCodedAuthorizeEndpoint
    );

    var responseOptions = {
      authority : nonHardCodedAuthority
    };
    var response = util.createResponse(responseOptions);
    var wireResponse = response.wireResponse;
    var tokenRequest = util.setupExpectedClientCredTokenRequestResponse(200, wireResponse, nonHardCodedAuthority);

    var context = new AuthenticationContext(nonHardCodedAuthority);
    context.acquireTokenWithClientCredentials(response.resource, cp.clientId, cp.clientSecret, function (err: any, tokenResponse: any) {
      if (!err) {
        assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'The response does not match what was expected.: ' + JSON.stringify(tokenResponse));
        instanceDiscoveryRequest.done();
        tokenRequest.done();
      }
      done(err);
    });
  });

  function performStaticInstanceDiscovery(authorityHost: string, callback: Function) {
    var hardCodedAuthority = 'https://' + authorityHost + '/' + cp.tenant;

    var responseOptions = {
      authority : hardCodedAuthority
    };
    var response = util.createResponse(responseOptions);
    var wireResponse = response.wireResponse;
    var tokenRequest = util.setupExpectedClientCredTokenRequestResponse(200, wireResponse, hardCodedAuthority);

    var context = new AuthenticationContext(hardCodedAuthority);
    context.acquireTokenWithClientCredentials(response.resource, cp.clientId, cp.clientSecret, function (err: any, tokenResponse: any) {
      if (!err) {
        assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'The response does not match what was expected.: ' + JSON.stringify(tokenResponse));
        tokenRequest.done();
      }
      callback(err);
    });
  }

  test('success-static-instance-discovery', function(done) {
    performStaticInstanceDiscovery('login.windows.net', function(err: any) {
      if(err) {
        done(err);
        return;
      }
      performStaticInstanceDiscovery('login.microsoftonline.com', function(err2: any) {
        if(err2) {
          done(err2);
          return;
        }
        performStaticInstanceDiscovery('login.chinacloudapi.cn', function(err3: any) {
          if(err3) {
            done(err3);
            return;
          }
          performStaticInstanceDiscovery('login-us.microsoftonline.com', function(err4: any) {
            if(err4) {
              done(err4);
              return;
            }
            performStaticInstanceDiscovery('login.microsoftonline.us', function(err5: any) {  
              done(err5);
            })
          });
        });
      });
    });
  });

  test('http-error', function(done) {
    var expectedInstanceDiscoveryRequests = [
      {
        httpCode : 500,
        authority : cp.authorityHosts.global
        //returnDoc : null
      }
    ];

    var instanceDiscoveryRequests = setupExpectedInstanceDiscoveryRequestRetries(expectedInstanceDiscoveryRequests, nonHardCodedAuthorizeEndpoint);

    var context = new AuthenticationContext(nonHardCodedAuthority);
    context.acquireTokenWithClientCredentials(cp.resource, cp.clientId, cp.clientSecret, function (err: any) {
      assert(err, 'No error was returned when one was expected.');
      assert(err.message.indexOf('500') !== -1, 'The http error was not returned');
      instanceDiscoveryRequests.forEach(function(request){
        request.done();
      });

      done();
    });
  });

  test('validation-error', function(done) {
    var expectedInstanceDiscoveryRequests = [
      {
        httpCode : 400,
        authority : cp.authorityHosts.global,
        returnDoc : { error : 'invalid_instance', 'error_description' : 'the instance was invalid' }
      }
    ];

    var instanceDiscoveryRequests = setupExpectedInstanceDiscoveryRequestRetries(expectedInstanceDiscoveryRequests, nonHardCodedAuthorizeEndpoint);

    var context = new AuthenticationContext(nonHardCodedAuthority);
    context.acquireTokenWithClientCredentials(cp.resource, cp.clientId, cp.clientSecret, function (err: any) {
      assert(err, 'No error was returned when one was expected.');
      assert(err.message.indexOf('invalid_instance') !== -1, 'The server error was not returned');
      assert(err.message.indexOf('instance was invalid') !== -1, 'The server error message was not returned');
      instanceDiscoveryRequests.forEach(function(request){
        request.done();
      });

      done();
    });
  });

  test('validation-off', function(done) {
    var response = util.createResponse();
    var wireResponse = response.wireResponse;
    var tokenRequest = util.setupExpectedClientCredTokenRequestResponse(200, wireResponse, response.authority);

    var context = new AuthenticationContext(cp.authorityTenant, false);
    context.acquireTokenWithClientCredentials(response.resource, cp.clientId, cp.clientSecret, function (err: any, tokenResponse: any) {
      if (!err) {
        assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'The response does not match what was expected.');
        tokenRequest.done();
      }
      done(err);
    });
  });

  test('bad-url-not-https', function(done) {
    var errorThrown;
    try {
      new AuthenticationContext('http://this.is.not.https.com/mytenant.com');
    } catch(err) {
      errorThrown = err;
    }

    assert(errorThrown, 'AuthenticationContext succeeded when it should have failed.');
    assert(errorThrown.message.indexOf('https') >= 0, 'Error message does not mention the need for https: ' + errorThrown.message);
    done();
  });

  test('bad-url-has-query', function(done) {
    var errorThrown: any;
    try {
      new AuthenticationContext(cp.authorityTenant + '?this=should&not=be&here=foo');
    } catch(err) {
      errorThrown = err;
    }

    assert(errorThrown, 'AuthenticationContext succeeded when it should have failed.');
    assert(errorThrown.message.indexOf('query') >= 0, 'Error message does not mention the offending query string: ' + errorThrown.message);
    done();
  });

  test('url-extra-path-elements', function(done) {
    var instanceDiscoveryRequest = util.setupExpectedInstanceDiscoveryRequest(
      200,
      cp.authorityHosts.global,
      {
        'tenant_discovery_endpoint' : 'http://test'
      },
      nonHardCodedAuthorizeEndpoint
    );

    // add extra path and query string to end of the authority.  These should be stripped
    // out before the url is sent to instance discovery.
    var authorityUrl = nonHardCodedAuthority + '/extra/path';
    var authority = new Authority(authorityUrl, true);
    var obj = util.createEmptyADALObject();
    authority.validate(obj._callContext, function(err: any) {
      if (err) {
        assert(!err, 'Received unexpected error: ' + err.stack);
      }

      assert(authority.tokenEndpoint === (nonHardCodedAuthority + cp.tokenPath), "oauth2 token endpoint should be after tenant in the url");
      assert(authority.deviceCodeEndpoint === (nonHardCodedAuthority + cp.deviceCodePath), "oauth2 device endpoint should be after tenant in the url");
      instanceDiscoveryRequest.done();
      done();
    });
  });
});
