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


// Run
//   npm test
// from root of the repo
import * as assert from "assert";

const util = require('./util/util');
const cp = util.commonParameters;

import * as adal from "../lib/adal";
const AuthenticationContext = adal.AuthenticationContext;

suite('refresh-token', function() {
  test('happy-path-no-resource', function(done) {
    var responseOptions = { refreshedRefresh : true };
    var response = util.createResponse(responseOptions);
    var wireResponse = response.wireResponse;
    var tokenRequest = util.setupExpectedRefreshTokenRequestResponse(200, wireResponse, response.authority);

    var context = new AuthenticationContext(cp.authorityTenant);
    context.acquireTokenWithRefreshToken(cp.refreshToken, cp.clientId, null as any, null as any, function(err, tokenResponse) {
      if (!err) {
        tokenRequest.done();
        assert(util.isMatchTokenResponse(response.decodedResponse, tokenResponse), 'The response did not match what was expected: ' + JSON.stringify(tokenResponse));
      }
      done(err);
    });
  });

  test('happy-path-with-resource', function(done) {
    var responseOptions = { refreshedRefresh : true };
    var response = util.createResponse(responseOptions);
    var wireResponse = response.wireResponse;
    var tokenRequest = util.setupExpectedRefreshTokenRequestResponse(200, wireResponse, response.authority, response.resource);

    var context = new AuthenticationContext(cp.authorityTenant);
    context.acquireTokenWithRefreshToken(cp.refreshToken, cp.clientId, null as any, cp.resource, function(err, tokenResponse) {
      if (!err) {
        tokenRequest.done();
        assert(util.isMatchTokenResponse(response.decodedResponse, tokenResponse), 'The response did not match what was expected: ' + JSON.stringify(tokenResponse))  ;
      }
      done(err);
    });
  });

  test('happy-path-no-resource-client-secret', function(done) {
    var responseOptions = { refreshedRefresh : true };
    var response = util.createResponse(responseOptions);
    var wireResponse = response.wireResponse;
    var tokenRequest = util.setupExpectedRefreshTokenRequestResponse(200, wireResponse, response.authority, null, cp.clientSecret);

    var context = new AuthenticationContext(cp.authorityTenant);
    context.acquireTokenWithRefreshToken(cp.refreshToken, cp.clientId, cp.clientSecret, null as any, function(err, tokenResponse) {
      if (!err) {
        tokenRequest.done();
        assert(util.isMatchTokenResponse(response.decodedResponse, tokenResponse), 'The response did not match what was expected: ' + JSON.stringify(tokenResponse));
      }
      done(err);
    });
  });

  test('happy-path-with-resource-client-secret', function(done) {
    var responseOptions = { refreshedRefresh : true };
    var response = util.createResponse(responseOptions);
    var wireResponse = response.wireResponse;
    var tokenRequest = util.setupExpectedRefreshTokenRequestResponse(200, wireResponse, response.authority, response.resource, cp.clientSecret);

    var context = new AuthenticationContext(cp.authorityTenant);
    context.acquireTokenWithRefreshToken(cp.refreshToken, cp.clientId, cp.clientSecret, cp.resource, function(err, tokenResponse) {
      if (!err) {
        tokenRequest.done();
        assert(util.isMatchTokenResponse(response.decodedResponse, tokenResponse), 'The response did not match what was expected: ' + JSON.stringify(tokenResponse))  ;
      }
      done(err);
    });
  });

  test('happy-path-no-resource-legacy', function(done) {
    var responseOptions = { refreshedRefresh : true };
    var response = util.createResponse(responseOptions);
    var wireResponse = response.wireResponse;
    var tokenRequest = util.setupExpectedRefreshTokenRequestResponse(200, wireResponse, response.authority);

    var context = new AuthenticationContext(cp.authorityTenant);
    context.acquireTokenWithRefreshToken(cp.refreshToken, cp.clientId, null as any, function(err, tokenResponse) {
      if (!err) {
        tokenRequest.done();
        assert(util.isMatchTokenResponse(response.decodedResponse, tokenResponse), 'The response did not match what was expected: ' + JSON.stringify(tokenResponse));
      }
      done(err);
    });
  });

  test('happy-path-with-resource-legacy', function(done) {
    var responseOptions = { refreshedRefresh : true };
    var response = util.createResponse(responseOptions);
    var wireResponse = response.wireResponse;
    var tokenRequest = util.setupExpectedRefreshTokenRequestResponse(200, wireResponse, response.authority, response.resource);

    var context = new AuthenticationContext(cp.authorityTenant);
    context.acquireTokenWithRefreshToken(cp.refreshToken, cp.clientId, cp.resource, function(err, tokenResponse) {
      if (!err) {
        tokenRequest.done();
        assert(util.isMatchTokenResponse(response.decodedResponse, tokenResponse), 'The response did not match what was expected: ' + JSON.stringify(tokenResponse))  ;
      }
      done(err);
    });
  });

});