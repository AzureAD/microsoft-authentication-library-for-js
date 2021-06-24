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
var OAuth2 = require('../../node_modules/oauth/index').OAuth2;

var policy = 'b2c_1_signin';
var nonce = 'ZM8YX2HCyFn5dVt4QGCtJQbZ80HXos/d';
var code = 'eyJraWQiOiJjcGltY29yZV8wOTI1MjAxNSIsInZlciI6IjEuMCJ9..VfaAWsCy4rLngAGI.5rNBuyfrDQ2YpKmzllJzgLxYH5he-AIkrT9Z2LwTdYZ8QyzkzReYc2b0OtoBx0b8aAHR3N6ayRC_t_luSFvwcuRmGoE_4EAEBsd0jESsEIxhypMsiae9Iuyc7QBunm1upOhjD4nT1DaxhJ3H4rOZmBJr-NVWiUBnuMaS-kZkpiZBM56GOwvqAYfddC0JF14lyJJMuK-Vg8IgpyU_1KEjVRpNR0Q886kra8NU8VO0lEOCcuAfGt8B4NPxIywSV6KAgePrmrJd_xom7PoQN2o5yluY8KWou7le7mV2HecJhkGcnf7aAfUima09J3-NBg7jCi0pqywO7TM5BN3MRddLVUIrjTvA6JZHOcr-xAums34L4IW0j2E_GCh4VZDwHZFZgZYXnnbjH_u4p4SFJkUF28bnGOj1BW2wN4KiFhkRsboFuOu3NgNxkNvCJZH-ezHPTIKFzjRRhqrNrfmoa30RRpcZyorHe67X3hC6WSfRFsYh4aYf5CyGMhS0WfWWAxZoty50QgPZ5_395JWVPMCOtmSrH5PH7OOA516OSD7H2TZH3tRdLuM0WYQv-3FQ_2hquZ6rQ6FYbhrDflsApQ-ehbYQZuIqBZikRFLcOxROim6WP5purWJnCDU7cHQBIarc5v576jO1pSRCoqqTYB3A24vzax0IxCjtZZF9qbQQHjeS8u4nHY3jys7JgFWgMiPQzhQMk_NaDZA0qJ_PDAhrhwvZQKTLWumgj1LrNVp6SE4ua61ylL_-lAl2Kq4w5n2vKUEPfl-AzLH8QgnpTbcaU0kR0xxK0Z9baXU0pobqSaT4etg1dMMnwjPY-BZ9ehagBv_kdEa3fgWW0F4Otry2__8O9buzxi3N_cS8ni3PTFGr74vWqw6YOUMw4tnE2RrOmQVV_Amg_NJrFoZkxuv4YsK8SzlRLDn0QYt-fy7rx-vTFajCtISybX1JpGSiXUqr2AECyrMNyIQPrOa9ONvmmIs_8h0uH4vBjg5C0IoN95lh8eGULg3Gb6nGwBTbOtWWFASy4F-1vLXucoE8YycvA46BHxIZJY_DWpHuii8ZHgW2amVlwtinpX7Td9NNOKG8vvlHrp32h99X73HW8-lDE2q2Pc3xqS-W87Dp-qAxRJPWvEvgy9do5kYUfnWdVA34vNM_QkFf4Rz-j0-XbWJjJmYFKjgtM5BPN-m7HjG3fRSkwlbs3SDzUsQNI9tRrr4gZLqDqG60xIIlLv6qNMUDPaqPG8wJRZMpYqq2Iu4nHlMSjlBDnYnoAQIAjoPf5RmdRiCJ4I_Xw44nQhZbM6t_926g5eG0PxxBDDn9EJZoh9pwNtj9Zins3CwwhWQ5WhvUk3ovrMrR1ENc0ASAQhBqS4q-a3a2p6-KWLBeBfu1aHYU54RJOPW41W7ZMc_c99DMv_ZLmmLleB6bKUWP3f1YJN6QLjfdE02EywAqpo9IUKMYSUfr1rKvjVgRQ4vmJWrp-SWy3gb1UD8-70qipRANcj1MYWm8DP06FJTeoWsrICJzFZa_oVoMlQ.82nvGkWwz3SouZQJAvwong';
var id_token_in_auth_resp = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IklkVG9rZW5TaWduaW5nS2V5Q29udGFpbmVyLnYyIn0.eyJleHAiOjE0NzU3OTg4MTIsIm5iZiI6MTQ3NTc5NTIxMiwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5taWNyb3NvZnRvbmxpbmUuY29tLzIyYmY0MGM2LTExODYtNGVhNS1iNDliLTNkYzRlYzBmNTRlYi92Mi4wLyIsInN1YiI6Ik5vdCBzdXBwb3J0ZWQgY3VycmVudGx5LiBVc2Ugb2lkIGNsYWltLiIsImF1ZCI6ImYwYjZlNGViLTJkOGMtNDBiNi1iOWM2LWUyNmQxMDc0ODQ2ZCIsImFjciI6ImIyY18xX3NpZ25pbiIsIm5vbmNlIjoiWk04WVgySEN5Rm41ZFZ0NFFHQ3RKUWJaODBIWG9zL2QiLCJpYXQiOjE0NzU3OTUyMTIsImF1dGhfdGltZSI6MTQ3NTc5NTIxMiwib2lkIjoiNDMyOWQ2YmMtMGY4NC00NWQ4LTg3MDktMmM4YjA5MTM1N2QxIiwiZW1haWxzIjpbInNpanVuLndvcmtAZ21haWwuY29tIl0sImNfaGFzaCI6IlktSjdicmlnQ0ZTSVFQamhueHZHS3cifQ.nRiBhEHTElwxvejy_0yy6r8gptG1xhuAHkxOlJ02zuhkKvx3MDGn07yIMkMkhC139N4oL0QbcJ4dvRTbe0y3mzNd5cKtMmK9iHoMB3O9t9VStu0J8R5zsrKBk8ZjhScLvub-WwgYocniD_axhoFJ4FAAjpkQTN97kzojAlEmeosNBfWo3JrvvpOpGt_clbGTIGDx-TsqArryPJE96ZEXQy0htN5EYj-zrz4ptSyqQqRIZVitY0DvdvUNIa04i0SGGPmSUYoIpb96nu9LI7Vp7GPgO1XSXLtAag6HXMoU7IrUetMDMXLpf-4T7yknSIwsyf-C-YkQJnuVAQkP3hPDvg';
var id_token_in_auth_resp_wrong_signature = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IklkVG9rZW5TaWduaW5nS2V5Q29udGFpbmVyLnYyIn0.eyJleHAiOjE0NzU3OTg4MTIsIm5iZiI6MTQ3NTc5NTIxMiwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5taWNyb3NvZnRvbmxpbmUuY29tLzIyYmY0MGM2LTExODYtNGVhNS1iNDliLTNkYzRlYzBmNTRlYi92Mi4wLyIsInN1YiI6Ik5vdCBzdXBwb3J0ZWQgY3VycmVudGx5LiBVc2Ugb2lkIGNsYWltLiIsImF1ZCI6ImYwYjZlNGViLTJkOGMtNDBiNi1iOWM2LWUyNmQxMDc0ODQ2ZCIsImFjciI6ImIyY18xX3NpZ25pbiIsIm5vbmNlIjoiWk04WVgySEN5Rm41ZFZ0NFFHQ3RKUWJaODBIWG9zL2QiLCJpYXQiOjE0NzU3OTUyMTIsImF1dGhfdGltZSI6MTQ3NTc5NTIxMiwib2lkIjoiNDMyOWQ2YmMtMGY4NC00NWQ4LTg3MDktMmM4YjA5MTM1N2QxIiwiZW1haWxzIjpbInNpanVuLndvcmtAZ21haWwuY29tIl0sImNfaGFzaCI6IlktSjdicmlnQ0ZTSVFQamhueHZHS3cifQ.nRiBhEHTElwxvejy_0yy6r8gptG1xhuAHkxOlJ02zuhkKvx3MDGn07yIMkMkhC139N4oL0QbcJ4dvRTbe0y3mzNd5cKtMmK9iHoMB3O9t9VStu0J8R5zsrKBk8ZjhScLvub-WwgYocniD_axhoFJ4FAAjpkQTN97kzojAlEmeosNBfWo3JrvvpOpGt_clbGTIGDx-TsqArryPJE96ZEXQy0htN5EYj-zrz4ptSyqQqRIZVitY0DvdvUNIa04i0SGGPmSUYoIpb96nu9LI7Vp7GPgO1XSXLtAag6HXMoU7IrUetMDMXLpf-4T7yknSIwsyf-C-YkQJnuVAQkP3hPDvG';
var id_token_in_token_resp = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IklkVG9rZW5TaWduaW5nS2V5Q29udGFpbmVyLnYyIn0.eyJleHAiOjE0NzU3OTg4MTUsIm5iZiI6MTQ3NTc5NTIxNSwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5taWNyb3NvZnRvbmxpbmUuY29tLzIyYmY0MGM2LTExODYtNGVhNS1iNDliLTNkYzRlYzBmNTRlYi92Mi4wLyIsInN1YiI6Ik5vdCBzdXBwb3J0ZWQgY3VycmVudGx5LiBVc2Ugb2lkIGNsYWltLiIsImF1ZCI6ImYwYjZlNGViLTJkOGMtNDBiNi1iOWM2LWUyNmQxMDc0ODQ2ZCIsImFjciI6ImIyY18xX3NpZ25pbiIsIm5vbmNlIjoiWk04WVgySEN5Rm41ZFZ0NFFHQ3RKUWJaODBIWG9zL2QiLCJpYXQiOjE0NzU3OTUyMTUsImF1dGhfdGltZSI6MTQ3NTc5NTIxNSwib2lkIjoiNDMyOWQ2YmMtMGY4NC00NWQ4LTg3MDktMmM4YjA5MTM1N2QxIiwiZW1haWxzIjpbInNpanVuLndvcmtAZ21haWwuY29tIl0sImF0X2hhc2giOiJhRjVGV21DX1NlTGZ3VW5RQjZkbjRRIn0.Tm1sk9WKx6TbMxsCY0DFpqk8qIj9YgQLGCILvmFCeEaJwHOp85BVkfzcihSEzml1yqrH1dPLee2A3s22j9Si-sKSvq1VE9WpfXhvRuwP17snUc6vPn3ZESet47MowQMiY0uvVvvCg0vNCBaSgJSc58DxMZv6L_717Ysuuj5uUsh9sGuEpybo8tvKEPVsO2F7_R2t-8kM38XN4mUsvPUtBZhUHdu7bZ0jRcao5d3lAI_ZkgRCIgOfV9-Yu8A9Yj485HjENKZKmxTLg14__KSy6kfBVIbeH2DAYGZswo-ACGQpznCP47yE87zjWa5HSuKdrA7Iy7wwYu8ZFdGqUliTKg';
var access_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IklkVG9rZW5TaWduaW5nS2V5Q29udGFpbmVyLnYyIn0.eyJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vMjJiZjQwYzYtMTE4Ni00ZWE1LWI0OWItM2RjNGVjMGY1NGViL3YyLjAvIiwiZXhwIjoxNDc1Nzk4ODE1LCJuYmYiOjE0NzU3OTUyMTUsImF1ZCI6ImYwYjZlNGViLTJkOGMtNDBiNi1iOWM2LWUyNmQxMDc0ODQ2ZCIsIm9pZCI6IjQzMjlkNmJjLTBmODQtNDVkOC04NzA5LTJjOGIwOTEzNTdkMSIsInN1YiI6Ik5vdCBzdXBwb3J0ZWQgY3VycmVudGx5LiBVc2Ugb2lkIGNsYWltLiIsImVtYWlscyI6WyJzaWp1bi53b3JrQGdtYWlsLmNvbSJdLCJub25jZSI6IlpNOFlYMkhDeUZuNWRWdDRRR0N0SlFiWjgwSFhvcy9kIiwidmVyIjoiMS4wIn0.R4-nKaHb8GfvA1patSkVAfl3FqRw_-JPLzzktGfmQ8Fc0x9dIVMQovHleOMM2B4Y-jpyRWd-aCQ3g0GVldGJcPL2IiO0qj3jggZOKOn94hG85zUjFruc8LoT_qtkezhIk7_OOSUgbp-YZ-0URkP2OHnNM6Fzo8mfqOHQGdyGVzcTb-CERrFQdKFua6Br7Z8xqEEr0N3BVE12kA73uja3P9E_QB_hFlR-egDEoVgJ2mqYhSjPlMcB3D85tvMe3Wujx0qUNN8xQB6oVbp1aahD5swIkRaL3jvmc7uNjPsStSkTbcyg4g6ygh14TZ3JdnZ3zR5dUQjPdX7fkmiI3KCQHg';

