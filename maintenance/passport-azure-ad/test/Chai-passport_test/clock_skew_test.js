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
var BearerStrategy = require('../../lib/index').BearerStrategy;
var CONSTANTS = require('../../lib/constants');

chai.use(require('chai-passport-strategy'));

const TEST_TIMEOUT = 1000000; // 1000 seconds

var OIDC_options = {
  redirectUrl: 'https://returnURL',
  clientID: 'my_client_id',
  clientSecret: 'my_client_secret',
  identityMetadata: 'https://login.microsoftonline.com/xxx.onmicrosoft.com/.well-known/openid-configuration',
  responseType: 'id_token',
  responseMode: 'form_post',
  validateIssuer: true,
  passReqToCallback: false,
};

var Bearer_options = {
  identityMetadata: 'https://login.microsoftonline.com/xxx.onmicrosoft.com/.well-known/openid-configuration',
  clientID: 'my_client_id',
  validateIssuer: true,
  passReqToCallback: false,
  ignoreExpiration: true,
};

describe('OIDCStrategy clock skew test', function() {
  this.timeout(TEST_TIMEOUT);

  it('should have the default clock skew if none is given', function(done) {
    var testStrategy = new OIDCStrategy(OIDC_options, function(profile, done) {});
    chai.expect(testStrategy._options.clockSkew).to.equal(CONSTANTS.CLOCK_SKEW);
    done();
  });

  it('should have the given clock skew', function(done) {
    OIDC_options.clockSkew = 123;
    var testStrategy = new OIDCStrategy(OIDC_options, function(profile, done) {});
    chai.expect(testStrategy._options.clockSkew).to.equal(123);
    done();
  });

  it('should throw with negative clock skew', function(done) {
    OIDC_options.clockSkew = -123;
    chai.expect(() => {
      new OIDCStrategy(OIDC_options, function(profile, done) {});
    }).to.throw('clockSkew must be a positive integer');
    done();
  });  

  it('should throw with non-integer clock skew', function(done) {
    OIDC_options.clockSkew = 1.23;
    chai.expect(() => {
      new OIDCStrategy(OIDC_options, function(profile, done) {});
    }).to.throw('clockSkew must be a positive integer');
    done();
  }); 
});

describe('BearerStrategy clock skew test', function() {
  this.timeout(TEST_TIMEOUT);
  
  it('should have the default clock skew if none is given', function(done) {
    var testStrategy = new BearerStrategy(Bearer_options, function(profile, done) {});
    chai.expect(testStrategy._options.clockSkew).to.equal(CONSTANTS.CLOCK_SKEW);
    done();
  });

  it('should have the given clock skew', function(done) {
    Bearer_options.clockSkew = 123;
    var testStrategy = new BearerStrategy(Bearer_options, function(profile, done) {});
    chai.expect(testStrategy._options.clockSkew).to.equal(123);
    done();
  });

  it('should throw with negative clock skew', function(done) {
    Bearer_options.clockSkew = -123;
    chai.expect(() => {
      new BearerStrategy(Bearer_options, function(profile, done) {});
    }).to.throw('clockSkew must be a positive integer');
    done();
  });  

  it('should throw with non-integer clock skew', function(done) {
    Bearer_options.clockSkew = 1.23;
    chai.expect(() => {
      new BearerStrategy(Bearer_options, function(profile, done) {});
    }).to.throw('clockSkew must be a positive integer');
    done();
  });   
});

