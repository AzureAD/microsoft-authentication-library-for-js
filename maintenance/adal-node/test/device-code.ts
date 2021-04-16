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
import * as url from "url";

import * as adal from "../lib/adal";
const util = require('./util/util');
const cp: any = util.commonParameters;
const AuthenticationContext = adal.AuthenticationContext;
const MemoryCache = adal.MemoryCache;

suite('device-code', function () {
  setup(function () {
    util.resetLogging();
    util.clearStaticCache();
  });

  function setupExpectedTokenRequestResponse(httpCode: number, returnDoc: object, authorityEndpoint?: string) {
    var authEndpoint = util.getNockAuthorityHost(authorityEndpoint);

    var queryParameters: any = {};
    queryParameters['grant_type'] = 'device_code';
    queryParameters['client_id'] = cp.clientId;
    queryParameters['resource'] = cp.resource;
    queryParameters['code'] = cp.deviceCode;

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

  test('happy-path-successOnFirstRequest', function (done) {
    var response = util.createResponse();
    var tokenRequest = setupExpectedTokenRequestResponse(200, response.wireResponse);

    var userCodeInfo: any = { deviceCode: cp.deviceCode, interval: 1, expiresIn: 1 };
    var context = new AuthenticationContext(cp.authUrl);
    context.acquireTokenWithDeviceCode(cp.resource, cp.clientId, userCodeInfo as any, function (err) {
      assert(!err, 'Receive unexpected error');
      tokenRequest.done();
      done(err);
    });
  });

  function setupExpectedTokenRequestResponseWithAuthPending(returnDoc: object) {
    var authEndpoint = util.getNockAuthorityHost();

    var queryParameter: any = {};
    queryParameter['grant_type'] = 'device_code';
    queryParameter['client_id'] = cp.clientId;
    queryParameter['resource'] = cp.resource;
    queryParameter['code'] = cp.deviceCode;
    var query = querystring.stringify(queryParameter);

    var authPendingResponse = { error: 'authorization_pending' };

    var tokenRequest = nock(authEndpoint)
      .filteringRequestBody(function (body) {
        return util.filterQueryString(query, body);
      })
      .post(cp.tokenUrlPath, query)
      .reply(400, authPendingResponse)
      .post(cp.tokenUrlPath, query)
      .reply(200, returnDoc);

    util.matchStandardRequestHeaders(tokenRequest);

    return tokenRequest;
  }

  test('happy-path-pendingOnFirstRequest', function (done) {
    var response = util.createResponse();
    var tokenRequest = setupExpectedTokenRequestResponseWithAuthPending(response.wireResponse);

    var userCodeInfo: any = { deviceCode: cp.deviceCode, interval: 1, expiresIn: 200 };
    var context = new AuthenticationContext(cp.authUrl);
    context.acquireTokenWithDeviceCode(cp.resource, cp.clientId, userCodeInfo, function (err, tokenResponse) {
      if (!err) {
        assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'The response did not match what was expected');
        tokenRequest.done();
      }
      done(err);
    });
  });

  test('happy-path-cancelRequest', function (done) {
    nock.cleanAll();
    var response = util.createResponse();
    setupExpectedTokenRequestResponseWithAuthPending(response.wireResponse);

    var userCodeInfo: any = { deviceCode: cp.deviceCode, interval: 1, expiresIn: 200 };
    var context = new AuthenticationContext(cp.authUrl);

    context.acquireTokenWithDeviceCode(cp.resource, cp.clientId, userCodeInfo, function (err) {
      assert(err, 'Did not receive expected error');
      assert(err.message === 'Polling_Request_Cancelled');
      done();
    });

    context.cancelRequestToGetTokenWithDeviceCode(userCodeInfo, function (err) {
      assert(!err, 'Receive unexpected error.')
    });
  });

  test('bad-argument', function (done) {
    nock.cleanAll();
    var context = new AuthenticationContext(cp.authUrl);

    let userCodeInfo: any = { interval: 5, expiresIn: 1000 };
    context.acquireTokenWithDeviceCode(cp.resource, cp.clientId, userCodeInfo, function (err) {
      assert(err, 'Did not receive expected argument error');
      assert(err.message === 'The userCodeInfo is missing device_code');
    });

    userCodeInfo = { deviceCode: 'test_device_code', expiresIn: 1000 };
    context.acquireTokenWithDeviceCode(cp.resource, cp.clientId, userCodeInfo, function (err) {
      assert(err, 'Did not receive expected argument error');
      assert(err.message === 'The userCodeInfo is missing interval');
    });

    userCodeInfo = { deviceCode: 'test_device_code', interval: 5 };
    context.acquireTokenWithDeviceCode(cp.resource, cp.clientId, userCodeInfo, function (err) {
      assert(err, 'Did not receive expected argument error');
      assert(err.message === 'The userCodeInfo is missing expires_in');
    });

    // test if usercodeInfo is null
    context.acquireTokenWithDeviceCode(cp.resource, cp.clientId, null as any, function (err) {
      assert(err, 'Did not receive expected argument error');
      assert(err.message === 'The userCodeInfo parameter is required');
    });

    userCodeInfo = { deviceCode: 'test_device_code', interval: 5, expiresIn: 1000 };
    try {
      context.acquireTokenWithDeviceCode(cp.resource, cp.clientId, userCodeInfo, null as any);
    } catch (e) {
      assert(e, 'Did not receive expected error. ');
      assert(e.message === 'acquireToken requires a function callback parameter.', 'Unexpected error message returned.');
    }

    userCodeInfo = { deviceCode: 'test_device_code', interval: 0, expiresIn: 1000 };
    context.acquireTokenWithDeviceCode(cp.resource, cp.clientId, userCodeInfo, function (err) {
      assert(err, 'Did not receive expected error.');
      assert(err.message === 'invalid refresh interval');
    });

    done();
  });

  test('bad-argument-cancel-request', function (done) {
    let context = new AuthenticationContext(cp.authUrl);

    let userCodeInfo: any = { interval: 5, expiresIn: 1000 };
    context.cancelRequestToGetTokenWithDeviceCode(userCodeInfo, function (err) {
      assert(err, 'Did not receive expected argument error');
      assert(err.message === 'The userCodeInfo is missing device_code');
    });

    // test if usercodeInfo is null
    context.cancelRequestToGetTokenWithDeviceCode(null as any, function (err) {
      assert(err, 'Did not receive expected argument error');
      assert(err.message === 'The userCodeInfo parameter is required');
    });

    userCodeInfo = { deviceCode: 'test_device_code', interval: 5, expiresIn: 1000 };
    try {
      context.cancelRequestToGetTokenWithDeviceCode(userCodeInfo, null as any);
    } catch (e) {
      assert(e, 'Did not receive expected error. ');
      assert(e.message === 'acquireToken requires a function callback parameter.', 'Unexpected error message returned.');
    }

    userCodeInfo = { deviceCode: cp.deviceCode, interval: 1, expiresIn: 200 };
    context.cancelRequestToGetTokenWithDeviceCode(userCodeInfo, function (err) {
      assert(err, 'Did not receive expected error. ');
      assert(err.message === 'No acquireTokenWithDeviceCodeRequest existed to be cancelled', 'Unexpected error message returned.');
    })

    done();
  });

  test('cross-tenant-refresh-token', function (done) {
    var memCache = new MemoryCache();
    var response = util.createResponse({ mrrt: true });
    setupExpectedTokenRequestResponse(200, response.wireResponse);

    var userCodeInfo: any = { deviceCode: cp.deviceCode, interval: 1, expiresIn: 1 };
    var context = new AuthenticationContext(cp.authUrl, false, memCache);
    context.acquireTokenWithDeviceCode(cp.resource, cp.clientId, userCodeInfo, function (err, tokenResponse) {
      assert(!err, 'Receive unexpected error');

      var someOtherAuthority = url.parse(cp.evoEndpoint + '/' + 'anotherTenant');
      var responseOptions = { refreshedRefresh: true, mrrt: true };
      var response = util.createResponse(responseOptions);
      var wireResponse = response.wireResponse;
      wireResponse.id_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jY2ViYTE0Yy02YTAwLTQ5YWMtYjgwNi04NGRlNTJiZjFkNDIvIiwiaWF0IjpudWxsLCJleHAiOm51bGwsImF1ZCI6ImU5NThjMDlhLWFjMzctNDkwMC1iNGQ3LWZiM2VlYWY3MzM4ZCIsInN1YiI6IjRnVHY0RXRvWVctRFRvdzBiRG5KZDFBQTRzZkNoQmJqZXJtcXQ2UV9aYTQiLCJ0aWQiOiJkM2I3ODEzZC0zYTAzLTQyZmEtODk2My1iOTBhNzQ1NTIyYTUiLCJvaWQiOiJhNDQzMjA0YS1hYmM5LTRjYjgtYWRjMS1jMGRmYzEyMzAwYWEiLCJ1cG4iOiJycmFuZGFsbEBycmFuZGFsbGFhZDEub25taWNyb3NvZnQuY29tIiwidW5pcXVlX25hbWUiOiJycmFuZGFsbEBycmFuZGFsbGFhZDEub25taWNyb3NvZnQuY29tIiwiZmFtaWx5X25hbWUiOiJSYW5kYWxsIiwiZ2l2ZW5fbmFtZSI6IlJpY2gifQ.r-XHRqqtxI_7IEmwciFTBJpzwetz4wrM2Is_Z8-O7lw";
      //need to change tokenUrlPath for the different tenant token request, and make sure get it changed back to not affect other tests
      var tokenUrlPath = cp.tokenUrlPath;
      cp.tokenUrlPath = someOtherAuthority.pathname + cp.tokenPath + cp.extraQP;

      util.setupExpectedRefreshTokenRequestResponse(200, wireResponse, someOtherAuthority, response.resource);
      cp.tokenUrlPath = tokenUrlPath;
      var conextForAnotherAuthority = new AuthenticationContext(someOtherAuthority as any, false, memCache);

      conextForAnotherAuthority.acquireToken(response.resource, (tokenResponse as adal.TokenResponse).userId as string, response.clientId, function (error) {
        assert(!error, 'Receive unexpected error');

        assert((memCache as any)._entries.length === 2, 'There should two cache entries in the cache');
        memCache.find({ userId: (tokenResponse as adal.TokenResponse).userId, _clientId: response.clientId, _authority: cp.evoEndpoint + '/' + cp.tenant }, function (err, entry) {
          assert(!err, 'Unexpected error received');
          assert(entry.length === 1, 'no result returned for given tenant.');
          assert(entry[0].tenantId === 'cceba14c-6a00-49ac-b806-84de52bf1d42');
        });

        memCache.find({ userId: (tokenResponse as adal.TokenResponse).userId, _clientId: response.clientId, _authority: url.format(someOtherAuthority) }, function (err, entry) {
          assert(!err, 'unexpected error received');
          assert(entry.length === 1, 'no result returned for given tenant.');
          assert(entry[0].tenantId === 'd3b7813d-3a03-42fa-8963-b90a745522a5');
        });
        done(err);
      });
    });
  });
});