/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict';

/* eslint no-underscore-dangle: 0 */

var chai = require('chai');
var url = require('url');
chai.use(require('chai-passport-strategy'));

const TEST_TIMEOUT = 1000000; // 1000 seconds

var Metadata = require('../../lib/metadata').Metadata;
var OIDCStrategy = require('../../lib/index').OIDCStrategy;

var nonce = 'eDBXVqk40ng5BarS';
var id_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlliUkFRUlljRV9tb3RXVkpLSHJ3TEJiZF85cyIsImtpZCI6IlliUkFRUlljRV9tb3RXVkpLSHJ3TEJiZF85cyJ9.eyJhdWQiOiIyYWJmM2E1Mi03ZDg2LTQ2MGItYTFlZi03N2RjNDNkZThhYWQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC8yNjhkYTFhMS05ZGI0LTQ4YjktYjFmZS02ODMyNTBiYTkwY2MvIiwiaWF0IjoxNDcxMzEzNDE3LCJuYmYiOjE0NzEzMTM0MTcsImV4cCI6MTQ3MTMxNzMxNywiYW1yIjpbInB3ZCJdLCJmYW1pbHlfbmFtZSI6Im9uZSIsImdpdmVuX25hbWUiOiJyb2JvdCIsImlwYWRkciI6IjE2Ny4yMjAuMC4xNjAiLCJuYW1lIjoicm9ib3QgMSIsIm5vbmNlIjoiZURCWFZxazQwbmc1QmFyUyIsIm9pZCI6Ijc5MTJmZTdiLWI1YWItNDI1Yi1iYjFmLTBlODNiOTlmY2E3ZiIsInB3ZF9leHAiOiI1ODQ2NzIiLCJwd2RfdXJsIjoiaHR0cHM6Ly9wb3J0YWwubWljcm9zb2Z0b25saW5lLmNvbS9DaGFuZ2VQYXNzd29yZC5hc3B4Iiwic3ViIjoiMUpNZHpPeEp5V2VDb2M1UXNZdkRQY29adHFodVdJWnhnbUhuQ3pRVFhhUSIsInRpZCI6IjI2OGRhMWExLTlkYjQtNDhiOS1iMWZlLTY4MzI1MGJhOTBjYyIsInVuaXF1ZV9uYW1lIjoicm9ib3RAc2lqdW4ub25taWNyb3NvZnQuY29tIiwidXBuIjoicm9ib3RAc2lqdW4ub25taWNyb3NvZnQuY29tIiwidmVyIjoiMS4wIn0.qoOyzkWJoB6XOOpISWamL6LrQ3VImbf5QWm5Zfs_dCgNpRaUS1EiOV8kijKZy4YTQ6ldKHhcbRtEAMZzrBl9k74Nks2JYSMAP05rAHvADyWcl89IzZ-cyWXwEfUJshRY8wMut11eBcIY3ml5--9AjtLYoqDKZZcNs2FdYsp9RwEc_tZWamHQ1rdknlbRDViXvqwtsNAgXLESA10nJIgwMEc6bKB3_pnEeBHjUJWcbKEeE6sZNdS66QK7DXEEnjEMdjShRZSULDX4pNtj-9azyNa8zKJPM4T-gkFkYO2LurKFRWTtjwshzxBCLXJ6cDq5B_kGcSJIMQ134Jbk7-kKiQ';
// change the last character in id_token to make a id_token with wrong signature
var id_token_wrong_signature = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlliUkFRUlljRV9tb3RXVkpLSHJ3TEJiZF85cyIsImtpZCI6IlliUkFRUlljRV9tb3RXVkpLSHJ3TEJiZF85cyJ9.eyJhdWQiOiIyYWJmM2E1Mi03ZDg2LTQ2MGItYTFlZi03N2RjNDNkZThhYWQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC8yNjhkYTFhMS05ZGI0LTQ4YjktYjFmZS02ODMyNTBiYTkwY2MvIiwiaWF0IjoxNDcxMzEzNDE3LCJuYmYiOjE0NzEzMTM0MTcsImV4cCI6MTQ3MTMxNzMxNywiYW1yIjpbInB3ZCJdLCJmYW1pbHlfbmFtZSI6Im9uZSIsImdpdmVuX25hbWUiOiJyb2JvdCIsImlwYWRkciI6IjE2Ny4yMjAuMC4xNjAiLCJuYW1lIjoicm9ib3QgMSIsIm5vbmNlIjoiZURCWFZxazQwbmc1QmFyUyIsIm9pZCI6Ijc5MTJmZTdiLWI1YWItNDI1Yi1iYjFmLTBlODNiOTlmY2E3ZiIsInB3ZF9leHAiOiI1ODQ2NzIiLCJwd2RfdXJsIjoiaHR0cHM6Ly9wb3J0YWwubWljcm9zb2Z0b25saW5lLmNvbS9DaGFuZ2VQYXNzd29yZC5hc3B4Iiwic3ViIjoiMUpNZHpPeEp5V2VDb2M1UXNZdkRQY29adHFodVdJWnhnbUhuQ3pRVFhhUSIsInRpZCI6IjI2OGRhMWExLTlkYjQtNDhiOS1iMWZlLTY4MzI1MGJhOTBjYyIsInVuaXF1ZV9uYW1lIjoicm9ib3RAc2lqdW4ub25taWNyb3NvZnQuY29tIiwidXBuIjoicm9ib3RAc2lqdW4ub25taWNyb3NvZnQuY29tIiwidmVyIjoiMS4wIn0.qoOyzkWJoB6XOOpISWamL6LrQ3VImbf5QWm5Zfs_dCgNpRaUS1EiOV8kijKZy4YTQ6ldKHhcbRtEAMZzrBl9k74Nks2JYSMAP05rAHvADyWcl89IzZ-cyWXwEfUJshRY8wMut11eBcIY3ml5--9AjtLYoqDKZZcNs2FdYsp9RwEc_tZWamHQ1rdknlbRDViXvqwtsNAgXLESA10nJIgwMEc6bKB3_pnEeBHjUJWcbKEeE6sZNdS66QK7DXEEnjEMdjShRZSULDX4pNtj-9azyNa8zKJPM4T-gkFkYO2LurKFRWTtjwshzxBCLXJ6cDq5B_kGcSJIMQ134Jbk7-kKiq';