var PEMkey = "-----BEGIN RSA PUBLIC KEY-----\n\
MIIBCgKCAQEAs4W7xjkQZP3OwG7PfRgcYKn8eRYXHiz1iK503fS+K2FZo+Ublwwa\n\
2xFZWpsUU/jtoVCwIkaqZuo6xoKtlMYXXvfVHGuKBHEBVn8b8x/57BQWz1d0KdrN\n\
XxuMvtFe6RzMqiMqzqZrzae4UqVCkYqcR9gQx66Ehq7hPmCxJCkg7ajo7fu6E7dP\n\
d34KH2HSYRsaaEA/BcKTeb9H1XE/qEKjog68wUU9Ekfl3FBIRN+1Ah/BoktGFoXy\n\
i/jt0+L0+gKcL1BLmUlGzMusvRbjI/0+qj+mc0utGdRjY+xIN2yBj8vl4DODO+wM\n\
wfp+cqZbCd9TENyHaTb8iA27s+73L3ExOQIDAQAB\n\
-----END RSA PUBLIC KEY-----\n";


/*
 * test strategy
 */

var options = {
  redirectUrl: 'https://localhost:3000/auth/openid/return',
  clientID: 'f0b6e4eb-2d8c-40b6-b9c6-e26d1074846d',
  clientSecret: 'secret',
  identityMetadata: 'https://login.microsoftonline.com/mytenant.onmicrosoft.com/v2.0/.well-known/openid-configuration',
  responseType: 'code id_token',
  responseMode: 'form_post',
  isB2C: true,
  validateIssuer: true,
  issuer: null,
  passReqToCallback: false,
  sessionKey: 'my_key',
};

