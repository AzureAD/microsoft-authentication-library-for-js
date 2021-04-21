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
  identityMetadata: 'https://login.microsoftonline.com/common/.well-known/openid-configuration',
  responseType: 'id_token',
  responseMode: 'form_post',
  validateIssuer: true,
  passReqToCallback: false,
  loggingNoPII: false,
  sessionKey: 'my_key'    //optional sessionKey
};

describe('OIDCStrategy dynamic tenant test', function() {
  this.timeout(TEST_TIMEOUT);

  var redirectUrl;
  var challenge;
  var request;

  var testPrepare = function(validateIssuer, issuer, tenantIdOrName, isB2C, policy) {
    return function(done) {
      options.validateIssuer = validateIssuer;
      options.issuer = issuer;
      options.isB2C = isB2C;

      var testStrategy = new OIDCStrategy(options, function(profile, done) {});

      chai.passport
        .use(testStrategy)
        .redirect(function(u) {redirectUrl = u; done(); })
        .fail(function(c) {challenge = c; done(); })
        .req(function(req) {
          request = req;
          req.session = {}; 
          req.query = {}; 
          challenge = null;
        })
       .authenticate({ tenantIdOrName: tenantIdOrName });
    };
  };

  describe('should succeed', function() {
    before(testPrepare(true, null, 'sijun.onmicrosoft.com', false));

    it('should have replaced common with tenantIdOrName and saved tenantIdOrName in session', function() {
      var u = url.parse(redirectUrl, true);
      chai.expect(request.session['my_key']['content'][0]['tenantIdOrName']).to.equal('sijun.onmicrosoft.com');
      chai.expect(u.pathname).to.equal('/268da1a1-9db4-48b9-b1fe-683250ba90cc/oauth2/authorize');
    });
  });

  describe('should fail without issuer and tenantIdOrName for common endpoint', function() {
    before(testPrepare(true, null, '', false));

    it('should fail with invalid tenant name', function() {
      chai.expect(challenge).to.equal('In collectInfoFromReq: issuer or tenantIdOrName must be provided in order to validate issuer on common endpoint');
    });
  });

  describe('should fail with invalid tenant name', function() {
    before(testPrepare(true, null, 'xxx', false));

    it('should have replaced common with tenantIdOrName and saved tenantIdOrName in session', function() {
      console.log(challenge);
      chai.expect(challenge.startsWith('Error: 400')).to.equal(true);
    });
  });
});

describe('OIDCStrategy dynamic B2C tenant test', function() {
  this.timeout(TEST_TIMEOUT);
  
  var redirectUrl;
  var challenge;
  var request;

  var testPrepare = function(validateIssuer, issuer, tenantIdOrName) {
    return function(done) {
      options.validateIssuer = validateIssuer;
      options.issuer = issuer;
      options.isB2C = true;
      options.identityMetadata = 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration';

      var testStrategy = new OIDCStrategy(options, function(profile, done) {});

      chai.passport
        .use(testStrategy)
        .redirect(function(u) { redirectUrl = u; done(); })
        .fail(function(c) {challenge = c; done(); })
        .req(function(req) {
          request = req;
          req.session = {}; 
          req.query = { p: 'b2c_1_signin' }; 
          challenge = null;
        })
        .authenticate({ tenantIdOrName: tenantIdOrName });
    };
  };

  describe('should fail without tenantIdOrName for using B2C common endpoint', function() {
    before(testPrepare(true, ['my_issuer'], '', true));

    it('should fail with invalid tenant name', function() {
      chai.expect(challenge).to.equal('In collectInfoFromReq: we are using common endpoint for B2C but tenantIdOrName is not provided');
    });
  });
});

