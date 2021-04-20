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

const Mex = testRequire('mex');

/**
 * Tests the Mex class which does Mex retrieval and parsing.
 */
suite('MEX', function() {
  this.slow(200);  // Tell mocha not to consider any of these tests
                   // slow until after 200ms.  XML parsing takes time! :(

  function setupExpectedMexResponse(filename: string) {
    var mexDoc = fs.readFileSync(__dirname + '/mex/' + filename, 'utf8');
    var mexRequest = nock(cp.adfsUrlNoPath).get(cp.adfsMexPath).reply(200, mexDoc);

    util.matchStandardRequestHeaders(mexRequest);

    return mexRequest;
  }

  function happyPathTest(testFile: any, expectedUrl :string, done: Function) {
    var mexRequest = setupExpectedMexResponse(testFile);

    var mex = new Mex(cp.callContext, cp.adfsMex);
    mex.discover(function(err: Error) {
      if (!err) {
        assert(mex.usernamePasswordPolicy.url === expectedUrl,
          'returned url did not match: ' + expectedUrl + ': ' + mex.usernamePasswordPolicy.url);
        mexRequest.done();
      }
      done();
    });
  }

  test('happy-path-1', function(done) {
    happyPathTest('microsoft.mex.xml', 'https://corp.sts.microsoft.com/adfs/services/trust/13/usernamemixed', done);
  });

  test('happy-path-2', function(done) {
    happyPathTest('arupela.mex.xml', 'https://fs.arupela.com/adfs/services/trust/13/usernamemixed', done);
  });

  test('happy-path-3', function(done) {
    happyPathTest('archan.us.mex.xml', 'https://arvmserver2012.archan.us/adfs/services/trust/13/usernamemixed', done);
  });

  test('happy-path-wstrust2005', function(done) {
    happyPathTest('usystech.mex.xml', 'https://sts.usystech.net/adfs/services/trust/2005/usernamemixed', done);
  });

  function badMexDocTest(testFile: any, done: Function) {
    var mexRequest = setupExpectedMexResponse(testFile);

    var mex = new Mex(cp.callContext, cp.adfsMex);
    mex.discover(function(err: any) {
      mexRequest.done();
      assert(err, 'badMexDocTest expected parsing error');
      done();
    });
  }

  test('malformed-xml-1', function(done) {
    badMexDocTest('syntax.related.mex.xml', done);
  });

  test('malformed-xml-2', function(done) {
    badMexDocTest('syntax.notrelated.mex.xml', done);
  });

  test('logically-invalid-no-ssl', function(done) {
    badMexDocTest('address.insecure.xml', done);
  });

  test('logically-invalid-no-address', function(done) {
    badMexDocTest('noaddress.xml', done);
  });

  test('logically-invalid-no-binding-port', function(done) {
    badMexDocTest('nobinding.port.xml', done);
  });

  test('logically-invalid-no-binding-port', function(done) {
    badMexDocTest('noname.binding.xml', done);
  });

  test('logically-invalid-no-soap-action', function(done) {
    badMexDocTest('nosoapaction.xml', done);
  });

  test('logically-invalid-no-soap-transport', function(done) {
    badMexDocTest('nosoaptransport.xml', done);
  });

  test('logically-invalid-no-uri-ref', function(done) {
    badMexDocTest('nouri.ref.xml', done);
  });

  test('failed-request', function(done) {
    var mexRequest = util.setupExpectedFailedMexCommon();

    var mex = new Mex(cp.callContext, cp.adfsMex);
    mex.discover(function(err: any) {
      assert(err, 'Did not receive error as expected');
      mexRequest.done();
      done();
    });
  });
});