// functions used to change the fields in options
var setIgnoreExpirationFalse = function(options) { options.ignoreExpiration = false; };
var setWrongIssuer = function(options) { options.issuer = 'wrong_issuer'; };
var setWrongAudience = function(options) { options.audience = 'wrong_audience'; };

var testStrategy = new OIDCStrategy(options, function(profile, done) {
    done(null, profile.oid);
});

// mock the token response we want when we consume the code
var setTokenResponse = function(id_token_in_token_resp, access_token_in_token_resp) {
  return () => {
    testStrategy._getAccessTokenBySecretOrAssertion = function(code, oauthConfig, next, callback) {
      var params = {
        'id_token': id_token_in_token_resp, 
        'token_type': 'Bearer',
        'access_token': access_token_in_token_resp,
        'refresh_token': null
      };
      callback(null, params);
    };
  };
};

// mock the token response we want when we consume the code, and use 'bearer' fpr token_type
var setTokenResponseWithLowerCaseBearer = function(id_token_in_token_resp, access_token_in_token_resp) {
  return () => {
    testStrategy._getAccessTokenBySecretOrAssertion = function(code, oauthConfig, next, callback) {
      var params = {
        'id_token': id_token_in_token_resp, 
        'token_type': 'Bearer',
        'access_token': access_token_in_token_resp,
        'refresh_token': null
      };
      callback(null, params);
    };
  };
};

