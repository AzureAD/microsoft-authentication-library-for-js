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
    identityMetadata: 'https://login.microsoftonline.com/xxx.onmicrosoft.com/.well-known/openid-configuration',
    responseType: 'id_token',
    responseMode: 'form_post',
    validateIssuer: true,
    passReqToCallback: false,
    algorithms: ['RS256'],
    sessionKey: 'my_key'    //optional sessionKey
};

var testStrategy = new OIDCStrategy(options, function(profile, done) {});

// Mock `setOptions`
testStrategy.setOptions = function(params, oauthConfig, optionsToValidate, done) {
  oauthConfig.clientID = options.clientID;
  oauthConfig.clientSecret = options.clientSecret;
  oauthConfig.authorizationURL = 'https://www.example.com/authorizationURL';
  oauthConfig.tokenURL = 'https://www.example.com/tokenURL';

  done();
};


describe('OIDCStrategy incoming state and nonce checking', function() {
  this.timeout(TEST_TIMEOUT);

  var redirectUrl;
  var request;

  var testPrepare = function(customState) {
  	return function(done) {
  		chai.passport
  		  .use(testStrategy)
        .redirect(function(u) {redirectUrl = u; done(); })
  		  .req(function(req) {
          request = req;
          req.session = {}; 
          req.query = {}; 
        })
  		  .authenticate({ customState : customState });
  	};
  };

  describe('state/nonce checking', function() {
    before(testPrepare());

    it('should have the same state/nonce', function() {
      var u = url.parse(redirectUrl, true);
      chai.expect(request.session['my_key']['content'][0]['state']).to.equal(u.query.state);
      chai.expect(request.session['my_key']['content'][0]['nonce']).to.equal(u.query.nonce);
    });
  });

  describe('custom state checking', function() {
    before(testPrepare('custom_state'));

    it('should have used custom state', function() {
      var u = url.parse(redirectUrl, true);
      chai.expect(request.session['my_key']['content'][0]['state']).to.equal(u.query.state);
      chai.expect(request.session['my_key']['content'][0]['state'].substring(38)).to.equal('custom_state');
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
          req.session = {'my_key': {'content': [{'state': 'my_state', 'timeStamp': time}]}}; 
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
