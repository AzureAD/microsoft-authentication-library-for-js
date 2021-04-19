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
import * as fs from "fs";

const util = require('./util/util');
const cp = util.commonParameters;
const testRequire = util.testRequire;

const xmldom = require('xmldom');
const DOMParser = xmldom.DOMParser;

const WSTrustRequest = testRequire('wstrust-request');
const WSTrustVersion = testRequire('constants').WSTrustVersion;

/**
 * Tests the WSTrustRequest class that creates and sends a ws-trust RST request.
 */
suite('WSTrustRequest', function () {
  var wstrustEndpoint = 'https://test.wstrust.endpoint/';

  function getMessageIdFromRSTR(body: any) {
    var urnPrefix = 'urn:uuid:';
    var pos = body.indexOf(urnPrefix);
    if (-1 === pos) {
      return;
    }
    var exampleGuid = '00000000-0000-0000-0000-000000000000';
    var messageIdLength = urnPrefix.length + exampleGuid.length;

    var messageId = body.substr(pos, messageIdLength);
    return messageId;
  }

  function getDateFromRST(body: any, elementName: string) {
    var searchString = elementName + '>';
    var pos = body.indexOf(searchString);
    if (-1 === pos) {
      return;
    }
    var exampleDate = '2013-11-21T00:23:48.406Z';
    return body.substr(pos + searchString.length, exampleDate.length);
  }

  function replaceDateInTemplate(body: any, rst: string, elementName: string, replaceKey: string) {
    var date = getDateFromRST(body, elementName);
    if (!date) {
      return;
    }
    return rst.replace(replaceKey, date);
  }

  function compareRSTDocs(rst1: string, rst2: string) {
    var left = rst1.replace(/\s/g, '').replace(/"/g, '\'');
    var right = rst2.replace(/\s/g, '').replace(/"/g, '\'');

    return left === right;
  }

  function setupUpOutgoingRSTCompare(rst: any) {
    var rstRequest = nock(wstrustEndpoint)
      .filteringRequestBody(function (body) {
        var messageId = getMessageIdFromRSTR(body);
        assert(messageId, 'Could not find message id in return RST');
        rst = rst.replace('%MESSAGE_ID%', messageId);

        rst = replaceDateInTemplate(body, rst, 'Created', '%CREATED%');
        assert(rst, 'Could not find Created date');

        rst = replaceDateInTemplate(body, rst, 'Expires', '%EXPIRES%');
        assert(rst, 'Could not find Expires date');
        assert(compareRSTDocs(rst, body), 'RST returned does not match expected RST:\n' + body);
        return 'OK';
      })
      .post('/', 'OK').reply(200, 'OK');

    util.matchStandardRequestHeaders(rstRequest);

    return rstRequest;
  }

  test('happy-path', function (done) {
    var username = 'test_username';
    var password = 'test_password';
    var appliesTo = 'test_appliesTo';
    var templateRST = fs.readFileSync(__dirname + '/wstrust/RST.xml', 'utf8');
    var rst = templateRST.replace('%USERNAME%', username).replace('%PASSWORD%', password).replace('%APPLIES_TO%', appliesTo).replace('%WSTRUST_ENDPOINT%', wstrustEndpoint);

    var rstRequest = setupUpOutgoingRSTCompare(rst);
    var request = new WSTrustRequest(cp.callContext, wstrustEndpoint, appliesTo, WSTrustVersion.WSTRUST13);

    // Take over handling the response to short circuit without having WSTrustRequest attmpt
    // to proceed with response parsing.
    request._handleRSTR = function (body: any, callback: Function) {
      body;
      callback();
    };

    request.acquireToken(username, password, function (err: Error) {
      rstRequest.done();
      done(err);
    });
  });

  test('happy-path-wstrust2005', function (done) {
    var username = 'test_username';
    var password = 'test_password';
    var appliesTo = 'test_appliesTo';
    var templateRST = fs.readFileSync(__dirname + '/wstrust/RST2005.xml', 'utf8');
    var rst = templateRST.replace('%USERNAME%', username).replace('%PASSWORD%', password).replace('%APPLIES_TO%', appliesTo).replace('%WSTRUST_ENDPOINT%', wstrustEndpoint);

    var rstRequest = setupUpOutgoingRSTCompare(rst);
    var request = new WSTrustRequest(cp.callContext, wstrustEndpoint, appliesTo, WSTrustVersion.WSTRUST2005);

    request._handleRSTR = function (body: any, callback: Function) {
      body;
      callback();
    };

    request.acquireToken(username, password, function (err: Error) {
      rstRequest.done();
      done(err);
    });
  });

  test('fail-wstrustversion-undefined', function (done) {
    var username = 'test_username';
    var password = 'test_password';
    var appliesTo = 'test_appliesTo';
    var templateRST = fs.readFileSync(__dirname + '/wstrust/RST2005.xml', 'utf8');
    templateRST.replace('%USERNAME%', username).replace('%PASSWORD%', password).replace('%APPLIES_TO%', appliesTo).replace('%WSTRUST_ENDPOINT%', wstrustEndpoint);

    var request = new WSTrustRequest(cp.callContext, wstrustEndpoint, appliesTo, WSTrustVersion.UNDEFINED);
    request.acquireToken(username, password, function (err: Error) {
      assert(err, 'Did not receive expected error.');
      assert(err.message === 'Unsupported wstrust endpoint version. Current support version is wstrust2005 or wstrust13.');
      done();
    });
  });

  test('fail-to-parse-rstr', function (done) {
    var username = 'test_username';
    var password = 'test_password';
    var appliesTo = 'test_appliesTo';
    var templateRST = fs.readFileSync(__dirname + '/wstrust/RST.xml', 'utf8');
    var rst = templateRST.replace('%USERNAME%', username).replace('%PASSWORD%', password).replace('%APPLIES_TO%', appliesTo).replace('%WSTRUST_ENDPOINT%', wstrustEndpoint);

    var rstRequest = setupUpOutgoingRSTCompare(rst);
    var request = new WSTrustRequest(cp.callContext, wstrustEndpoint, appliesTo, WSTrustVersion.WSTRUST13);

    request.acquireToken(username, password, function (err: any) {
      rstRequest.done();
      assert(err, 'Did not receive expected error.');
      done();
    });
  });

  test('xml-format-test', function (done) {
    var username = 'test_username';
    var password = 'test_password&<>\'"';
    var appliesTo = 'test_appliesTo';

    var rst = new WSTrustRequest(cp.callContext, wstrustEndpoint, appliesTo, WSTrustVersion.WSTRUST13)._buildRST(username, password);

    var options = {
      errorHandler: function () { throw new Error(); }
    };

    try {
      new DOMParser(options).parseFromString(rst);
    }
    catch (e) {
      assert(!e, 'Unexpected error received.');
    }

    done();
  });
});

