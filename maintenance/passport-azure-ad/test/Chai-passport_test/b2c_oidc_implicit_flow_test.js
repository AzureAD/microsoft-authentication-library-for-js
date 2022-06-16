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

var nonce = 'OKK4cd2ftdqsj4n0Gr+GCHOMH6cJ00oO';
var policy = 'b2c_1_signin';
var id_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IklkVG9rZW5TaWduaW5nS2V5Q29udGFpbmVyLnYyIn0.eyJleHAiOjE0NzQ2OTY0MjQsIm5iZiI6MTQ3NDY5MjgyNCwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5taWNyb3NvZnRvbmxpbmUuY29tLzIyYmY0MGM2LTExODYtNGVhNS1iNDliLTNkYzRlYzBmNTRlYi92Mi4wLyIsInN1YiI6Ik5vdCBzdXBwb3J0ZWQgY3VycmVudGx5LiBVc2Ugb2lkIGNsYWltLiIsImF1ZCI6ImYwYjZlNGViLTJkOGMtNDBiNi1iOWM2LWUyNmQxMDc0ODQ2ZCIsImFjciI6ImIyY18xX3NpZ25pbiIsIm5vbmNlIjoiT0tLNGNkMmZ0ZHFzajRuMEdyK0dDSE9NSDZjSjAwb08iLCJpYXQiOjE0NzQ2OTI4MjQsImF1dGhfdGltZSI6MTQ3NDY5MjgyNCwib2lkIjoiNDMyOWQ2YmMtMGY4NC00NWQ4LTg3MDktMmM4YjA5MTM1N2QxIiwiZW1haWxzIjpbInNpanVuLndvcmtAZ21haWwuY29tIl19.BzKOUVnE6s6c03CFkS1DceJNvwXwHXE4IlXxXJyjNrD6LGKoMnRqI2mFzylCpjib4QM7byjHLs6MumwjrIR4iu_m-ryU6_2NMB0ry8cVCzm7g3QQklNGlsGAeHT69yl8TBqQpUCB71NoDu830nTcLwzN490id4RiWlTiJboyCkOHGZ36hMd4L-9qR-GtWKIJQR8-bgZRjS9vysaUQigIyMEaZzqQ3HBF1gq1euXLfiL_QAaFVay1CvT3kcvFN7wUfdMP6QvpwnzKTQW3CSpLbQlcxdc1bsNWvnd9d6ASxZVHMSxljJ7ZK0YHg6mUCDEH3r4nK9Sdvy_CHeKKOuPZtQ';
// change the last character in id_token to make a id_token with wrong signature
var id_token_wrong_signature = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IklkVG9rZW5TaWduaW5nS2V5Q29udGFpbmVyLnYyIn0.eyJleHAiOjE0NzQ2OTY0MjQsIm5iZiI6MTQ3NDY5MjgyNCwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5taWNyb3NvZnRvbmxpbmUuY29tLzIyYmY0MGM2LTExODYtNGVhNS1iNDliLTNkYzRlYzBmNTRlYi92Mi4wLyIsInN1YiI6Ik5vdCBzdXBwb3J0ZWQgY3VycmVudGx5LiBVc2Ugb2lkIGNsYWltLiIsImF1ZCI6ImYwYjZlNGViLTJkOGMtNDBiNi1iOWM2LWUyNmQxMDc0ODQ2ZCIsImFjciI6ImIyY18xX3NpZ25pbiIsIm5vbmNlIjoiT0tLNGNkMmZ0ZHFzajRuMEdyK0dDSE9NSDZjSjAwb08iLCJpYXQiOjE0NzQ2OTI4MjQsImF1dGhfdGltZSI6MTQ3NDY5MjgyNCwib2lkIjoiNDMyOWQ2YmMtMGY4NC00NWQ4LTg3MDktMmM4YjA5MTM1N2QxIiwiZW1haWxzIjpbInNpanVuLndvcmtAZ21haWwuY29tIl19.BzKOUVnE6s6c03CFkS1DceJNvwXwHXE4IlXxXJyjNrD6LGKoMnRqI2mFzylCpjib4QM7byjHLs6MumwjrIR4iu_m-ryU6_2NMB0ry8cVCzm7g3QQklNGlsGAeHT69yl8TBqQpUCB71NoDu830nTcLwzN490id4RiWlTiJboyCkOHGZ36hMd4L-9qR-GtWKIJQR8-bgZRjS9vysaUQigIyMEaZzqQ3HBF1gq1euXLfiL_QAaFVay1CvT3kcvFN7wUfdMP6QvpwnzKTQW3CSpLbQlcxdc1bsNWvnd9d6ASxZVHMSxljJ7ZK0YHg6mUCDEH3r4nK9Sdvy_CHeKKOuPZtM';

