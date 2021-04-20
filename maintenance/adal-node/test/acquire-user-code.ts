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
const cp = util.commonParameters;

const AuthenticationContext = adal.AuthenticationContext;

suite('acquire-user-code', function () {
  function setupExpectedDeviceCodeRequestResponse(withLanguage: boolean, httpCode: number, returnDoc: object, authorityEndpoint?: string) {
    var authEndpoint = util.getNockAuthorityHost(authorityEndpoint);

    var queryParameters: any = {};
    queryParameters['client_id'] = cp.clientId;
    queryParameters['resource'] = cp.resource;
    if (withLanguage) {
      queryParameters['mkt'] = cp.language;
    }

    var query = querystring.stringify(queryParameters);

    var deviceCodeRequest = nock(authEndpoint)
      .filteringRequestBody(function (body: any) {
        return util.filterQueryString(query, body);
      })
      .post(cp.deviceCodeUrlPath, query)
      .reply(httpCode, returnDoc);

    util.matchStandardRequestHeaders(deviceCodeRequest);

    return deviceCodeRequest;
  }

  test('happy-path', function (done) {
    var response = util.createDeviceCodeResponse();
    var deviceCodeRequest = setupExpectedDeviceCodeRequestResponse(true, 200, response.wireResponse);

    var context = new AuthenticationContext(cp.authUrl);
    context.acquireUserCode(cp.resource, cp.clientId, cp.language, function (err, deviceCodeResponse) {
      assert(!err, 'Receive unexpected error. ');
      assert(util.isMathDeviceCodeResponse(response.decodedResponse, deviceCodeResponse), 'The response did not match what was expected');
      deviceCodeRequest.done();
      done();
    });
  });

  test('happy-path-without-language', function (done) {
    var response = util.createDeviceCodeResponse();
    var deviceCodeRequest = setupExpectedDeviceCodeRequestResponse(false, 200, response.wireResponse);

    var context = new AuthenticationContext(cp.authUrl);
    context.acquireUserCode(cp.resource, cp.clientId, null as any, function (err, deviceCodeResponse) {
      assert(!err, 'Receive unexpected error. ');
      assert(util.isMathDeviceCodeResponse(response.decodedResponse, deviceCodeResponse), 'The response did not match what was expected');
      deviceCodeRequest.done();
      done();
    });
  });

  test('failed-http-request', function (done) {
    this.timeout(6000);
    this.slow(4000);

    nock.enableNetConnect();
    var context = new AuthenticationContext('https://0.0.0.0:11/my.test.tenant.com');
    context.acquireUserCode(cp.resource, cp.clientId, cp.language, function (err) {
      assert(err, 'Did not recieve expected error on failed http request.');
      nock.disableNetConnect();
      done();
    });
  });

  test('bad-argument', function (done) {
    var context = new AuthenticationContext(cp.authUrl);

    context.acquireUserCode(null as any, cp.clientId, cp.language, function (err) {
      assert(err, 'Did not receive expected argument error');
      assert(err.message === 'The resource parameter is required.')
    });

    context.acquireUserCode(cp.resource, null as any, cp.language, function (err) {
      assert(err, 'Did not receive expected argument error');
      assert(err.message === 'The clientId parameter is required.')
    });

    try {
      context.acquireUserCode(cp.resource, cp.clientId, cp.language, null as any);
    } catch (e) {
      assert(e, 'Did not receive expected error. ');
      assert(e.message === 'acquireToken requires a function callback parameter.', 'Unexpected error message returned.');
    }

    done();
  });

});