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

import * as _ from "underscore";
import * as assert from "assert";

const util = require('./util/util');
const cp = util.commonParameters;
const testRequire = util.testRequire;

import * as adal from "../lib/adal";
const AuthenticationContext = adal.AuthenticationContext;
const SelfSignedJwt = testRequire('self-signed-jwt');

/**
 * Tests AuthenticationContext.acquireTokenWithClientCredentials
 */
suite('client-credential', function() {

  setup(function() {
    util.resetLogging();
    util.clearStaticCache();
  });

  teardown(function() {
    util.resetLogging();
    util.clearStaticCache();
  });

  test('happy-path', function(done) {
    var responseOptions = { noRefresh : true };
    var response = util.createResponse(responseOptions);
    var tokenRequest = util.setupExpectedClientCredTokenRequestResponse(200, response.wireResponse);

    var context = new AuthenticationContext(cp.authUrl);
    context.acquireTokenWithClientCredentials(response.resource, cp.clientId, cp.clientSecret, function (err, tokenResponse) {
      if (!err) {
        assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'The response did not match what was expected');
        tokenRequest.done();
      }
      done(err);
    });
  });

  // Tests happy-path followed by an additional call to acquireTokenWithClientCredentials that should
  // be served from the cache.
  test('happy-path-cached-token', function(done) {
    var responseOptions = { noRefresh : true };
    var response = util.createResponse(responseOptions);
    var tokenRequest = util.setupExpectedClientCredTokenRequestResponse(200, response.wireResponse);

    var context = new AuthenticationContext(cp.authUrl);
    context.acquireTokenWithClientCredentials(response.resource, cp.clientId, cp.clientSecret, function (err, tokenResponse) {
      if (err) {
        done(err);
        return;
      }

      assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'The response did not match what was expected');
      tokenRequest.done();

      context.acquireTokenWithClientCredentials(response.resource, cp.clientId, cp.clientSecret, function (err, tokenResponse) {
        if (!err) {
          assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'The cached response did not match what was expected');
        }
        done(err);
      });
    });
  });

  // Tests happy path plus a call to the cache only function acquireToken which should find the token from the
  // previous call to acquireTokenWithClientCredentials.
  test('happy-path-cached-token2', function(done) {
    var responseOptions = { noRefresh : true };
    var response = util.createResponse(responseOptions);
    var tokenRequest = util.setupExpectedClientCredTokenRequestResponse(200, response.wireResponse);

    var context = new AuthenticationContext(cp.authUrl);
    context.acquireTokenWithClientCredentials(response.resource, cp.clientId, cp.clientSecret, function (err, tokenResponse) {
      if (err) {
        done(err);
        return;
      }

      assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'The response did not match what was expected');
      tokenRequest.done();

      var nullUser = null;
      var context2 = new AuthenticationContext(cp.authUrl);
      context2.acquireToken(response.resource, nullUser as any, cp.clientId, function (err, tokenResponse) {
        if (!err) {
          assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'The cached response did not match what was expected');
        }
        done(err);
      });
    });
  });

  test('no-callback', function(done) {
    var context = new AuthenticationContext(cp.authorityTenant);
    var argumentError;
    try {
      context.acquireTokenWithClientCredentials(cp.resource, cp.clientId, cp.clientSecret, null as any);
    } catch(err) {
      argumentError = err;
    }

    assert(argumentError, 'Did not receive expected error');
    assert(argumentError.message.indexOf('callback') >= 0, 'Error does not appear to be specific to callback parameter.');

    done();
  });

  test('no-arguments', function(done) {
    var context = new AuthenticationContext(cp.authorityTenant);
    context.acquireTokenWithClientCredentials(null as any, null as any, null as any, function(err) {
      assert(err, 'Did not receive expected error.');
      assert(err.message.indexOf('parameter') >= 0, 'Error was not specific to a parameter.');
      done();
    });
  });

  test('no-client-secret', function(done) {
    var context = new AuthenticationContext(cp.authorityTenant);
    context.acquireTokenWithClientCredentials(cp.resource, cp.clientId, null as any, function(err) {
      assert(err, 'Did not receive expected error.');
      assert(err.message.indexOf('parameter') >= 0, 'Error was not specific to a parameter.');
      done();
    });
  });

  test('no-client-id', function(done) {
    var context = new AuthenticationContext(cp.authorityTenant);
    context.acquireTokenWithClientCredentials(cp.resource, null as any, cp.clientSecret, function(err) {
      assert(err, 'Did not receive expected error.');
      assert(err.message.indexOf('parameter') >= 0, 'Error was not specific to a parameter.');
      done();
    });
  });

  test('no-resource', function(done) {
    var context = new AuthenticationContext(cp.authorityTenant);
    context.acquireTokenWithClientCredentials(null as any, cp.clientId, cp.clientSecret, function(err) {
      assert(err, 'Did not receive expected error.');
      assert(err.message.indexOf('parameter') >= 0, 'Error was not specific to a parameter.');
      done();
    });
  });

  test('http-error', function(done) {
    var tokenRequest = util.setupExpectedClientCredTokenRequestResponse(403);
    var context = new AuthenticationContext(cp.authUrl);
    context.acquireTokenWithClientCredentials(cp.resource, cp.clientId, cp.clientSecret, function (err, tokenResponse) {
      assert(err, 'No error was returned when one was expected.');
      assert(!tokenResponse, 'a token response was returned when non was expected.');
      tokenRequest.done();
      done();
    });
  });

  test('oauth-error', function(done) {
    var errorResponse = {
      error : 'invalid_client',
      error_description : 'This is a test error description',       // jshint ignore:line
      error_uri : 'http://errordescription.com/invalid_client.html' // jshint ignore:line
    };

    var tokenRequest = util.setupExpectedClientCredTokenRequestResponse(400, errorResponse);

    var context = new AuthenticationContext(cp.authUrl);
    context.acquireTokenWithClientCredentials(cp.resource, cp.clientId, cp.clientSecret, function (err, tokenResponse) {
      assert(err, 'No error was returned when one was expected.');
      assert(_.isEqual(errorResponse, tokenResponse), 'The response did not match what was expected');
      tokenRequest.done();
      done();
    });
  });

  test('error-with-useless-return', function(done) {
    var junkResponse = 'This is not properly formated return value.';

    var tokenRequest = util.setupExpectedClientCredTokenRequestResponse(400, junkResponse);

    var context = new AuthenticationContext(cp.authUrl);
    context.acquireTokenWithClientCredentials(cp.resource, cp.clientId, cp.clientSecret, function (err) {
      assert(err, 'No error was returned when one was expected.');
      tokenRequest.done();
      done();
    });
  });

  test('success-with-useless-return', function(done) {
    var junkResponse = 'This is not properly formated return value.';

    var tokenRequest = util.setupExpectedClientCredTokenRequestResponse(200, junkResponse);

    var context = new AuthenticationContext(cp.authUrl);
    context.acquireTokenWithClientCredentials(cp.resource, cp.clientId, cp.clientSecret, function (err) {
      assert(err, 'No error was returned when one was expected.');
      tokenRequest.done();
      done();
    });
  });

  test('no-cached-token-found-error', function(done) {
    var context = new AuthenticationContext(cp.authUrl);
    context.acquireToken(cp.resource, 'unknownUser', cp.clientId, function(err) {
      assert(err, 'Expected an error and non was received.');
      assert(-1 !== err.message.indexOf('not found'), 'Returned error did not contain expected message: ' + err.message);
      done();
    });
  });

  function updateSelfSignedJwtStubs() {
    var savedProto: any = {};
    savedProto._getDateNow = SelfSignedJwt.prototype._getDateNow;
    savedProto._getNewJwtId = SelfSignedJwt.prototype._getNewJwtId;

    SelfSignedJwt.prototype._getDateNow = function() { return cp.nowDate; };
    SelfSignedJwt.prototype._getNewJwtId = function() { return cp.jwtId; };

    return savedProto;
  }

  function resetSelfSignedJwtStubs(saveProto: any) {
    _.extend(SelfSignedJwt.prototype, saveProto);
  }

  test('cert-happy-path', function(done) {
    var saveProto = updateSelfSignedJwtStubs();

    var responseOptions = { noRefresh : true };
    var response = util.createResponse(responseOptions);
    var tokenRequest = util.setupExpectedClientAssertionTokenRequestResponse(200, response.wireResponse, cp.authorityTenant);

    var context = new AuthenticationContext(cp.authorityTenant);
    context.acquireTokenWithClientCertificate(response.resource, cp.clientId, cp.cert, cp.certHash, function (err, tokenResponse) {
      resetSelfSignedJwtStubs(saveProto);
      tokenRequest.done();
      if (!err) {
        assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'The response did not match what was expected');
        tokenRequest.done();
      }
      done(err);
    });
  });

  test('cert-bad-cert', function(done) {
    var cert = 'gobbledy';

    var context = new AuthenticationContext(cp.authorityTenant);
    context.acquireTokenWithClientCertificate(cp.resource, cp.clientId, cert, cp.certHash, function (err) {
      assert(err, 'Did not receive expected error.');
      assert(0 <= err.message.indexOf('Failed to sign JWT'), 'Unexpected error message' + err.message);
      done();
    });
  });

  test('cert-bad-thumbprint', function(done) {
    var thumbprint = 'gobbledy';

    var context = new AuthenticationContext(cp.authorityTenant);
    context.acquireTokenWithClientCertificate(cp.resource, cp.clientId, cp.cert, thumbprint, function (err) {
      assert(err, 'Did not receive expected error.');
      assert(0 <= err.message.indexOf('thumbprint does not match a known format'), 'Unexpected error message' + err.message);
      done();
    });
  });
});

