/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
 
 /* eslint-disable no-new */

 'use restrict';

var chai = require('chai');
var url = require('url');
var OIDCStrategy = require('../../lib/index').OIDCStrategy;

chai.use(require('chai-passport-strategy'));

const TEST_TIMEOUT = 1000000; // 1000 seconds

// Mock options required to create a OIDC strategy
var options = {
    redirectUrl: 'https://returnURL',
    clientID: 'my_client_id',
    clientSecret: 'my_client_secret',
    identityMetadata: 'https://login.microsoftonline.com/xxx.onmicrosoft.com/v2.0/.well-known/openid-configuration',
    responseType: 'id_token',
    responseMode: 'form_post',
    validateIssuer: true,
    passReqToCallback: false,
    isB2C: true,
    loggingNoPII: false,
    sessionKey: 'my_key'    //optional sessionKey
};

var testStrategy = new OIDCStrategy(options, function(profile, done) {});

// Mock `setOptions`
testStrategy.setOptions = function(params, oauthConfig, optionsToValidate, done) {
  oauthConfig.authorization_endpoint = 'https://login.microsoftonline.com/sijun1b2c.onmicrosoft.com/oauth2/v2.0/authorize?p=b2c_1_signin';
  oauthConfig.token_endpoint = 'https://login.microsoftonline.com/sijun1b2c.onmicrosoft.com/oauth2/v2.0/token?p=b2c_1_signin';

  done();
};


describe('OIDCStrategy incoming state and nonce checking', function() {
  this.timeout(TEST_TIMEOUT);

  var redirectUrl;
  var request;
  var challenge;

  var testPrepare = function(policy) {
  	return function(done) {
  		chai.passport
  		  .use(testStrategy)
        .fail(function(c) { challenge = c; done(); })
        .redirect(function(u) {redirectUrl = u; done(); })
  		  .req(function(req) {
          request = req;
          req.session = {}; 
          req.query = {p: policy}; 
        })
  		  .authenticate({});
  	};
  };

  describe('state/nonce/policy checking', function() {
    before(testPrepare('B2C_1_signin'));

    it('should have the same state/nonce/policy', function() {
      var u = url.parse(redirectUrl, true);
      chai.expect(request.session['my_key']['content'][0]['state']).to.equal(u.query.state);
      chai.expect(request.session['my_key']['content'][0]['nonce']).to.equal(u.query.nonce);
      // policy should be changed to lower case
      chai.expect(request.session['my_key']['content'][0]['policy']).to.equal('b2c_1_signin');
    });
  });

  describe('missing policy', function() {
    before(testPrepare(null));

    it('should fail if policy is missing', function() {
      chai.expect(challenge).to.equal('In collectInfoFromReq: policy is missing');
    });
  });

  describe('wrong policy', function() {
    before(testPrepare('wrong_policy_not_starting_with_b2c_1_'));

    it('should fail if policy is wrong', function() {
      chai.expect(challenge).to.equal('In _flowInitializationHandler: the given policy wrong_policy_not_starting_with_b2c_1_ given in the request is invalid');
    });
  });
});

describe('OIDCStrategy error flow checking', function() {
  this.timeout(TEST_TIMEOUT);

  var challenge;

  var testPrepare = function() {
    return function(done) {
      chai.passport
        .use(testStrategy)
        .fail(function(c) { challenge = c; done(); })
        .req(function(req) {
          var time = Date.now();
          req.session = {'my_key': {'content': [{'state': 'my_state', 'nonce': 'my_nonce', 'policy': 'b2c_1_signin', 'timeStamp': time}]}}; 
          req.query = {}; 
          req.body = {state: 'my_state', error: 'my_error'};
        })
        .authenticate({});
    };
  };

  describe('error checking', function() {
    before(testPrepare());

    it('should have the same error', function() {
      chai.expect(challenge).to.equal('my_error');
    });
  });
});

describe('OIDCStrategy token in request checking', function() {
  this.timeout(TEST_TIMEOUT);
  
  var challenge;

  var testPrepare = function(access_token, refresh_token, query_or_body) {
    return function(done) {
      chai.passport
        .use(testStrategy)
        .fail(function(c) {
          challenge = c; done();
        })
        .req(function(req) {
          req.query = {};
          
          if (query_or_body == 'query')
            req.query = {'access_token' : access_token, 'refresh_token' : refresh_token};
          else if (query_or_body == 'body')
            req.body = {'access_token' : access_token, 'refresh_token' : refresh_token};
        })
        .authenticate({});
    };
  };

  describe('access_token in query', function() {
    before(testPrepare('my_access_token', null, 'query'));

    it('should fail', function() {
      chai.expect(challenge).to.equal('In collectInfoFromReq: neither access token nor refresh token is expected in the incoming request');
    });
  });
  describe('access_token in body', function() {
    before(testPrepare('my_access_token', null, 'body'));

    it('should fail', function() {
      chai.expect(challenge).to.equal('In collectInfoFromReq: neither access token nor refresh token is expected in the incoming request');
    });
  });
  describe('refresh_token in query', function() {
    before(testPrepare('my_refresh_token', null, 'query'));

    it('should fail', function() {
      chai.expect(challenge).to.equal('In collectInfoFromReq: neither access token nor refresh token is expected in the incoming request');
    });
  });
  describe('refresh_token in body', function() {
    before(testPrepare('my_refresh_token', null, 'body'));

    it('should fail', function() {
      chai.expect(challenge).to.equal('In collectInfoFromReq: neither access token nor refresh token is expected in the incoming request');
    });
  });
});