// Mock the process of getting PEMkey
var PEMkey = "-----BEGIN RSA PUBLIC KEY-----\n\
MIIBCgKCAQEAvbcFrj193Gm6zeo5e2/y54Jx49sIgScv+2JO+n6NxNqQaKVnMkHc\n\
z+S1j2FfpFngotwGMzZIKVCY1SK8SKZMFfRTU3wvToZITwf3W1Qq6n+h+abqpyJT\n\
aqIcfhA0d6kEAM5NsQAKhfvw7fre1QicmU9LWVWUYAayLmiRX6o3tktJq6H58pUz\n\
Ttx/D0Dprnx6z5sW+uiMipLXbrgYmOez7htokJVgDg8w+yDFCxZNo7KVueUkLkxh\n\
NjYGkGfnt18s7ZW036WoTmdaQmW4CChf/o4TLE5VyGpYWm7I/+nV95BBvwlzokVV\n\
KzveKf3l5UU3c6PkGy+BB3E/ChqFm6sPWwIDAQAB\n\
-----END RSA PUBLIC KEY-----\n\
";

/*
 * test strategy (for response_type = 'id_token') which checks the expiration of id_token
 */

var options = {
  redirectUrl: 'https://localhost:3000/auth/openid/return',
  clientID: '2abf3a52-7d86-460b-a1ef-77dc43de8aad',
  identityMetadata: 'https://login.microsoftonline.com/common/.well-known/openid-configuration',
  responseType: 'id_token',
  responseMode: 'form_post',
  validateIssuer: true,
  passReqToCallback: false,
  sessionKey: 'my_key',
  issuer: 'https://sts.windows.net/268da1a1-9db4-48b9-b1fe-683250ba90cc/',
  loggingNoPII: false
};

var options_badIssuer = {
  redirectUrl: 'https://localhost:3000/auth/openid/return',
  clientID: '2abf3a52-7d86-460b-a1ef-77dc43de8aad',
  identityMetadata: 'https://login.microsoftonline.com/common/.well-known/openid-configuration',
  responseType: 'id_token',
  responseMode: 'form_post',
  validateIssuer: true,
  passReqToCallback: false,
  sessionKey: 'my_key',
  issuer: 'https://sts.windows.net/268da1a1-9db4-48b9-b1fe-683250ba90cc/',
  loggingNoPII: false
};

