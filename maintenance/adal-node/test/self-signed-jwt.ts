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

const util = require('./util/util');
const cp = util.commonParameters;
const testRequire = util.testRequire;

const SelfSignedJwt = testRequire('self-signed-jwt');

import * as assert from "assert";
import * as sinon from "sinon";

const testNowDate = new Date(1418433646179);
const testJwtId = '09841beb-a2c2-4777-a347-34ef055238a8';
const expectedJwt = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IndWM3FobGF0MzJlLWdESFlYcjNjV3RiRU51RSJ9.eyJhdWQiOiJodHRwczovL2xvZ2luLndpbmRvd3MubmV0L25hdHVyYWxjYXVzZXMuY29tL29hdXRoMi90b2tlbiIsImlzcyI6ImQ2ODM1NzEzLWI3NDUtNDhkMS1iYjYyLTdhODI0ODQ3N2QzNSIsInN1YiI6ImQ2ODM1NzEzLWI3NDUtNDhkMS1iYjYyLTdhODI0ODQ3N2QzNSIsIm5iZiI6MTQxODQzMzY0NiwiZXhwIjoxNDE4NDM0MjQ2LCJqdGkiOiIwOTg0MWJlYi1hMmMyLTQ3NzctYTM0Ny0zNGVmMDU1MjM4YTgifQ.AS3jyf9nUqBPeEFKccYA2NfSOSjDoWGW_QTj7Jqjbwpmp8jnQRkJ1Q9QrWLBIspesUVtctiKZQAl_BMochF_4yopY_JbYkPKEVvpbTojtwjKgTpVF175NUjXibUNCijx1BXRxEHJUbVJqzVSWBFtRCbXVBPg_ODqC0JJWutynnwMDec93gGOdWGi8AfRwj855zP41aDZGhQVFiOn3apzN4yfhOGoEeTbG4_6921Tkducz2jWpfVTxIS4yIOKCa97J6XInIlP1iW8XAsnGnTevanj8ubfCtYNRcCOrzq_qZstD6tSDqhQjJlTj5B0zlVvMjTT6oDTAOjzL4TuruENEg';
const testAuthority = {tokenEndpoint:'https://login.windows.net/naturalcauses.com/oauth2/token'};
const testClientId = 'd6835713-b745-48d1-bb62-7a8248477d35';
const testCert = util.getSelfSignedCert();

suite('self-signed-jwt', function() {
  function createJwt(cert: any, thumbprint: any) {
    var ssjwt = new SelfSignedJwt(cp.callContext, testAuthority, testClientId);
    sinon.stub(ssjwt, '_getDateNow').returns(testNowDate);
    sinon.stub(ssjwt, '_getNewJwtId').returns(testJwtId);
    var jwt = ssjwt.create(cert, thumbprint);
    return jwt;
  }

  function createJwtAndMatchExpected(cert: any, thumbprint: any) {
    var jwt = createJwt(cert, thumbprint);
    assert(jwt, 'No JWT generated');
    assert(jwt === expectedJwt, 'Generated JWT does not match expected: ' + jwt);
  }

  test('create-jwt-hash-colons', function(done) {
    createJwtAndMatchExpected(testCert, cp.certHash);
    done();
  });

  test('create-jwt-hash-spaces', function(done) {
    var thumbprint = cp.certHash.replace(/:/g, ' ');
    createJwtAndMatchExpected(testCert, thumbprint);
    done();
  });

  test('create-jwt-hash-straight-hex', function(done) {
    var thumbprint = cp.certHash.replace(/:/g, '');
    createJwtAndMatchExpected(testCert, thumbprint);
    done();
  });

  test('create-jwt-invalid-cert', function(done) {
    var expectedErr;
    try {
      createJwt('test', cp.certHash);
    } catch (err) {
      expectedErr = err;
    }
    assert(expectedErr, 'Did not receive expected error');
    done();
  });

  test('create-jwt-invalid-thumbprint-1', function(done) {
    var expectedErr;
    try {
      createJwt(testCert, 'zzzz');
    } catch (err) {
      expectedErr = err;
    }
    assert(expectedErr, 'Did not receive expected error');
    done();
  });

  test('create-jwt-invalid-thumbprint-wrong-size', function(done) {
    var expectedErr;
    var thumbprint = 'C1:5D:EA:86:56:AD:DF:67:BE:80:31:D8:5E:BD:DC:5A:D6:C4:36:E7:AA';
    try {
      createJwt(testCert, thumbprint);
    } catch (err) {
      expectedErr = err;
    }
    assert(expectedErr, 'Did not receive expected error');
    done();
  });

  test('create-jwt-invalid-thumbprint-invalid-char', function(done) {
    var expectedErr;
    var thumbprint = 'C1:5D:EA:86:56:AD:DF:67:BE:80:31:D8:5E:BD:DC:5A:D6:C4:36:Ez';
    try {
      createJwt(testCert, thumbprint);
    } catch (err) {
      expectedErr = err;
    }
    assert(expectedErr, 'Did not receive expected error');
    done();
  });
});