// used to remember the error message in self.fail
var challenge;
// used to remember the 'user' when we successfully log in
var user;

// mock the request (resulting request from the 302 redirection response) by putting 
// id_token and code into the body, and state and nonce into the session
var setReqFromAuthRespRedirect = function(id_token_in_auth_resp, code_in_auth_resp, nonce_to_use, policy_to_use, action) {
  return function(done) {
    // Mock `setOptions` 
    testStrategy.setOptions = function(params, oauthConfig, optionsToValidate, done) {
      params.metadata.generateOidcPEM = () => { return PEMkey; };

      optionsToValidate.validateIssuer = true;
      optionsToValidate.issuer = 'https://login.microsoftonline.com/22bf40c6-1186-4ea5-b49b-3dc4ec0f54eb/v2.0/';
      optionsToValidate.audience = 'f0b6e4eb-2d8c-40b6-b9c6-e26d1074846d';
      optionsToValidate.allowMultiAudiencesInToken = false;
      optionsToValidate.ignoreExpiration = true;
      optionsToValidate.algorithms = ['RS256'];
      optionsToValidate.nonce = nonce_to_use;
      optionsToValidate.clockSkew = testStrategy._options.clockSkew;

      oauthConfig.authorization_endpoint = "https://login.microsoftonline.com/sijun1b2c.onmicrosoft.com/oauth2/v2.0/authorize?p=b2c_1_signin";
      oauthConfig.redirectUrl = "https://localhost:3000/auth/openid/return";
      oauthConfig.clientID = "f0b6e4eb-2d8c-40b6-b9c6-e26d1074846d";
      oauthConfig.token_endpoint = "https://login.microsoftonline.com/sijun1b2c.onmicrosoft.com/oauth2/v2.0/token?p=b2c_1_signin";

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
      .error(function(e) {
        done();
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
        req.body = {'id_token': id_token_in_auth_resp , 'code' : code_in_auth_resp, 'state' : 'my_state'}; 
        // empty query
        req.query = {};
      })
      .authenticate({});
  };
};


/* 
 * Begin the testing
 *
 */

describe('OIDCStrategy hybrid flow test', function() {
  this.timeout(TEST_TIMEOUT);

  /*
   * success if we ignore the expiration
   */

  describe('success', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp, code, nonce, policy, [setTokenResponse(id_token_in_token_resp, access_token)]));

    it('should succeed with expected user', function() {
      chai.expect(user).to.equal('4329d6bc-0f84-45d8-8709-2c8b091357d1');
    });
  });

  /*
   * test the incoming request with id_token and code, make sure test fail if
   * (1) wrong nonce
   * (2) invalid c_hash
   * (3) invalid policy
   * (4) id_token signature is invalid
   * (5) wrong issuer
   * (6) wrong audience
   */

  describe('fail: wrong nonce', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp, code, 'wrong_nonce', policy));

    it('should fail with wrong nonce', function() {
      chai.expect(challenge).to.equal('In _validateResponse: invalid nonce');
    });
  });

  describe('fail: invalid c_hash', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp, 'wrong_code', nonce, policy));

    it('should fail with invalid c_hash', function() {
      chai.expect(challenge).to.equal('In _validateResponse: invalid c_hash');
    });
  });

  describe('fail: expired id_token', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp, code, nonce, 'wrong_policy'));

    it('should fail with invalid policy', function() {
      chai.expect(challenge).to.equal('In _validateResponse: policy in id_token does not match the policy used');
    });
  });

  describe('fail: invalid signature in id_token', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp_wrong_signature, code, nonce, policy));

    it('should fail with invalid signature in id_token', function() {
      chai.expect(challenge).to.equal('In _validateResponse: invalid signature');
    });
  });

  describe('fail: invalid issuer', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp, code, nonce, policy, [setWrongIssuer]));

    it('should fail with invalid issuer', function() {
      chai.expect(challenge).to.equal('In _validateResponse: jwt issuer is invalid');
    });
  });

  describe('fail: invalid audience', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp, code, nonce, policy, [setWrongAudience]));

    it('should fail with invalid audience', function() {
      chai.expect(challenge).to.equal('In _validateResponse: jwt audience is invalid');
    });
  });

  /*
   * test the access_token, id_token received from code consumpution
   */

  describe('success', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp, code, nonce, policy,
      [setTokenResponseWithLowerCaseBearer(id_token_in_token_resp, access_token)]));

    it('should succeed with expected user', function() {
      chai.expect(user).to.equal('4329d6bc-0f84-45d8-8709-2c8b091357d1');
    });
  });

  describe('success', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp, code, nonce, policy,
      [setTokenResponse(id_token_in_token_resp, access_token)]));

    it('should succeed with expected user', function() {
      chai.expect(user).to.equal('4329d6bc-0f84-45d8-8709-2c8b091357d1');
    });
  });

  describe('fail: invalid at_hash', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp, code, nonce, policy,
      [setTokenResponse(id_token_in_token_resp, 'wrong_access_token')]));

    it('should succeed with expected user', function() {
      chai.expect(challenge).to.equal('In _validateResponse: invalid at_hash');
    });
  });
});

