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

import * as fs from "fs";
import * as assert from "assert";
import * as nock from "nock";
import * as querystring from "querystring";
import * as _ from "underscore";
const sinon = require('sinon');
require('date-utils');

const util = require('./util/util');
const testRequire = util.testRequire;
const cp = util.commonParameters;

import * as adal from "../lib/adal";
const AuthenticationContext = adal.AuthenticationContext;
const MemoryCache = adal.MemoryCache;

const Mex = testRequire('mex');
const OAuth2Client = testRequire('oauth2client');
const TokenRequest = testRequire('token-request');
const UserRealm = testRequire('user-realm');
const WSTrustRequest = testRequire('wstrust-request');
const WSTrustResponse = testRequire('wstrust-response');

/**
 * Tests AuthenticationContext.acquireTokenWithUsernamePassword
 * @return {[type]} [description]
 */
suite('username-password', function() {

  setup(function() {
    util.resetLogging();
    util.clearStaticCache();
  });

  teardown(function() {
    util.resetLogging();
    util.clearStaticCache();
  });

  function setupExpectedOAuthAssertionRequest(response: any) {

    var assertion = fs.readFileSync(cp.AssertionFile, 'utf8');

    var queryParameters: any = {};
    queryParameters['grant_type'] = 'urn:ietf:params:oauth:grant-type:saml1_1-bearer';
    queryParameters['client_id'] = response.clientId;
    queryParameters['resource'] = response.resource;
    queryParameters['assertion'] = assertion;
    queryParameters['scope'] = 'openid';

    return util.setupExpectedOAuthResponse(queryParameters, cp.tokenUrlPath, 200, response.wireResponse, cp.authority);
  }

  function setupExpectedUserNamePasswordRequestResponse(httpCode: number, returnDoc: object, authorityEndpoint?: string, isAdfs?: boolean) {
    var authEndpoint = util.getNockAuthorityHost(authorityEndpoint);
    var queryParameters: any = {};
    queryParameters['grant_type'] = 'password';
    queryParameters['client_id'] = cp.clientId;
    queryParameters['resource'] = cp.resource;
    queryParameters['username'] = cp.username;
    queryParameters['password'] = cp.password;
    queryParameters['scope'] = 'openid';

    var query = querystring.stringify(queryParameters);
    var tokenUrl = cp.tokenUrlPath;
    if(isAdfs) {
      tokenUrl = '/adfs' + cp.tokenPath + cp.extraQP;
    }

    var tokenRequest = nock(authEndpoint)
                            .filteringRequestBody(function(body) {
                              return util.filterQueryString(query, body);
                            })
                           .post(tokenUrl, query)
                           .reply(httpCode, returnDoc);

    util.matchStandardRequestHeaders(tokenRequest);

    return tokenRequest;
  }

  test('happy-path-adfs-authority', function(done) {
    var adfsAuthority = "https://contoso.com/adfs";
    var responseOptions = { authority : adfsAuthority,  mrrt : true };
    var response = util.createResponse(responseOptions);
    var upRequest = setupExpectedUserNamePasswordRequestResponse(200, response.wireResponse, adfsAuthority, true);

    var context = new AuthenticationContext(adfsAuthority, false);
    context.acquireTokenWithUsernamePassword(response.resource, cp.username, cp.password, cp.clientId, function(err, tokenResponse) {
      if (!err) {
        upRequest.done();
        assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'Response did not match expected: ' + JSON.stringify(tokenResponse));
      }
      done(err);
    });
  });

  test('managed-happy-path', function(done) {
    var preRequests = util.setupExpectedUserRealmResponseCommon(false);
    var response = util.createResponse();

    var upRequest = setupExpectedUserNamePasswordRequestResponse(200, response.wireResponse, response.authority);

    var context = new AuthenticationContext(response.authority);
    context.acquireTokenWithUsernamePassword(response.resource, cp.username, cp.password, cp.clientId, function(err, tokenResponse) {
      if (!err) {
        preRequests.done();
        upRequest.done();
        assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'Response did not match expected: ' + JSON.stringify(tokenResponse));
      }
      done(err);
    });
  });

  test('managed-happy-path-twice-cache', function(done) {
    var preRequests = util.setupExpectedUserRealmResponseCommon(false);
    var response = util.createResponse();

    var upRequest = setupExpectedUserNamePasswordRequestResponse(200, response.wireResponse, response.authority);

    var context = new AuthenticationContext(response.authority);
    context.acquireTokenWithUsernamePassword(response.resource, cp.username, cp.password, cp.clientId, function(err, tokenResponse) {
      if (!err) {
        preRequests.done();
        upRequest.done();
        assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'Response did not match expected: ' + JSON.stringify(tokenResponse));

        // Call again to make sure we get a cached entry.
        context.acquireTokenWithUsernamePassword(response.resource, cp.username, cp.password, cp.clientId, function(err, secondTokenResponse) {
          if (!err) {
            assert(util.isMatchTokenResponse(response.cachedResponse, secondTokenResponse), 'Response did not match expected: ' + JSON.stringify(tokenResponse));
            done(err);
          }
        });
      }
    });
  });

  test('managed-happy-path-twice-refresh-mrrt-static-cache', function(done) {
    var preRequests = util.setupExpectedUserRealmResponseCommon(false);
    var responseOptions = { mrrt : true };
    var response = util.createResponse(responseOptions);
    var upRequest = setupExpectedUserNamePasswordRequestResponse(200, response.wireResponse, response.authority);

    var refreshResponseOptions = { refreshedRefresh : true, resource : 'newResource', mrrt : true };
    var refreshResponse = util.createResponse(refreshResponseOptions);
    var refreshRequest = util.setupExpectedRefreshTokenRequestResponse(200, refreshResponse.wireResponse, response.authority, refreshResponse.resource);

    var context = new AuthenticationContext(response.authority);
    context.acquireTokenWithUsernamePassword(response.resource, cp.username, cp.password, cp.clientId, function(err, tokenResponse) {
      if (!err) {
        preRequests.done();
        upRequest.done();
        assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'Response did not match expected: ' + JSON.stringify(tokenResponse));

        // Call again to make sure we get a cached entry.
        context.acquireTokenWithUsernamePassword(refreshResponse.resource, cp.username, cp.password, cp.clientId, function(err, secondTokenResponse) {
          if (!err) {
            refreshRequest.done();
            assert(util.isMatchTokenResponse(refreshResponse.cachedResponse, secondTokenResponse), 'Response did not match expected: ' + JSON.stringify(tokenResponse));
          }
          done(err);
        });
      }
    });
  });

  test('managed-happy-path-with-simple-cache-only-acquire-token', function(done) {
    var preRequests = util.setupExpectedUserRealmResponseCommon(false);
    var responseOptions = { mrrt : true };
    var response = util.createResponse(responseOptions);
    var upRequest = setupExpectedUserNamePasswordRequestResponse(200, response.wireResponse, response.authority);

    var refreshResponseOptions = { refreshedRefresh : true, resource : 'newResource', mrrt : true };
    var refreshResponse = util.createResponse(refreshResponseOptions);
    var refreshRequest = util.setupExpectedRefreshTokenRequestResponse(200, refreshResponse.wireResponse, response.authority, refreshResponse.resource);

    var context = new AuthenticationContext(response.authority);
    context.acquireTokenWithUsernamePassword(response.resource, cp.username, cp.password, cp.clientId, function(err, tokenResponse) {
      if (!err) {
        preRequests.done();
        upRequest.done();
        assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'Response did not match expected: ' + JSON.stringify(tokenResponse));

        // Call again to make sure we get a cached entry.
        context.acquireToken(refreshResponse.resource, cp.username, cp.clientId, function(err, secondTokenResponse) {
          if (!err) {
            refreshRequest.done();
            assert(util.isMatchTokenResponse(refreshResponse.cachedResponse, secondTokenResponse), 'Response did not match expected: ' + JSON.stringify(tokenResponse));
          }
          done(err);
        });
      }
    });
  });

  test('managed-happy-path-twice-refresh-mrrt-user-respected', function(done) {
    var preRequests = util.setupExpectedUserRealmResponseCommon(false);
    var responseOptions = { mrrt : true };
    var response = util.createResponse(responseOptions);
    var upRequest = setupExpectedUserNamePasswordRequestResponse(200, response.wireResponse, response.authority);

    // Set up a memory cache with an entry of a different user than the one that will be acquiredBelow.
    var alternateUserResponse = util.createResponse({ isMRRT : true, urlSafeUserId : true });
    var memCache = new MemoryCache();
    memCache.add([_.clone(alternateUserResponse.cachedResponse)], function(memErr) {
      assert(!memErr, 'Error added test entry to cache.');
      var refreshResponseOptions = { refreshedRefresh : true, resource : 'newResource', mrrt : true };
      var refreshResponse = util.createResponse(refreshResponseOptions);
      var refreshRequest = util.setupExpectedRefreshTokenRequestResponse(200, refreshResponse.wireResponse, response.authority, refreshResponse.resource);

      var context = new AuthenticationContext(response.authority, true, memCache);
      context.acquireTokenWithUsernamePassword(response.resource, cp.username, cp.password, cp.clientId, function(err, tokenResponse) {
        if (!err) {
          preRequests.done();
          upRequest.done();
          assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'Response did not match expected: ' + JSON.stringify(tokenResponse));

          // Call again to make sure we get a cached entry.
          context.acquireTokenWithUsernamePassword(refreshResponse.resource, cp.username, cp.password, cp.clientId, function(err2, secondTokenResponse) {
            if (!err2) {
              refreshRequest.done();
              assert(util.isMatchTokenResponse(refreshResponse.cachedResponse, secondTokenResponse), 'Response did not match expected: ' + JSON.stringify(tokenResponse));
              // Check that the pre-existing cache entry was not changed at all.
              memCache.find(alternateUserResponse.cachedResponse, function(err3, results) {
                if (err3) done(err3);
                var alternateUserEntry = results[0];
                assert(_.isEqual(alternateUserEntry, alternateUserResponse.cachedResponse), 'The pre-existing alternate user cache entry was ' +
                  'inappropriately altered.');
                done();
              });
            } else {
              done(err2);
            }
          });
        }
      });
    });
  });

  test('managed-happy-path-twice-refresh-expired-token', function(done) {
    var preRequests = util.setupExpectedUserRealmResponseCommon(false);
    var responseOptions = { expired : true };
    var response = util.createResponse(responseOptions);
    var upRequest = setupExpectedUserNamePasswordRequestResponse(200, response.wireResponse, response.authority);

    var refreshResponseOptions = { refreshedRefresh : true };
    var refreshResponse = util.createResponse(refreshResponseOptions);
    var refreshRequest = util.setupExpectedRefreshTokenRequestResponse(200, refreshResponse.wireResponse, response.authority, refreshResponse.resource, null);

    var memCache = new MemoryCache();

    var context = new AuthenticationContext(response.authority, true, memCache);
    context.acquireTokenWithUsernamePassword(response.resource, cp.username, cp.password, cp.clientId, function(err, tokenResponse) {
      if (!err) {
        preRequests.done();
        upRequest.done();
        assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'Response did not match expected: ' + JSON.stringify(tokenResponse));

        var numCacheEntries = (memCache as any)._entries.length;
        assert(numCacheEntries === 1, 'Incorrect number of entries in the cache: ' + numCacheEntries);

        // make the single cache entry expired.
        (memCache as any)._entries[0]['expiresOn'] = (Date as any).yesterday();

        // Call again to make sure we get a cached entry and refresh it.
        context.acquireTokenWithUsernamePassword(refreshResponse.resource, cp.username, cp.password, cp.clientId, function(err, secondTokenResponse) {
          if (!err) {
            refreshRequest.done();
            assert(util.isMatchTokenResponse(refreshResponse.cachedResponse, secondTokenResponse), 'Response did not match expected: ' + JSON.stringify(tokenResponse));
          }
          done(err);
        });
      }
    });
  });

  // Since this test is the most code intensive it will make a good test case for
  // correlation id.
  test('federated-happy-path-and-correlation-id', function(done) {
    this.slow(200); // This test invokes the slow XML Mex parsing code.

    var correlationId = '12300002-0000-0000-c000-000000000000';
    util.setCorrelationId(correlationId);

    var userRealm = util.setupExpectedUserRealmResponseCommon(true);
    var mexWsTrust = util.setupExpectedMexWSTrustRequestCommon();

    var response = util.createResponse();
    var assertion = setupExpectedOAuthAssertionRequest(response);

    var logFunctionCalled = false;
    var foundServerReturnedCorrelationId: boolean;
    var testCorrelationIdLog = function(level: any, message: string) {
      logFunctionCalled = true;
      level;
      assert(message.indexOf(correlationId) >= 0, 'Did not see expected correlationId in this message: ' + message);
      if (message.indexOf('correlationId: ' + correlationId) >= 0) {
        foundServerReturnedCorrelationId = true;
      }
    };
    var logOptions: adal.LoggingOptions = {
      level: 3,
      log : testCorrelationIdLog,
      loggingWithPII: true
    };

    var oldOptions = adal.Logging.getLoggingOptions();
    adal.Logging.setLoggingOptions(logOptions);

    var context = new AuthenticationContext(response.authority);
    context.correlationId = correlationId;
    context.acquireTokenWithUsernamePassword(response.resource, cp.username, cp.password, response.clientId, function(err, tokenResponse) {
      adal.Logging.setLoggingOptions(oldOptions);
      util.setCorrelationId();
      if (!err) {
        assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'The response did not match what was expected');
        userRealm.done();
        mexWsTrust.done();
        assertion.done();
        assert(logFunctionCalled, 'Logging was turned on but no messages were received.');
        assert(foundServerReturnedCorrelationId, 'Did not find any logs that indicated the server returned a correlationId');
      }
      done(err);
    });
  });

  test('invalid-id-token', function(done) {
    var preRequests = util.setupExpectedUserRealmResponseCommon(false);
    var response = util.createResponse();
    var wireResponse = response.wireResponse;

    var responseOptions = { noIdToken : true };
    var responseNoIdToken = util.createResponse(responseOptions);

    // break the id token
    var idToken = wireResponse['id_token'];
    idToken = idToken.replace('.', ' ');
    wireResponse['id_token'] = idToken;

    var upRequest = setupExpectedUserNamePasswordRequestResponse(200, wireResponse, response.authority);

    var context = new AuthenticationContext(response.authority);
    context.acquireTokenWithUsernamePassword(response.resource, cp.username, cp.password, response.clientId, function(err, tokenResponse) {
      if (!err) {
        preRequests.done();
        upRequest.done();
        // There shouldn't be any id_token related paramaters in the repsponse.
        assert(util.isMatchTokenResponse(responseNoIdToken.cachedResponse, tokenResponse), 'Response did not match expected: ' + JSON.stringify(tokenResponse));
      }
      done(err);
    });
  });

  function createMexStub(usernamePasswordUrl: any, err?: Error) {
    var mex = new Mex(cp.callContext, '');
    sinon.stub(mex, 'discover').callsArgWith(0, err);
    mex._usernamePasswordPolicy = {url: usernamePasswordUrl};
    return mex;
  }

  function createUserRealmStub(protocol: any, accountType: any, mexUrl: any, wstrustUrl: any, err?: Error) {
    var userRealm = new UserRealm(cp.callContext, '', '');
    sinon.stub(userRealm, 'discover').callsArgWith(0, err);
    userRealm._federationProtocol = protocol;
    userRealm._accountType = accountType;
    userRealm._federationMetadataUrl = mexUrl;
    userRealm._federationActiveAuthUrl = wstrustUrl;
    return userRealm;
  }

  function createWSTrustRequestStub(err: Error | null, tokenType: string, noToken?: boolean) {
    var wstrustResponse = new WSTrustResponse(cp.callContext,'', '');
    sinon.stub(wstrustResponse, 'parse');
    if (!noToken) {
      wstrustResponse._token = 'This is a stubbed token';
      wstrustResponse._tokenType = tokenType;
    }

    var wstrustRequest = new WSTrustRequest(cp.callContext, '', '', '');
    sinon.stub(wstrustRequest, 'acquireToken').callsArgWith(2, err, wstrustResponse);

    return wstrustRequest;
  }

  function createAuthenticationContextStub(authority :string) {
    var context = new AuthenticationContext(authority, false);
    (context as any)._authority._tokenEndpoint = authority + cp.tokenPath;
    return context;
  }

  function createOAuth2ClientStub(authority: string, tokenResponse: adal.TokenResponse, err?: Error) {
    var client = new OAuth2Client(cp.callContext, authority);
    sinon.stub(client, 'getToken').callsArgWith(1, err, tokenResponse);
    return client;
  }

  function stubOutTokenRequestDependencies(tokenRequest: any, userRealm: any, mex: any, wstrustRequest?: any, oauthClient?: any) {
    sinon.stub(tokenRequest, '_createUserRealmRequest').returns(userRealm);
    sinon.stub(tokenRequest, '_createMex').returns(mex);
    sinon.stub(tokenRequest, '_createWSTrustRequest').returns(wstrustRequest);
    sinon.stub(tokenRequest, '_createOAuth2Client').returns(oauthClient);
  }

  test('federated-failed-mex', function(done) {
    var context = createAuthenticationContextStub(cp.authorityTenant);
    var mex = createMexStub(cp.adfsWsTrust, new Error('mex failed'));
    var userRealm = createUserRealmStub('wstrust', 'federated', cp.adfsMex, cp.adfsWsTrust);
    var wstrustRequest = createWSTrustRequestStub(null, 'urn:oasis:names:tc:SAML:1.0:assertion');

    var response = util.createResponse();
    var oauthClient = createOAuth2ClientStub(cp.authority, response.decodedResponse, undefined);

    var tokenRequest = new TokenRequest(cp.callContext, context, response.clientId, response.resource);
    stubOutTokenRequestDependencies(tokenRequest, userRealm, mex, wstrustRequest, oauthClient);

    tokenRequest.getTokenWithUsernamePassword('username', 'password', function(err: Error, tokenResponse: adal.TokenResponse) {
      if (!err) {
        assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'The response did not match what was expected');
      }
      done(err);
    });
  });

  test('federated-user-realm-returns-no-mex-endpoint-wstrust13', function(done) {
    var context = createAuthenticationContextStub(cp.authorityTenant);
    var mex = createMexStub(cp.adfsWsTrust);
    var userRealm = createUserRealmStub('wstrust', 'federated', null, cp.adfsWsTrust);
    var wstrustRequest = createWSTrustRequestStub(null, 'urn:oasis:names:tc:SAML:1.0:assertion');

    var response = util.createResponse();
    var oauthClient = createOAuth2ClientStub(cp.authority, response.decodedResponse, undefined);

    //util.turnOnLogging();
    var tokenRequest = new TokenRequest(cp.callContext, context, response.clientId, response.resource);
    stubOutTokenRequestDependencies(tokenRequest, userRealm, mex, wstrustRequest, oauthClient);

    tokenRequest.getTokenWithUsernamePassword('username', 'password', function(err: Error, tokenResponse: adal.TokenResponse) {
      if (!err) {
        assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'The response did not match what was expected');
      }
      done(err);
    });
  });

  test('federated-user-realm-returns-no-mex-endpoint-wstrust2005', function(done) {
     var context = createAuthenticationContextStub(cp.authorityTenant);
     var mex = createMexStub(cp.afsWsTrust2005);
     var userRealm = createUserRealmStub('wstrust', 'federated', null, cp.adfsWsTrust2005);
     var wstrustRequest = createWSTrustRequestStub(null, 'urn:oasis:names:tc:SAML:1.0:assertion');

     var response = util.createResponse();
     var oauthClient = createOAuth2ClientStub(cp.authority, response.decodedResponse, undefined);

     //util.turnOnLogging();
     var tokenRequest = new TokenRequest(cp.callContext, context, response.clientId, response.resource);
     stubOutTokenRequestDependencies(tokenRequest, userRealm, mex, wstrustRequest, oauthClient);

     tokenRequest.getTokenWithUsernamePassword('username', 'password', function (err: Error, tokenResponse: adal.TokenResponse) {
       if (!err) {
         assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'The response did not match what was expected');
       }
       done(err);
     });
  });

  test('user-realm-returns-unknown-account-type', function(done) {
    var context = createAuthenticationContextStub(cp.authorityTenant);
    var mex = createMexStub(cp.adfsWsTrust);
    var userRealm = createUserRealmStub('wstrust', 'unknown', cp.adfsMex, cp.adfsWsTrust);

    var tokenRequest = new TokenRequest(cp.callContext, context, cp.clientId, cp.resource);
    stubOutTokenRequestDependencies(tokenRequest, userRealm, mex);

    tokenRequest.getTokenWithUsernamePassword('username', 'password', function(err :Error) {
      assert(err, 'Did not receive expected err.');
      assert(-1 !== err.message.indexOf('unknown AccountType'), 'Did not receive expected error message.');
      done();
    });
  });

  test('federated-saml2', function(done) {
    var context = createAuthenticationContextStub(cp.authorityTenant);
    var mex = createMexStub(cp.adfsWsTrust);
    var userRealm = createUserRealmStub('wstrust', 'federated', cp.adfsMex, cp.adfsWsTrust);
    var wstrustRequest = createWSTrustRequestStub(null, 'urn:oasis:names:tc:SAML:2.0:assertion');

    var response = util.createResponse();
    var oauthClient = createOAuth2ClientStub(cp.authority, response.decodedResponse, undefined);

    //util.turnOnLogging();
    var tokenRequest = new TokenRequest(cp.callContext, context, response.clientId, response.resource);
    stubOutTokenRequestDependencies(tokenRequest, userRealm, mex, wstrustRequest, oauthClient);

    tokenRequest.getTokenWithUsernamePassword('username', 'password', function(err: Error, tokenResponse: adal.TokenResponse) {
      if (!err) {
        assert(util.isMatchTokenResponse(response.cachedResponse, tokenResponse), 'The response did not match what was expected');
      }
      done(err);
    });
  });

  test('federated-unknown-token-type', function(done) {
    var context = createAuthenticationContextStub(cp.authorityTenant);
    var mex = createMexStub(cp.adfsWsTrust);
    var userRealm = createUserRealmStub('wstrust', 'federated', cp.adfsMex, cp.adfsWsTrust);
    var wstrustRequest = createWSTrustRequestStub(null, 'urn:oasis:names:tc:SAML:100.0:assertion');

    var response = util.createResponse();
    var oauthClient = createOAuth2ClientStub(cp.authority, response.decodedResponse, undefined);

    //util.turnOnLogging();
    var tokenRequest = new TokenRequest(cp.callContext, context, response.clientId, response.resource);
    stubOutTokenRequestDependencies(tokenRequest, userRealm, mex, wstrustRequest, oauthClient);

    tokenRequest.getTokenWithUsernamePassword('username', 'password', function(err: Error) {
      assert(err, 'Did not receive expected error.');
      assert(-1 !== err.message.indexOf('token type'), 'Error message did not contain \'token type\'.');
      done();
    });
  });

  test('federated-failed-wstrust', function(done) {
    var context = createAuthenticationContextStub(cp.authorityTenant);
    var mex = createMexStub(cp.adfsWsTrust);
    var userRealm = createUserRealmStub('wstrust', 'federated', null, cp.adfsWsTrust);
    var wstrustRequest = createWSTrustRequestStub(new Error('Network not available'), 'urn:oasis:names:tc:SAML:1.0:assertion');

    var response = util.createResponse();
    var oauthClient = createOAuth2ClientStub(cp.authority, response.decodedResponse, undefined);

    //util.turnOnLogging();
    var tokenRequest = new TokenRequest(cp.callContext, context, response.clientId, response.resource);
    stubOutTokenRequestDependencies(tokenRequest, userRealm, mex, wstrustRequest, oauthClient);

    tokenRequest.getTokenWithUsernamePassword('username', 'password', function(err: Error) {
      assert(err, 'Did not receive expected error');
      done();
    });
  });

  test('federated-wstrust-unparseable', function(done) {
    var context = createAuthenticationContextStub(cp.authorityTenant);
    var mex = createMexStub(cp.adfsWsTrust);
    var userRealm = createUserRealmStub('wstrust', 'federated', null, cp.adfsWsTrust);
    var wstrustRequest = createWSTrustRequestStub(null, 'urn:oasis:names:tc:SAML:2.0:assertion', true);

    var response = util.createResponse();
    var oauthClient = createOAuth2ClientStub(cp.authority, response.decodedResponse, undefined);

    //util.turnOnLogging();
    var tokenRequest = new TokenRequest(cp.callContext, context, response.clientId, response.resource);
    stubOutTokenRequestDependencies(tokenRequest, userRealm, mex, wstrustRequest, oauthClient);

    tokenRequest.getTokenWithUsernamePassword('username', 'password', function(err: Error) {
      assert(err, 'Did not receive expected error');
      done();
    });
  });

  test('federated-wstrust-unknown-token-type', function(done) {
    var context = createAuthenticationContextStub(cp.authorityTenant);
    var mex = createMexStub(cp.adfsWsTrust);
    var userRealm = createUserRealmStub('wstrust', 'federated', null, cp.adfsWsTrust);
    var wstrustRequest = createWSTrustRequestStub(null, 'urn:oasis:names:tc:SAML:100.0:assertion', true);

    var response = util.createResponse();
    var oauthClient = createOAuth2ClientStub(cp.authority, response.decodedResponse, undefined);

    //util.turnOnLogging();
    var tokenRequest = new TokenRequest(cp.callContext, context, response.clientId, response.resource);
    stubOutTokenRequestDependencies(tokenRequest, userRealm, mex, wstrustRequest, oauthClient);

    tokenRequest.getTokenWithUsernamePassword('username', 'password', function(err: Error) {
      assert(err, 'Did not receive expected error');
      done();
    });
  });

  test('jwt-cracking', function(done) {
    var testData = [
      [
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiJlOTU4YzA5YS1hYzM3LTQ5MDAtYjRkNy1mYjNlZWFmNzMzOGQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jY2ViYTE0Yy02YTAwLTQ5YWMtYjgwNi04NGRlNTJiZjFkNDIvIiwiaWF0IjoxMzkxNjQ1NDU4LCJuYmYiOjEzOTE2NDU0NTgsImV4cCI6MTM5MTY0OTM1OCwidmVyIjoiMS4wIiwidGlkIjoiY2NlYmExNGMtNmEwMC00OWFjLWI4MDYtODRkZTUyYmYxZDQyIiwib2lkIjoiYTQ0MzIwNGEtYWJjOS00Y2I4LWFkYzEtYzBkZmMxMjMwMGFhIiwidXBuIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInVuaXF1ZV9uYW1lIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInN1YiI6IjRnVHY0RXRvWVctRFRvdzBiRG5KZDFBQTRzZkNoQmJqZXJtcXQ2UV9aYTQiLCJmYW1pbHlfbmFtZSI6IlJhbmRhbGwiLCJnaXZlbl9uYW1lIjoiUmljaCJ9.',
        {
          header : 'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0',
          JWSPayload : 'eyJhdWQiOiJlOTU4YzA5YS1hYzM3LTQ5MDAtYjRkNy1mYjNlZWFmNzMzOGQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jY2ViYTE0Yy02YTAwLTQ5YWMtYjgwNi04NGRlNTJiZjFkNDIvIiwiaWF0IjoxMzkxNjQ1NDU4LCJuYmYiOjEzOTE2NDU0NTgsImV4cCI6MTM5MTY0OTM1OCwidmVyIjoiMS4wIiwidGlkIjoiY2NlYmExNGMtNmEwMC00OWFjLWI4MDYtODRkZTUyYmYxZDQyIiwib2lkIjoiYTQ0MzIwNGEtYWJjOS00Y2I4LWFkYzEtYzBkZmMxMjMwMGFhIiwidXBuIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInVuaXF1ZV9uYW1lIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInN1YiI6IjRnVHY0RXRvWVctRFRvdzBiRG5KZDFBQTRzZkNoQmJqZXJtcXQ2UV9aYTQiLCJmYW1pbHlfbmFtZSI6IlJhbmRhbGwiLCJnaXZlbl9uYW1lIjoiUmljaCJ9',
          JWSSig : ''
        }
      ],
      // remove header
      [
        '.eyJhdWQiOiJlOTU4YzA5YS1hYzM3LTQ5MDAtYjRkNy1mYjNlZWFmNzMzOGQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jY2ViYTE0Yy02YTAwLTQ5YWMtYjgwNi04NGRlNTJiZjFkNDIvIiwiaWF0IjoxMzkxNjQ1NDU4LCJuYmYiOjEzOTE2NDU0NTgsImV4cCI6MTM5MTY0OTM1OCwidmVyIjoiMS4wIiwidGlkIjoiY2NlYmExNGMtNmEwMC00OWFjLWI4MDYtODRkZTUyYmYxZDQyIiwib2lkIjoiYTQ0MzIwNGEtYWJjOS00Y2I4LWFkYzEtYzBkZmMxMjMwMGFhIiwidXBuIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInVuaXF1ZV9uYW1lIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInN1YiI6IjRnVHY0RXRvWVctRFRvdzBiRG5KZDFBQTRzZkNoQmJqZXJtcXQ2UV9aYTQiLCJmYW1pbHlfbmFtZSI6IlJhbmRhbGwiLCJnaXZlbl9uYW1lIjoiUmljaCJ9.',
        {
          header : '',
          JWSPayload : 'eyJhdWQiOiJlOTU4YzA5YS1hYzM3LTQ5MDAtYjRkNy1mYjNlZWFmNzMzOGQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jY2ViYTE0Yy02YTAwLTQ5YWMtYjgwNi04NGRlNTJiZjFkNDIvIiwiaWF0IjoxMzkxNjQ1NDU4LCJuYmYiOjEzOTE2NDU0NTgsImV4cCI6MTM5MTY0OTM1OCwidmVyIjoiMS4wIiwidGlkIjoiY2NlYmExNGMtNmEwMC00OWFjLWI4MDYtODRkZTUyYmYxZDQyIiwib2lkIjoiYTQ0MzIwNGEtYWJjOS00Y2I4LWFkYzEtYzBkZmMxMjMwMGFhIiwidXBuIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInVuaXF1ZV9uYW1lIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInN1YiI6IjRnVHY0RXRvWVctRFRvdzBiRG5KZDFBQTRzZkNoQmJqZXJtcXQ2UV9aYTQiLCJmYW1pbHlfbmFtZSI6IlJhbmRhbGwiLCJnaXZlbl9uYW1lIjoiUmljaCJ9',
          JWSSig : ''
        }
      ],
      // Add JWSSig
      [
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiJlOTU4YzA5YS1hYzM3LTQ5MDAtYjRkNy1mYjNlZWFmNzMzOGQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jY2ViYTE0Yy02YTAwLTQ5YWMtYjgwNi04NGRlNTJiZjFkNDIvIiwiaWF0IjoxMzkxNjQ1NDU4LCJuYmYiOjEzOTE2NDU0NTgsImV4cCI6MTM5MTY0OTM1OCwidmVyIjoiMS4wIiwidGlkIjoiY2NlYmExNGMtNmEwMC00OWFjLWI4MDYtODRkZTUyYmYxZDQyIiwib2lkIjoiYTQ0MzIwNGEtYWJjOS00Y2I4LWFkYzEtYzBkZmMxMjMwMGFhIiwidXBuIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInVuaXF1ZV9uYW1lIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInN1YiI6IjRnVHY0RXRvWVctRFRvdzBiRG5KZDFBQTRzZkNoQmJqZXJtcXQ2UV9aYTQiLCJmYW1pbHlfbmFtZSI6IlJhbmRhbGwiLCJnaXZlbl9uYW1lIjoiUmljaCJ9.test',
        {
          header : 'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0',
          JWSPayload : 'eyJhdWQiOiJlOTU4YzA5YS1hYzM3LTQ5MDAtYjRkNy1mYjNlZWFmNzMzOGQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jY2ViYTE0Yy02YTAwLTQ5YWMtYjgwNi04NGRlNTJiZjFkNDIvIiwiaWF0IjoxMzkxNjQ1NDU4LCJuYmYiOjEzOTE2NDU0NTgsImV4cCI6MTM5MTY0OTM1OCwidmVyIjoiMS4wIiwidGlkIjoiY2NlYmExNGMtNmEwMC00OWFjLWI4MDYtODRkZTUyYmYxZDQyIiwib2lkIjoiYTQ0MzIwNGEtYWJjOS00Y2I4LWFkYzEtYzBkZmMxMjMwMGFhIiwidXBuIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInVuaXF1ZV9uYW1lIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInN1YiI6IjRnVHY0RXRvWVctRFRvdzBiRG5KZDFBQTRzZkNoQmJqZXJtcXQ2UV9aYTQiLCJmYW1pbHlfbmFtZSI6IlJhbmRhbGwiLCJnaXZlbl9uYW1lIjoiUmljaCJ9',
          JWSSig : 'test'
        }
      ],
      // Remove JWS payload
      [
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0..',
        null
      ],
      // Remove JWS payload
      [
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0..test',
        null
      ],
      // JWT payload is only a space.
      [
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0. .test',
        null
      ],
      // Add space
      [
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiJlOTU4YzA5YS1hYzM3LTQ5MDAtYjRkNy1 mYjNlZWFmNzMzOGQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jY2ViYTE0Yy02YTAwLTQ5YWMtYjgwNi04NGRlNTJiZjFkNDIvIiwiaWF0IjoxMzkxNjQ1NDU4LCJuYmYiOjEzOTE2NDU0NTgsImV4cCI6MTM5MTY0OTM1OCwidmVyIjoiMS4wIiwidGlkIjoiY2NlYmExNGMtNmEwMC00OWFjLWI4MDYtODRkZTUyYmYxZDQyIiwib2lkIjoiYTQ0MzIwNGEtYWJjOS00Y2I4LWFkYzEtYzBkZmMxMjMwMGFhIiwidXBuIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInVuaXF1ZV9uYW1lIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInN1YiI6IjRnVHY0RXRvWVctRFRvdzBiRG5KZDFBQTRzZkNoQmJqZXJtcXQ2UV9aYTQiLCJmYW1pbHlfbmFtZSI6IlJhbmRhbGwiLCJnaXZlbl9uYW1lIjoiUmljaCJ9.',
        null
      ],
      // remove first period.
      [
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0eyJhdWQiOiJlOTU4YzA5YS1hYzM3LTQ5MDAtYjRkNy1mYjNlZWFmNzMzOGQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jY2ViYTE0Yy02YTAwLTQ5YWMtYjgwNi04NGRlNTJiZjFkNDIvIiwiaWF0IjoxMzkxNjQ1NDU4LCJuYmYiOjEzOTE2NDU0NTgsImV4cCI6MTM5MTY0OTM1OCwidmVyIjoiMS4wIiwidGlkIjoiY2NlYmExNGMtNmEwMC00OWFjLWI4MDYtODRkZTUyYmYxZDQyIiwib2lkIjoiYTQ0MzIwNGEtYWJjOS00Y2I4LWFkYzEtYzBkZmMxMjMwMGFhIiwidXBuIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInVuaXF1ZV9uYW1lIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInN1YiI6IjRnVHY0RXRvWVctRFRvdzBiRG5KZDFBQTRzZkNoQmJqZXJtcXQ2UV9aYTQiLCJmYW1pbHlfbmFtZSI6IlJhbmRhbGwiLCJnaXZlbl9uYW1lIjoiUmljaCJ9.',
        null
      ],
      // remove second period.
      [
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiJlOTU4YzA5YS1hYzM3LTQ5MDAtYjRkNy1mYjNlZWFmNzMzOGQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jY2ViYTE0Yy02YTAwLTQ5YWMtYjgwNi04NGRlNTJiZjFkNDIvIiwiaWF0IjoxMzkxNjQ1NDU4LCJuYmYiOjEzOTE2NDU0NTgsImV4cCI6MTM5MTY0OTM1OCwidmVyIjoiMS4wIiwidGlkIjoiY2NlYmExNGMtNmEwMC00OWFjLWI4MDYtODRkZTUyYmYxZDQyIiwib2lkIjoiYTQ0MzIwNGEtYWJjOS00Y2I4LWFkYzEtYzBkZmMxMjMwMGFhIiwidXBuIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInVuaXF1ZV9uYW1lIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInN1YiI6IjRnVHY0RXRvWVctRFRvdzBiRG5KZDFBQTRzZkNoQmJqZXJtcXQ2UV9aYTQiLCJmYW1pbHlfbmFtZSI6IlJhbmRhbGwiLCJnaXZlbl9uYW1lIjoiUmljaCJ9',
        null
      ],
      // prefixed space
      [
        '  eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiJlOTU4YzA5YS1hYzM3LTQ5MDAtYjRkNy1mYjNlZWFmNzMzOGQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jY2ViYTE0Yy02YTAwLTQ5YWMtYjgwNi04NGRlNTJiZjFkNDIvIiwiaWF0IjoxMzkxNjQ1NDU4LCJuYmYiOjEzOTE2NDU0NTgsImV4cCI6MTM5MTY0OTM1OCwidmVyIjoiMS4wIiwidGlkIjoiY2NlYmExNGMtNmEwMC00OWFjLWI4MDYtODRkZTUyYmYxZDQyIiwib2lkIjoiYTQ0MzIwNGEtYWJjOS00Y2I4LWFkYzEtYzBkZmMxMjMwMGFhIiwidXBuIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInVuaXF1ZV9uYW1lIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInN1YiI6IjRnVHY0RXRvWVctRFRvdzBiRG5KZDFBQTRzZkNoQmJqZXJtcXQ2UV9aYTQiLCJmYW1pbHlfbmFtZSI6IlJhbmRhbGwiLCJnaXZlbl9uYW1lIjoiUmljaCJ9.test',
        null
      ],
      // trailing space
      [
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiJlOTU4YzA5YS1hYzM3LTQ5MDAtYjRkNy1mYjNlZWFmNzMzOGQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jY2ViYTE0Yy02YTAwLTQ5YWMtYjgwNi04NGRlNTJiZjFkNDIvIiwiaWF0IjoxMzkxNjQ1NDU4LCJuYmYiOjEzOTE2NDU0NTgsImV4cCI6MTM5MTY0OTM1OCwidmVyIjoiMS4wIiwidGlkIjoiY2NlYmExNGMtNmEwMC00OWFjLWI4MDYtODRkZTUyYmYxZDQyIiwib2lkIjoiYTQ0MzIwNGEtYWJjOS00Y2I4LWFkYzEtYzBkZmMxMjMwMGFhIiwidXBuIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInVuaXF1ZV9uYW1lIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInN1YiI6IjRnVHY0RXRvWVctRFRvdzBiRG5KZDFBQTRzZkNoQmJqZXJtcXQ2UV9aYTQiLCJmYW1pbHlfbmFtZSI6IlJhbmRhbGwiLCJnaXZlbl9uYW1lIjoiUmljaCJ9.test  ',
        null
      ],
      // add section
      [
        'notsupposedtobehere.eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiJlOTU4YzA5YS1hYzM3LTQ5MDAtYjRkNy1mYjNlZWFmNzMzOGQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jY2ViYTE0Yy02YTAwLTQ5YWMtYjgwNi04NGRlNTJiZjFkNDIvIiwiaWF0IjoxMzkxNjQ1NDU4LCJuYmYiOjEzOTE2NDU0NTgsImV4cCI6MTM5MTY0OTM1OCwidmVyIjoiMS4wIiwidGlkIjoiY2NlYmExNGMtNmEwMC00OWFjLWI4MDYtODRkZTUyYmYxZDQyIiwib2lkIjoiYTQ0MzIwNGEtYWJjOS00Y2I4LWFkYzEtYzBkZmMxMjMwMGFhIiwidXBuIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInVuaXF1ZV9uYW1lIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInN1YiI6IjRnVHY0RXRvWVctRFRvdzBiRG5KZDFBQTRzZkNoQmJqZXJtcXQ2UV9aYTQiLCJmYW1pbHlfbmFtZSI6IlJhbmRhbGwiLCJnaXZlbl9uYW1lIjoiUmljaCJ9.test',
        null
      ],
      // extra stuff at beginning seperated by space.
      [
        'stuff eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhdWQiOiJlOTU4YzA5YS1hYzM3LTQ5MDAtYjRkNy1mYjNlZWFmNzMzOGQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9jY2ViYTE0Yy02YTAwLTQ5YWMtYjgwNi04NGRlNTJiZjFkNDIvIiwiaWF0IjoxMzkxNjQ1NDU4LCJuYmYiOjEzOTE2NDU0NTgsImV4cCI6MTM5MTY0OTM1OCwidmVyIjoiMS4wIiwidGlkIjoiY2NlYmExNGMtNmEwMC00OWFjLWI4MDYtODRkZTUyYmYxZDQyIiwib2lkIjoiYTQ0MzIwNGEtYWJjOS00Y2I4LWFkYzEtYzBkZmMxMjMwMGFhIiwidXBuIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInVuaXF1ZV9uYW1lIjoicnJhbmRhbGxAcnJhbmRhbGxhYWQxLm9ubWljcm9zb2Z0LmNvbSIsInN1YiI6IjRnVHY0RXRvWVctRFRvdzBiRG5KZDFBQTRzZkNoQmJqZXJtcXQ2UV9aYTQiLCJmYW1pbHlfbmFtZSI6IlJhbmRhbGwiLCJnaXZlbl9uYW1lIjoiUmljaCJ9.test',
        null
      ],
    ];

    var oauthObj = util.createEmptyADALObject();
    var parseJWT = OAuth2Client.prototype._crackJwt.bind(oauthObj);
    for (var i = 0; i < testData.length; i++) {
      var testCase = testData[i];
      var testJWT = testCase[0];
      var testResult = testCase[1];

      var crackedJwt = parseJWT(testJWT);
      if (testResult) {
        assert(_.isEqual(testResult, crackedJwt), 'The cracked token does not match the expected result.');
      } else {
        assert(!crackedJwt, 'The JWT token was invalid but token cracking returned success.');
      }
    }
    done();
  });

  test('bad-int-in-response', function(done) {
    var preRequests = util.setupExpectedUserRealmResponseCommon(false);
    var response = util.createResponse();

    response.wireResponse['expires_in'] = 'test';

    var upRequest = setupExpectedUserNamePasswordRequestResponse(200, response.wireResponse, response.authority);

    var context = new AuthenticationContext(response.authority);
    context.acquireTokenWithUsernamePassword(response.resource, cp.username, cp.password, cp.clientId, function(err) {
      preRequests.done();
      upRequest.done();
      assert(err, 'Did not receive expected error about bad int parameter.');
      done();
    });
  });

  test('bad-id-token-base64-in-response', function(done) {
    var foundWarning = false;
    var preRequests = util.setupExpectedUserRealmResponseCommon(false);
    var response = util.createResponse();

    function findIdTokenWarning(level: any, message: string) {
      level;
      if (message.indexOf('decoded') >= 0) {
        foundWarning = true;
      }
    }
    util.turnOnLogging(null, findIdTokenWarning);

    response.wireResponse['id_token'] = 'aaaaaaa./+===.aaaaaa';

    var upRequest = setupExpectedUserNamePasswordRequestResponse(200, response.wireResponse, response.authority);

    var context = new AuthenticationContext(response.authority);
    context.acquireTokenWithUsernamePassword(response.resource, cp.username, cp.password, cp.clientId, function(err) {
      preRequests.done();
      upRequest.done();
      assert(!err, 'Should not have received error since the id_token is optional.');
      assert(foundWarning, 'Did not see expected warning message about bad id_token base64.');
      done();
    });
  });

  test('no-token-type', function(done) {
    var preRequests = util.setupExpectedUserRealmResponseCommon(false);
    var response = util.createResponse();

    delete response.wireResponse['token_type'];

    var upRequest = setupExpectedUserNamePasswordRequestResponse(200, response.wireResponse, response.authority);

    var context = new AuthenticationContext(response.authority);
    context.acquireTokenWithUsernamePassword(response.resource, cp.username, cp.password, cp.clientId, function(err) {
      preRequests.done();
      upRequest.done();
      assert(err, 'Did not receive expected error about missing token_type');
      done();
    });
  });

  test('no-access-token', function(done) {
    var preRequests = util.setupExpectedUserRealmResponseCommon(false);
    var response = util.createResponse();

    delete response.wireResponse['access_token'];

    var upRequest = setupExpectedUserNamePasswordRequestResponse(200, response.wireResponse, response.authority);

    var context = new AuthenticationContext(response.authority);
    context.acquireTokenWithUsernamePassword(response.resource, cp.username, cp.password, cp.clientId, function(err) {
      preRequests.done();
      upRequest.done();
      assert(err, 'Did not receive expected error about missing token_type');
      done();
    });
  });
});
