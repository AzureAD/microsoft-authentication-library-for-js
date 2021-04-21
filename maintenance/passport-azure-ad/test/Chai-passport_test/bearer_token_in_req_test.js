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

'use strict';

var chai = require('chai');
chai.use(require('chai-passport-strategy'));
var BearerStrategy = require('../../lib/index').BearerStrategy;

const TEST_TIMEOUT = 1000000; // 1000 seconds

var options = {
  identityMetadata: 'https://login.microsoftonline.com/xxx.onmicrosoft.com/.well-known/openid-configuration', 
  clientID: 'spn:6514a8ca-d9e4-4155-b292-65258398f3aa',
  validateIssuer: true,
  passReqToCallback: false,
  loggingNoPII: false
};

var strategy = new BearerStrategy(options, function(token, done) {
  if (token === 'good_token')
    return done(null, {id: 'Mr noname'}, 'authentication successful');
  return done(null, false, 'access token is invalid');
});

strategy.jwtVerify = function(req, token, metadata, optionsToValidate, done) { this._verify(token, done); };

strategy.loadMetadata = function(params, next) {
  var metadata = {oidc: {issuer: 'https://sts.windows.net/268da1a1-9db4-48b9-b1fe-683250ba90cc/', algorithms: ['RS256']}};
  return next(null, metadata);
};

describe('token mock test', function() {
  this.timeout(TEST_TIMEOUT);

  var challenge = '';
  var success_user = '';
  var success_info = '';

  var beforeFunc = function(token, in_header, in_body, in_query, bad_header, lowercase_bearer) {
    return function(done) {
      chai.passport
        .use(strategy)
        .fail(function(c) { 
          challenge = c; done();
        })
        .req(function(req) {
          if (token && in_header) {
            if (bad_header)
              req.headers.authorization = token; // missing 'Bearer'
            else if (lowercase_bearer)
              req.headers.authorization = 'bearer ' + token;
            else
              req.headers.authorization = 'Bearer ' + token;
          }
          if (token && in_query) {
            req.query = {};
            req.query.access_token = token;
          }
          if (token && in_body) {
            req.body = {};
            req.body.access_token = token;
          }

          // reset
          challenge = success_user = success_info = '';
        })
        .success(function(user, info) { 
          success_user = user.id; 
          success_info = info; 
          done();
        })
        .authenticate();
    };
  };

  describe('should fail with no token', function() {
    before(beforeFunc());

    it('should fail with challenge', function() {
      chai.expect(challenge).to.be.a.string;
      chai.expect(challenge).to.equal('token is not found');
    })
  });

  describe('should fail with invalid token', function() {
    before(beforeFunc('invalid_token', true));

    it('should fail with challenge', function() {
      chai.expect(challenge).to.be.a.string;
      chai.expect(challenge).to.equal('error: invalid_token, error description: access token is invalid');
    });
  });

  describe('should succeed with good token in header', function() {
    before(beforeFunc('good_token', true));

    it('should succeed', function() {
      chai.expect(success_user).to.equal('Mr noname');
      chai.expect(success_info).to.equal('authentication successful');
    });
  });

  describe('should succeed with good token in body', function() {
    before(beforeFunc('good_token', false, true));

    it('should succeed', function() {
      chai.expect(success_user).to.equal('Mr noname');
      chai.expect(success_info).to.equal('authentication successful');
    });
  });

  describe('should fail with token passed in query', function() {
    before(beforeFunc('good_token', false, false, true));

    it('should fail', function() {
      chai.expect(challenge).to.equal('In Strategy.prototype.authenticate: access_token should be passed in request header or body. query is unsupported');
    });
  });

  describe('should fail with token passed in both header and body', function() {
    before(beforeFunc('good_token', true, true, false));

    it('should fail', function() {
      chai.expect(challenge).to.equal('In Strategy.prototype.authenticate: access_token cannot be passed in both request header and body');
    });
  });

  describe('should fail with bad header', function() {
    before(beforeFunc('good_token', true, false, false, true));

    it('should fail', function() {
      chai.expect(challenge).to.equal('token is not found');
    });
  });

  describe('should succeed with lower case bearer', function() {
    before(beforeFunc('good_token', true, false, false, false, true));

    it('should succeed', function() {
      chai.expect(success_user).to.equal('Mr noname');
      chai.expect(success_info).to.equal('authentication successful');
    });
  });
});


