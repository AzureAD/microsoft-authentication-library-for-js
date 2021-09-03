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

const TEST_TIMEOUT = 500000; // 30 seconds
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
  nonceLifetime: null,
};

var implicit_config = JSON.parse(JSON.stringify(code_config));
implicit_config.responseType = 'id_token';

var hybrid_config = JSON.parse(JSON.stringify(code_config));
hybrid_config.responseType = 'code id_token';

var runAuthTest = (id, result, done) => {
  driver.get('http://localhost:3000/auth/' + id).then(() => {
    driver.wait(until.titleIs('result'), 10000);
    driver.findElement(By.id('status')).getText().then((text) => { 
      expect(text).to.equal(result);
      done();
    });
  });  
};

var runTokenTest = (id, result, done) => {
  driver.get('http://localhost:3000/token/' + id).then(() => {
    driver.wait(until.titleIs('result'), 10000);
    driver.findElement(By.id('status')).getText().then((text) => { 
      expect(text).to.equal(result);
      done();
    });
  });  
};

var id_token_list = [ "alg1", "iss1", "iss2", "sub1", "aud1", "aud2", "exp1", "exp2", 
"nonce1", "nonce2", "azp1", "azp2", "nbf1", "sig1", "sig2"]; 

var c_hash_list = ["c_hash1", "c_hash2"];  // for "code id_token"

var auth_resp_list = ["state1", "state2", "denied"]; 

var token_resp_list = ["id_token_tokenResp", "access_token_tokenResp", "access_token_expired"];

var invalid_code = "code2"; // for "code", "code id_token"

var invalid_sub = "sub2";  // for the id_token from token endpoint

/******************************************************************************
 *  The test cases
 *****************************************************************************/

describe('authorization code flow test', function() {
  this.timeout(TEST_TIMEOUT);

  it('start app for authorization code flow', function(done) {
    if (!driver)
      driver = chromedriver.get_driver();

    server = require('./app/app_for_testing_sts')(code_config);
    done();
  });

  // tests with tparams in authentication request

  for(let i = 0; i < id_token_list.length; i++) {
    it('add_tparam_in_auth_req_test: ' + id_token_list[i], function(done) {
      runAuthTest(id_token_list[i], 'failed', done);
    });
  }

  for(let i = 0; i < auth_resp_list.length; i++) {
    it('add_tparam_in_auth_req_test: ' + auth_resp_list[i], function(done) {
      runAuthTest(auth_resp_list[i], 'failed', done);
    });
  }

  for(let i = 0; i < token_resp_list.length; i++) {
    it('add_tparam_in_auth_req_test: ' + token_resp_list[i], function(done) {
      runAuthTest(token_resp_list[i], 'failed', done);
    });
  }

  it('add_tparam_in_auth_req_test: code2' , function(done) {
    runAuthTest(invalid_code, 'failed', done);
  });

  // tests with tparams in token request

  for(let i = 0; i < id_token_list.length; i++) {
    it('add_tparam_in_token_req_test: ' + id_token_list[i], function(done) {
      runTokenTest(id_token_list[i], 'failed', done);
    });
  }

  for(let i = 0; i < token_resp_list.length; i++) {
    it('add_tparam_in_token_req_test: ' + token_resp_list[i], function(done) {
      runTokenTest(token_resp_list[i], 'failed', done);
    });
  }

  it('add_tparam_in_token_req_test: sub2' , function(done) {
    runAuthTest(invalid_sub, 'failed', done);
  });

  it('shut down app', function(done) {
    server.shutdown(done);
  })
});

describe('implicit flow test', function() {
  this.timeout(TEST_TIMEOUT);

  it('start app for implicit flow', function(done) {
    if (!driver)
      driver = chromedriver.get_driver();

    server = require('./app/app_for_testing_sts')(implicit_config);
    done();
  });

  // tests with tparams in authentication request

  for(let i = 0; i < id_token_list.length; i++) {
    it('add_tparam_in_auth_req_test: ' + id_token_list[i], function(done) {
      runAuthTest(id_token_list[i], 'failed', done);
    });
  }

  for(let i = 0; i < auth_resp_list.length; i++) {
    it('add_tparam_in_auth_req_test: ' + auth_resp_list[i], function(done) {
      runAuthTest(auth_resp_list[i], 'failed', done);
    });
  }

  it('shut down app', function(done) {
    server.shutdown(done);
  })
});

describe('hybrid flow test', function() {
  this.timeout(TEST_TIMEOUT);

  it('start app for hybrid flow', function(done) {
    if (!driver)
      driver = chromedriver.get_driver();

    server = require('./app/app_for_testing_sts')(hybrid_config);
    done();
  });

  // tests with tparams in authentication request

  for(let i = 0; i < id_token_list.length; i++) {
    it('add_tparam_in_auth_req_test: ' + id_token_list[i], function(done) {
      runAuthTest(id_token_list[i], 'failed', done);
    });
  }

  for(let i = 0; i < c_hash_list.length; i++) {
    it('add_tparam_in_auth_req_test: ' + c_hash_list[i], function(done) {
      runAuthTest(c_hash_list[i], 'failed', done);
    });
  }

  for(let i = 0; i < auth_resp_list.length; i++) {
    it('add_tparam_in_auth_req_test: ' + auth_resp_list[i], function(done) {
      runAuthTest(auth_resp_list[i], 'failed', done);
    });
  }

  for(let i = 0; i < token_resp_list.length; i++) {
    it('add_tparam_in_auth_req_test: ' + token_resp_list[i], function(done) {
      runAuthTest(token_resp_list[i], 'failed', done);
    });
  }

  it('add_tparam_in_auth_req_test: code2' , function(done) {
    runAuthTest(invalid_code, 'failed', done);
  });

  // tests with tparams in token request

  for(let i = 0; i < id_token_list.length; i++) {
    it('add_tparam_in_token_req_test: ' + id_token_list[i], function(done) {
      runTokenTest(id_token_list[i], 'failed', done);
    });
  }

  for(let i = 0; i < token_resp_list.length; i++) {
    it('add_tparam_in_token_req_test: ' + token_resp_list[i], function(done) {
      runTokenTest(token_resp_list[i], 'failed', done);
    });
  }

  it('add_tparam_in_token_req_test: sub2' , function(done) {
    runAuthTest(invalid_sub, 'failed', done);
  });

  it('shut down app', function(done) {
    driver.quit();
    service.stop();
    server.shutdown(done);
  })
});


