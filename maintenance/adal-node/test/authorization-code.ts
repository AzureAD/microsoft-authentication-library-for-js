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

import * as assert from "assert";
import * as nock from "nock";
import * as querystring from "querystring";

import * as adal from "../lib/adal";
const util = require('./util/util');
const cp: any = util.commonParameters;
var AuthenticationContext = adal.AuthenticationContext;

/**
 * Tests AuthenticationContext.acquireTokenWithAuthorizationCode
 */
suite('authorization-code', function () {
  var authorizationCode = '1234870909';
  var redirectUri = 'app_bundle:test.bar.baz';

  function setupExpectedAuthCodeTokenRequestResponse(httpCode: number, returnDoc: object, authorityEndpoint?: string) {
    var authEndpoint = util.getNockAuthorityHost(authorityEndpoint);

    var queryParameters: any = {};
    queryParameters['grant_type'] = 'authorization_code';
    queryParameters['code'] = authorizationCode;
    queryParameters['client_id'] = cp.clientId;
    queryParameters['client_secret'] = cp.clientSecret;
    queryParameters['resource'] = cp.resource;
    queryParameters['redirect_uri'] = redirectUri;

    var query = querystring.stringify(queryParameters);

    var tokenRequest = nock(authEndpoint)
      .filteringRequestBody(function (body) {
        return util.filterQueryString(query, body);
      })
      .post(cp.tokenUrlPath, query)
      .reply(httpCode, returnDoc);

    util.matchStandardRequestHeaders(tokenRequest);

    return tokenRequest;
  }

  test('happy-path', function (done) {
    var response = util.createResponse();
    var tokenRequest = setupExpectedAuthCodeTokenRequestResponse(200, response.wireResponse);

    var context = new AuthenticationContext(cp.authUrl);
    context.acquireTokenWithAuthorizationCode(authorizationCode, redirectUri, response.resource, cp.clientId, cp.clientSecret, function (err, tokenResponse) {
      if (!err) {
        assert(util.isMatchTokenResponse(response.decodedResponse, tokenResponse), 'The response did not match what was expected');
        tokenRequest.done();
      }
      done(err);
    });
  });

  test('failed-http-request', function (done) {
    this.timeout(6000);
    this.slow(4000);  // This test takes longer than I would like to fail.  It probably needs a better way of producing this error.

    nock.enableNetConnect();
    var context = new AuthenticationContext('https://0.1.1.1:12/my.tenant.com');
    context.acquireTokenWithAuthorizationCode(authorizationCode, redirectUri, cp.resource, cp.clientId, cp.clientSecret, function (err) {
      assert(err, 'Did not receive expected error on failed http request.');
      nock.disableNetConnect();
      done();
    });
  });

  test('bad-argument', function (done) {
    var context = new AuthenticationContext(cp.authUrl);
    context.acquireTokenWithAuthorizationCode(authorizationCode, redirectUri, null as any, cp.clientId, cp.clientSecret, function (err) {
      assert(err, 'Did not receive expected argument error.');
      done();
    });
  });
});