describe('OIDCStrategy authorization code flow test', function() {
  this.timeout(TEST_TIMEOUT);

  /*
   * success if we ignore the expiration
   */

  describe('success', function() {
    before(setReqFromAuthRespRedirect(null, code, nonce, policy,
      [setTokenResponse(id_token_in_token_resp, access_token)]));

    it('should succeed with expected user', function() {
      chai.expect(user).to.equal('4329d6bc-0f84-45d8-8709-2c8b091357d1');
    });
  });

  /*
   * test the incoming request with id_token and code, make sure test fail if
   * (1) wrong nonce
   * (2) id_token expired
   * (3) id_token signature is invalid
   * (4) wrong issuer
   * (5) wrong audience
   * (6) wrong policy
   */

  describe('fail: wrong nonce', function() {
    before(setReqFromAuthRespRedirect(null, code, 'wrong_nonce', policy));

    it('should fail with wrong nonce', function() {
      chai.expect(challenge).to.equal('In _validateResponse: invalid nonce');
    });
  });

  describe('fail: expired id_token', function() {
    before(setReqFromAuthRespRedirect(null, code, nonce, policy,
      [setIgnoreExpirationFalse]));

    it('should fail with expired id_token', function() {
      chai.expect(challenge).to.equal('In _validateResponse: jwt is expired');
    });
  });

  describe('fail: invalid issuer', function() {
    before(setReqFromAuthRespRedirect(null, code, nonce, policy,
      [setWrongIssuer]));

    it('should fail with invalid issuer', function() {
      chai.expect(challenge).to.equal('In _validateResponse: jwt issuer is invalid');
    });
  });

  describe('fail: invalid audience', function() {
    before(setReqFromAuthRespRedirect(null, code, nonce, policy,
      [setWrongAudience]));

    it('should fail with invalid audience', function() {
      chai.expect(challenge).to.equal('In _validateResponse: jwt audience is invalid');
    });
  });

  describe('fail: invalid policy', function() {
    before(setReqFromAuthRespRedirect(null, code, nonce, 'wrong_policy'));

    it('should fail with invalid policy', function() {
      chai.expect(challenge).to.equal('In _validateResponse: policy in id_token does not match the policy used');
    });
  });

  describe('fail: invalid signature in id_token', function() {
    before(setReqFromAuthRespRedirect(null, code, nonce, policy,
      [setTokenResponse(id_token_in_auth_resp_wrong_signature, access_token)]));

    it('should fail with invalid signature in id_token', function() {
      chai.expect(challenge).to.equal('In _validateResponse: invalid signature');
    });
  });

  /*
   * test the access_token, id_token received from code consumpution
   */

  describe('success', function() {
    before(setReqFromAuthRespRedirect(null, code, nonce, policy,
      [setTokenResponse(id_token_in_token_resp, access_token)]));

    it('should succeed with expected user', function() {
      chai.expect(user).to.equal('4329d6bc-0f84-45d8-8709-2c8b091357d1');
    });
  });

  describe('fail: invalid at_hash', function() {
    before(setReqFromAuthRespRedirect(null, code, nonce, policy,
      [setTokenResponse(id_token_in_token_resp, 'wrong_access_token')]));

    it('should succeed with expected user', function() {
      chai.expect(challenge).to.equal('In _validateResponse: invalid at_hash');
    });
  });
});
