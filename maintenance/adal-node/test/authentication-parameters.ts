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
import * as url from "url";

import * as adal from "../lib/adal";
const util = require('./util/util');
const cp: any = util.commonParameters;

suite('authentication-parameters', function () {
  function runTestCases(testData: any[], testFunc: Function) {
    for (var i = 0; i < testData.length; i++) {
      var parameters;
      var error = null;
      var testCase = testData[i];
      var testInput = testCase[0];
      var testParameters = testCase[1];

      try {
        parameters = testFunc(testInput);
      } catch (err) {
        error = err;
      }

      var assertPrefixMsg = 'Test case: ' + i + ' - ';
      if (testParameters) {
        var stack = !error || error.stack;
        assert(!error, assertPrefixMsg + 'Parse failed but should have succeeded. ' + stack);
        assert(parameters.authorizationUri === testParameters.authorizationUri, assertPrefixMsg + 'Parsed authorizationUri did not match expected value.: ' + parameters.authorizationUri);
        assert(parameters.resource === testParameters.resource, assertPrefixMsg + 'Parsed resource  did not match expected value.: ' + parameters.resource);
      } else {
        assert(error, assertPrefixMsg + 'Parse succeeded but should have failed.');
      }
    }
  }

  test('create-from-header', function (done) {
    var testData = [
      [
        'Bearer authorization_uri="test,lkfj,;l,", fruitcake="f",resource="clark, &^()- q32,shark" , f="test"',
        {
          'authorizationUri': 'test,lkfj,;l,',
          'resource': 'clark, &^()- q32,shark',
        }
      ],
      [
        'Bearer  resource="clark, &^()- q32,shark", authorization_uri="test,lkfj,;l,"',
        {
          'authorizationUri': 'test,lkfj,;l,',
          'resource': 'clark, &^()- q32,shark',
        }
      ],
      [
        'Bearer authorization_uri="' + cp.authorityTenant + '", resource="' + cp.resource + '"',
        {
          'authorizationUri': cp.authorityTenant,
          'resource': cp.resource,
        }
      ],
      [
        'Bearer authorization_uri="' + cp.authorizeUrl + '", resource="' + cp.resource + '"',
        {
          'authorizationUri': cp.authorizeUrl,
          'resource': cp.resource,
        }
      ],
      // Add second = sign on first pair.
      [
        'Bearer authorization_uri=="test,lkfj,;l,", resource="clark, &^()- q32,shark",fruitcake="f" , f="test"',
        null
      ],
      // Add second = sign on second pair.
      [
        'Bearer authorization_uri="test,lkfj,;l,", resource=="clark, &^()- q32,shark",fruitcake="f" , f="test"',
        null
      ],
      // Add second quote on first pair.
      [
        'Bearer authorization_uri=""test,lkfj,;l,", resource="clark, &^()- q32,shark",fruitcake="f" , f="test"',
        null
      ],
      // Add second quote on second pair.
      [
        'Bearer authorization_uri=test,lkfj,;l,", resource="clark, &^()- q32,shark"",fruitcake="f" , f="test"',
        null
      ],
      // Add trailing quote.
      [
        'Bearer authorization_uri=test,lkfj,;l,", resource="clark, &^()- q32,shark",fruitcake="f" , f="test""',
        null
      ],
      // Add trailing comma at end of string.
      [
        'Bearer authorization_uri=test,lkfj,;l,", resource="clark, &^()- q32,shark",fruitcake="f" , f="test",',
        null
      ],
      // Add second comma between 2 and 3 pairs.
      [
        'Bearer authorization_uri=test,lkfj,;l,", resource="clark, &^()- q32,shark",fruitcake="f" ,, f="test"',
        null
      ],
      // Add second comma between 1 and 2 pairs.
      [
        'Bearer authorization_uri=test,lkfj,;l,", , resource="clark, &^()- q32,shark",fruitcake="f" , f="test"',
        null
      ],
      // Add random letter between Bearer and first pair.
      [
        'Bearer  f authorization_uri=test,lkfj,;l,", resource="clark, &^()- q32,shark",fruitcake="f" , f="test"',
        null
      ],
      // Add random letter between 2 and 3 pair.
      [
        'Bearer  authorization_uri=test,lkfj,;l,", a resource="clark, &^()- q32,shark",fruitcake="f" , f="test"',
        null
      ],
      // Add random letter between 3 and 2 pair.
      [
        'Bearer  authorization_uri=test,lkfj,;l,", resource="clark, &^()- q32,shark",fruitcake="f" a, f="test"',
        null
      ],
      // Mispell Bearer
      [
        'Berer authorization_uri=test,lkfj,;l,", resource="clark, &^()- q32,shark",fruitcake="f" , f="test"',
        null
      ],
      // Missing resource.
      [
        'Bearer authorization_uri="test,lkfj,;l,"',
        {
          'authorizationUri': 'test,lkfj,;l,'
        }
      ],
      // Missing authoritzation uri.
      [
        'Bearer resource="clark, &^()- q32,shark",fruitcake="f" , f="test"',
        null
      ],
      // Boris's test.
      [
        'Bearer test="bar" ANYTHING HERE, ANYTHING PRESENT HERE, test1="bar1"',
        null
      ],
      [
        'Bearerauthorization_uri="authuri", resource="resourceHere"',
        null
      ],
    ];

    runTestCases(testData, adal.createAuthenticationParametersFromHeader);
    done();
  });

  test('create-from-response', function (done) {
    var testData = [
      [
        {
          status: 401,
          headers: { 'www-authenticate': 'Bearer authorization_uri="test,lkfj,;l,", fruitcake="f",resource="clark, &^()- q32,shark" , f="test"' }
        },
        {
          'authorizationUri': 'test,lkfj,;l,',
          'resource': 'clark, &^()- q32,shark',
        }
      ],
      [
        {
          status: 200,
          headers: { 'www-authenticate': 'Bearer authorization_uri="test,lkfj,;l,", fruitcake="f",resource="clark, &^()- q32,shark" , f="test"' }
        },
        null
      ],
      [
        {
          status: 401
        },
        null
      ],
      [
        {
          status: 401,
          headers: { 'test': 'this is not the www-authenticate header' }
        },
        null
      ],
      [
        {
          status: 401,
          headers: { 'www-authenticate': 'Berer authorization_uri=test,lkfj,;l,", resource="clark, &^()- q32,shark",fruitcake="f" , f="test"' }
        },
        null
      ],
      [
        {
          status: 401,
          headers: { 'www-authenticate': null }
        },
        null
      ],
      [
        {
          headers: { 'www-authenticate': null }
        },
        null
      ],
      [
        null,
        null
      ]
    ];

    runTestCases(testData, adal.createAuthenticationParametersFromResponse);
    done();
  });

  var testHost = 'https://this.is.my.domain.com';
  var testPath = '/path/to/resource';
  var testQuery = 'a=query&string=really';
  var testUrl = testHost + testPath + '?' + testQuery;

  test('create-from-url-happy-path-string-url', function (done) {
    var getResource = nock(testHost)
      .filteringPath(function (path) {
        return util.removeQueryStringIfMatching(path, testQuery);
      })
      .get(testPath)
      .reply(401, 'test',
      { 'www-authenticate': 'Bearer authorization_uri="test,lkfj,;l,", fruitcake="f",resource="clark, &^()- q32,shark" , f="test"' }
      );

    util.matchStandardRequestHeaders(getResource);

    adal.createAuthenticationParametersFromUrl(testUrl, function (err, parameters) {
      if (!err) {
        var testParameters = {
          'authorizationUri': 'test,lkfj,;l,',
          'resource': 'clark, &^()- q32,shark',
        };
        assert(parameters.authorizationUri === testParameters.authorizationUri, 'Parsed authorizationUri did not match expected value.: ' + parameters.authorizationUri);
        assert(parameters.resource === testParameters.resource, 'Parsed resource  did not match expected value.: ' + parameters.resource);
        getResource.done();
      }
      done(err);
    });
  });

  test('create-from-url-happy-path-url-object', function (done) {
    var getResource = nock(testHost)
      .filteringPath(function (path) {
        return util.removeQueryStringIfMatching(path, testQuery);
      })
      .get(testPath)
      .reply(401, 'test',
      { 'www-authenticate': 'Bearer authorization_uri="test,lkfj,;l,", fruitcake="f",resource="clark, &^()- q32,shark" , f="test"' }
      );

    util.matchStandardRequestHeaders(getResource);

    var urlObj = url.parse(testUrl);
    adal.createAuthenticationParametersFromUrl(urlObj as any, function (err, parameters) {
      getResource.done();
      if (!err) {
        var testParameters = {
          'authorizationUri': 'test,lkfj,;l,',
          'resource': 'clark, &^()- q32,shark',
        };
        assert(parameters.authorizationUri === testParameters.authorizationUri, 'Parsed authorizationUri did not match expected value.: ' + parameters.authorizationUri);
        assert(parameters.resource === testParameters.resource, 'Parsed resource  did not match expected value.: ' + parameters.resource);
      }
      done(err);
    });
  });

  test('create-from-url-bad-object', function (done) {
    adal.createAuthenticationParametersFromUrl({} as any, function (err) {
      assert(err, 'Did not receive expected error');
      done();
    });
  });

  test('create-from-url-not-passed', function (done) {
    adal.createAuthenticationParametersFromUrl(null as any, function (err) {
      assert(err, 'Did not receive expected error');
      done();
    });
  });

  test('create-from-url-no-header', function (done) {
    var getResource = nock(testHost)
      .filteringPath(function (path) {
        return util.removeQueryStringIfMatching(path, testQuery);
      })
      .get(testPath)
      .reply(401, 'test');

    util.matchStandardRequestHeaders(getResource);

    adal.createAuthenticationParametersFromUrl(testUrl, function (err) {
      getResource.done();
      assert(err, 'Did not receive expected error');
      assert(err.message.indexOf('header') >= 0, 'Error did not include message about missing header');
      done();
    });
  });

  // This tests enables actual network connections but then attempts a connection to
  // a completely invalid address.  This causes a the node request to fail with
  // an error rather than returning an HTTP error of some sort.
  test('create-from-url-network-error', function (done) {
    this.timeout(5000);
    nock.enableNetConnect();
    adal.createAuthenticationParametersFromUrl('https://0.0.0.0/test', function (err) {
      assert(err, 'Did not receive expected error');
      nock.disableNetConnect();
      done();
    });
  });

});