// Mock the process of getting PEMkey
var PEMkey = "-----BEGIN RSA PUBLIC KEY-----\n\
MIIBCgKCAQEAs4W7xjkQZP3OwG7PfRgcYKn8eRYXHiz1iK503fS+K2FZo+Ublwwa\n\
2xFZWpsUU/jtoVCwIkaqZuo6xoKtlMYXXvfVHGuKBHEBVn8b8x/57BQWz1d0KdrN\n\
XxuMvtFe6RzMqiMqzqZrzae4UqVCkYqcR9gQx66Ehq7hPmCxJCkg7ajo7fu6E7dP\n\
d34KH2HSYRsaaEA/BcKTeb9H1XE/qEKjog68wUU9Ekfl3FBIRN+1Ah/BoktGFoXy\n\
i/jt0+L0+gKcL1BLmUlGzMusvRbjI/0+qj+mc0utGdRjY+xIN2yBj8vl4DODO+wM\n\
wfp+cqZbCd9TENyHaTb8iA27s+73L3ExOQIDAQAB\n\
-----END RSA PUBLIC KEY-----\n";

/*
 * test strategy (for response_type = 'id_token') which checks the expiration of id_token
 */

var options = {
  redirectUrl: 'https://localhost:3000/auth/openid/return',
  clientID: 'f0b6e4eb-2d8c-40b6-b9c6-e26d1074846d',
  identityMetadata: 'https://login.microsoftonline.com/sijun1b2c.onmicrosoft.com/v2.0/.well-known/openid-configuration',
  responseType: 'id_token',
  responseMode: 'form_post',
  validateIssuer: true,
  passReqToCallback: false,
  isB2C: true,
  sessionKey: 'my_key',
  ignoreExpiration: true,
  issuer: 'https://login.microsoftonline.com/22bf40c6-1186-4ea5-b49b-3dc4ec0f54eb/v2.0/',
};

var testStrategy = new OIDCStrategy(options, function(profile, done) {
    done(null, profile.oid);
});

/* 
 * Begin the testing
 */
var challenge;
var user;

var setIgnoreExpirationFalse = function(options) { options.ignoreExpiration = false; };
var setWrongIssuer = function(options) { options.issuer = 'wrong_issuer'; };
var rmValidateIssuer = function(options) { options.validateIssuer = undefined; };

var testPrepare = function(id_token_to_use, nonce_to_use, policy_to_use, action) {
  return function(done) {
    // Mock `setOptions` 
    testStrategy.setOptions = function(params, oauthConfig, optionsToValidate, done) {
      params.metadata.generateOidcPEM = () => { return PEMkey; };

      oauthConfig.authorization_endpoint = 'https://login.microsoftonline.com/sijun1b2c.onmicrosoft.com/oauth2/v2.0/authorize?p=b2c_1_signin';
      oauthConfig.token_endpoint = 'https://login.microsoftonline.com/sijun1b2c.onmicrosoft.com/oauth2/v2.0/token?p=b2c_1_signin';

      optionsToValidate.validateIssuer = true;
      optionsToValidate.issuer = 'https://login.microsoftonline.com/22bf40c6-1186-4ea5-b49b-3dc4ec0f54eb/v2.0/';
      optionsToValidate.audience = 'f0b6e4eb-2d8c-40b6-b9c6-e26d1074846d';
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
        req.session = {'my_key': {'content': [{'state': 'my_state', 'nonce': nonce_to_use, 'policy': policy_to_use, 'timeStamp': time}]}};
        // add id_token and state to body
        req.body = {'id_token': id_token_to_use, 'state' : 'my_state'}; 
        // empty query
        req.query = {};
      })
      .authenticate({});
  };
};

describe('B2C OIDCStrategy implicit flow test', function() {
  this.timeout(TEST_TIMEOUT);

  describe('should succeed without expiration checking', function() {
    before(testPrepare(id_token, nonce, policy));

    it('should succeed with expected user', function() {
      chai.expect(user).to.equal('4329d6bc-0f84-45d8-8709-2c8b091357d1');
    });
  });

  describe('should fail for id_token with invalid signature', function() {
    before(testPrepare(id_token_wrong_signature, nonce, policy));

    it('should fail', function() {
      chai.expect(challenge).to.equal('In _validateResponse: invalid signature');
    });
  });

  describe('should fail for id_token with wrong nonce', function() {
    before(testPrepare(id_token, 'wrong_nonce', policy));

    it('should fail', function() {
      chai.expect(challenge).to.equal('In _validateResponse: invalid nonce');
    });
  });

  describe('should fail with id_token expiration checking', function() {
    before(testPrepare(id_token, nonce, policy, [setIgnoreExpirationFalse]));

    it('should fail', function() {
      chai.expect(challenge).to.equal('In _validateResponse: jwt is expired');
    });
  });

  describe('should fail with wrong issuer', function() {
    // we check the issuer by default
    before(testPrepare(id_token, nonce, policy, [setWrongIssuer]));

    it('should fail', function() {
      chai.expect(challenge).to.equal('In _validateResponse: jwt issuer is invalid');
    });
  });

  describe('should fail with wrong issuer with default value of validateIssuer', function() {
    // for non-common endpoint, we force to validate issuer
    before(testPrepare(id_token, nonce, policy, [rmValidateIssuer, setWrongIssuer]));

    it('should fail', function() {
      chai.expect(challenge).to.equal('In _validateResponse: jwt issuer is invalid');
    });
  });

  describe('should fail with wrong policy', function() {
    // for non-common endpoint, we force to validate issuer
    before(testPrepare(id_token, nonce, 'wrong policy'));

    it('should fail', function() {
      chai.expect(challenge).to.equal('In _validateResponse: policy in id_token does not match the policy used');
    });
  });
});