var testStrategy = new OIDCStrategy(options, function(profile, done) {
    done(null, profile.upn);
});

var testStrategy_badIssuer = new OIDCStrategy(options_badIssuer, function(profile, done) {
    done(null, profile.upn);
});
/* 
 * Begin the testing
 */
var challenge;
var user;

var setIgnoreExpirationFalse = function(options) { options.ignoreExpiration = false; };
var setWrongIssuer = function(options) { options.issuer = 'wrong_issuer'; };
var rmValidateIssuer = function(options) { options.validateIssuer = undefined; };

var testPrepare = function(id_token_to_use, nonce_to_use, action) {
  return function(done) {
    // Mock `setOptions` 
    testStrategy.setOptions = function(params, oauthConfig, optionsToValidate, done) {
      params.metadata.generateOidcPEM = () => { return PEMkey; };

      optionsToValidate.validateIssuer = true;
      optionsToValidate.issuer = 'https://sts.windows.net/268da1a1-9db4-48b9-b1fe-683250ba90cc/';
      optionsToValidate.audience = '2abf3a52-7d86-460b-a1ef-77dc43de8aad';
      optionsToValidate.allowMultiAudiencesInToken = false;
      optionsToValidate.ignoreExpiration = true;
      optionsToValidate.algorithms = ['RS256'];
      optionsToValidate.nonce = nonce_to_use;
      optionsToValidate.clockSkew = testStrategy._options.clockSkew;

      if (action) {
        for (let i = 0; i < action.length; i++)
          action[i](optionsToValidate);
      }
      return done();
    };

    chai.passport
      .use(testStrategy)
      .fail(function(c) {
        challenge = c; done();
      })
      .success(function(u) {
        user = u; done();
      })
      .req(function(req) {
        // reset the value of challenge and user
        challenge = user = undefined;
        var time = Date.now();
        // add state and nonce to session
        req.session = {'my_key': {'content': [{'state': 'my_state', 'nonce': nonce_to_use, 'policy': undefined, 'timeStamp': time}]}};
        // add id_token and state to body
        req.body = {'id_token': id_token_to_use, 'state' : 'my_state'}; 
        // empty query
        req.query = {};
      })
      .authenticate({});
  };
};

describe('OIDCStrategy implicit flow test', function() {
  this.timeout(TEST_TIMEOUT);

  describe('should succeed without expiration checking', function() {
    before(testPrepare(id_token, nonce));

    it('should succeed with expected user', function() {
      chai.expect(user).to.equal('robot@sijun.onmicrosoft.com');
    });
  });

  describe('should fail for id_token with invalid signature', function() {
    before(testPrepare(id_token_wrong_signature, nonce));

    it('should fail', function() {
      chai.expect(challenge).to.equal('In _validateResponse: invalid signature');
    });
  });

  describe('should fail for id_token with wrong nonce', function() {
    before(testPrepare(id_token, 'wrong_nonce'));

    it('should fail', function() {
      chai.expect(challenge).to.equal('In _validateResponse: invalid nonce');
    });
  });

  describe('should fail with id_token expiration checking', function() {
    before(testPrepare(id_token, nonce, [setIgnoreExpirationFalse]));

    it('should fail', function() {
      chai.expect(challenge).to.equal('In _validateResponse: jwt is expired');
    });
  });

  describe('should fail with wrong issuer', function() {
    // we check the issuer by default
    before(testPrepare(id_token, nonce, [setWrongIssuer]));

    it('should fail', function() {
      chai.expect(challenge).to.equal('In _validateResponse: jwt issuer is invalid');
    });
  });

  describe('should fail with wrong issuer with default value of validateIssuer', function() {
    // for non-common endpoint, we force to validate issuer
    before(testPrepare(id_token, nonce, [rmValidateIssuer, setWrongIssuer]));

    it('should fail', function() {
      chai.expect(challenge).to.equal('In _validateResponse: jwt issuer is invalid');
    });
  });
});

