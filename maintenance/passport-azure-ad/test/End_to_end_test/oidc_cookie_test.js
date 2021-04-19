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

/******************************************************************************
 *  Testing tools setup
 *****************************************************************************/

var chromedriver = require('./driver');
var service = chromedriver.get_service();
var webdriver = chromedriver.webdriver;
var By = webdriver.By;
var until = webdriver.until;
var base64url = require('base64url');

var chai = require('chai');
var expect = chai.expect;

const TEST_TIMEOUT = 500000; // 500 seconds
const LOGIN_WAITING_TIME = 1000; // 1 second

/******************************************************************************
 *  configurations needed
 *****************************************************************************/

var driver;
var server;

var code_config = {
  identityMetadata: 'https://testingsts.azurewebsites.net/.well-known/openid-configuration', 
  //identityMetadata: 'http://localhost:8081/.well-known/openid-configuration',
  clientID: 'client-001',
  responseType: 'code', 
  responseMode: 'form_post', 
  redirectUrl: 'http://localhost:3000/auth/openid/return', 
  allowHttpForRedirectUrl: true,
  allowMultiAudiencesInToken: true,
  clientSecret: 'secret-001', 
  validateIssuer: true,
  passReqToCallback: false,
  scope: null,
  loggingLevel: null,
  useCookieInsteadOfSession: true,
  nonceLifetime: null,
  nonceMaxAmount: 5,  
  cookieEncryptionKeys: [ 
      { key: '3zTvzr3p67VC61jmV54rIYu1545x4TlY', iv: '60iP0h6vJoEa' }, 
      { key: '12345678901234567890123456789012', iv: '123456789012' }]
};

var implicit_config = JSON.parse(JSON.stringify(code_config));
implicit_config.responseType = 'id_token';

var hybrid_config = JSON.parse(JSON.stringify(code_config));
hybrid_config.responseType = 'code id_token';

var runAuthTest = (done) => {
  driver.get('http://localhost:3000/login').then(() => {
    driver.wait(until.titleIs('result'), 10000);
    driver.findElement(By.id('status')).getText().then((text) => { 
      expect(text).to.equal('succeeded');
      done();
    });
  });  
};

/******************************************************************************
 *  The test cases
 *****************************************************************************/

describe('authorization code flow test', function() {
  this.timeout(TEST_TIMEOUT);

  it('start app for authorization code flow', function(done) {
    if (!driver)
      driver = chromedriver.get_driver();

    server = require('./app/app_for_cookie')(code_config);
    done();
  });

  it('should succeeded', function(done) {
    runAuthTest(done);
  });

  it('shut down app', function(done) {
    server.shutdown(done);
  });
});

describe('implicit flow test', function() {
  this.timeout(TEST_TIMEOUT);

  it('start app for implicit flow', function(done) {
    if (!driver)
      driver = chromedriver.get_driver();

    server = require('./app/app_for_cookie')(implicit_config);
    done();
  });

  it('should succeeded', function(done) {
    runAuthTest(done);
  });

  it('shut down app', function(done) {
    server.shutdown(done);
  });
});

describe('hybrid flow test', function() {
  this.timeout(TEST_TIMEOUT);

  it('start app for hybrid flow', function(done) {
    if (!driver)
      driver = chromedriver.get_driver();

    server = require('./app/app_for_cookie')(hybrid_config);
    done();
  });

  it('should succeeded', function(done) {
    runAuthTest(done);
  });

  it('shut down app', function(done) {
    driver.quit();
    service.stop();
    server.shutdown(done);
  });
});


