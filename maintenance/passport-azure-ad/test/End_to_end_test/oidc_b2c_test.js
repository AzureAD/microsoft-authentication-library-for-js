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

var create_app = require('./app/app');

var chai = require('chai');
var expect = chai.expect;

const TEST_TIMEOUT = 1000000; // 1000 seconds
const LOGIN_WAITING_TIME = 3000; // 3 second

/******************************************************************************
 *  Configurations needed
 *****************************************************************************/
 // test parameters like clientID, clientSecret, username, password etc
var test_parameters = {};

// tenant specific endpoint configurations
var config_template, hybrid_config, code_config,
implicit_config, code_config_query, hybrid_config_noIssuer, hybrid_config_with_scope = {};

// common endpoint configurations
var config_template_common_endpoint, code_config_common_endpoint_query, hybrid_config_common_endpoint_noIssuer,
hybrid_config_common_endpoint_with_scope, hybrid_config_common_endpoint, code_config_common_endpoint,
implicit_config_common_endpoint = {};

// invalid configurations
var hybrid_config_common_endpoint_wrong_secret = {};

var driver;
var first_time = true;
var authOptions = {};

/******************************************************************************
 *  Untility functions for the tests
 *****************************************************************************/
var get_test_parameters = (apply_test_parameters_callback, done) => {
  var is_test_parameters_completed = require('./test_parameters').is_test_parameters_completed;

  if (is_test_parameters_completed) {
    test_parameters = require('./test_parameters').test_parameters.b2c_params;
    apply_test_parameters_callback(done);
  } else {
    require('./script').set_test_parameters((params) => {
      test_parameters = params.b2c_params;
      apply_test_parameters_callback(done);
    });
  }
};

var apply_test_parameters = (done) => {

  config_template = {
    identityMetadata: 'https://login.microsoftonline.com/' + test_parameters.tenantID + '/v2.0/.well-known/openid-configuration', 
    clientID: test_parameters.clientID,
    responseType: 'code id_token', 
    responseMode: 'form_post', 
    redirectUrl: 'http://localhost:3000/auth/openid/return',  
    allowHttpForRedirectUrl: true,
    clientSecret: test_parameters.clientSecret, 
    validateIssuer: true,
    isB2C: true,
    issuer: ['https://login.microsoftonline.com/' + test_parameters.tenantID + '/v2.0/'],
    passReqToCallback: false,
    scope: null,
    loggingLevel: null,
    nonceLifetime: null,
  };

  // 1. Config with various of response type
  // 1.1 hybrid flow config with 'code id_token'
  hybrid_config = config_template;
  // 1.2 authorization flow config
  code_config = JSON.parse(JSON.stringify(config_template));
  code_config.responseType = 'code';
  // 1.3 implicit flow config with 'id_token'
  implicit_config = JSON.parse(JSON.stringify(config_template));
  implicit_config.responseType = 'id_token';

  // 2. Config using query as the response mode
  // 2.1 authorization flow config with query response type
  code_config_query = JSON.parse(JSON.stringify(config_template));
  code_config_query.responseType = 'code';
  code_config_query.responseMode = 'query';

  // 3. Config without issue value
  // 3.1 hybrid flow with no issue value
  hybrid_config_noIssuer = JSON.parse(JSON.stringify(config_template));
  hybrid_config_noIssuer.issuer = null;

  // 4. Config with scope values
  // 4.1 hybrid flow with scope value offline_access and clientid
  hybrid_config_with_scope = JSON.parse(JSON.stringify(config_template));
  hybrid_config_with_scope.scope = ['offline_access', test_parameters.clientID];

  /******************************************************************************
   *  Common endpoint configurations
   *****************************************************************************/

  config_template_common_endpoint = JSON.parse(JSON.stringify(config_template));
  config_template_common_endpoint.identityMetadata = 'https://login.microsoftonline.com/sijun1b2c.onmicrosoft.com/v2.0/.well-known/openid-configuration';

  authOptions = { 'tenantIdOrName': test_parameters.tenantID, 'state': 'my_state'};

  // 1. Config using query as the response mode
  // - authorization code flow config with query response type
  code_config_common_endpoint_query = JSON.parse(JSON.stringify(config_template_common_endpoint));
  code_config_common_endpoint_query.responseType = 'code';
  code_config_common_endpoint_query.responseMode = 'query';

  // 2. Config without issue value
  // - hybrid flow with no issue value, we will provide tenant dynamically so this should work
  hybrid_config_common_endpoint_noIssuer = JSON.parse(JSON.stringify(config_template_common_endpoint));
  hybrid_config_common_endpoint_noIssuer.issuer = null;

  // 3. Config with scope values
  // - hybrid flow with scope value offline_access and clientID
  hybrid_config_common_endpoint_with_scope = JSON.parse(JSON.stringify(config_template_common_endpoint));
  hybrid_config_common_endpoint_with_scope.scope = ['offline_access', test_parameters.clientID];

  // 4. Config with different flows
  // - hybrid
  hybrid_config_common_endpoint = config_template_common_endpoint;
  // - code
  code_config_common_endpoint = JSON.parse(JSON.stringify(config_template_common_endpoint));
  code_config_common_endpoint.responseType = 'code';
  // - implicit
  implicit_config_common_endpoint = JSON.parse(JSON.stringify(config_template_common_endpoint));
  implicit_config_common_endpoint.responseType = 'id_token';

  /******************************************************************************
   *  Invalid configurations
   *****************************************************************************/

  // 1. common endpoint with wrong client secret
  hybrid_config_common_endpoint_wrong_secret = JSON.parse(JSON.stringify(config_template_common_endpoint));
  hybrid_config_common_endpoint_wrong_secret.clientSecret = 'wrong_secret';

  done();   
};

var resultPageValidation = (test_app_config, driver) => {
  driver.wait(until.titleIs('result'), 20000);
  driver.findElement(By.id('status')).getText().then((text) => { 
    expect(text).to.equal('succeeded');
  });
  driver.findElement(By.id('access_token')).getText().then((text) => { 
    if (test_app_config.scope.length > 6)
      expect(text).to.equal('exists');
    else
      expect(text).to.equal('none');
  });
  driver.findElement(By.id('refresh_token')).getText().then((text) => { 
    if (test_app_config.scope.length > 6)
      expect(text).to.equal('exists');
    else
      expect(text).to.equal('none');
  });
};

var checkResult = (test_app_config, done) => {
  if (!driver)
    driver = chromedriver.get_driver();

  var server;

  // for B2C common endpoint, use dynamic tenant id
  if (test_app_config.identityMetadata.indexOf('/common/') !== -1)
    server = require('./app/app')(test_app_config, authOptions, 8);
  else
    server = require('./app/app')(test_app_config, {}, 8);
  
  driver.get('http://localhost:3000/login?p=b2c_1_signin')
  .then(() => {
    if (first_time) {
      driver.wait(until.titleIs('Sign in to your account'), 10000);
      var usernamebox = driver.findElement(By.name('login'));
      usernamebox.sendKeys(test_parameters.username);
      var passwordbox = driver.findElement(By.name('passwd'));
      passwordbox.sendKeys(test_parameters.password);
      driver.sleep(LOGIN_WAITING_TIME);
      passwordbox.sendKeys(webdriver.Key.ENTER);
      first_time = false;
    }
  })
  .then(() => {
    resultPageValidation(test_app_config, driver);
  })
  .then(() => {
    server.shutdown(done); 
  });
};

var checkInvalidResult = (test_app_config, tenantIdOrName, done) => {
  var server = require('./app/app')(test_app_config, {'tenantIdOrName': tenantIdOrName}, 8);

  if (!driver)
    driver = chromedriver.get_driver();

  driver.get('http://localhost:3000/login?p=b2c_1_signin')
  .then(() => {
    driver.wait(until.titleIs('result'), 10000);
    driver.findElement(By.id('status')).getText().then((text) => {
      expect(text).to.equal('failed');
      server.shutdown(done);
    });
  });
};

/******************************************************************************
 *  The test cases
 *****************************************************************************/
describe('oidc b2c positive flow test', function() {
  this.timeout(TEST_TIMEOUT);

  it('get and apply config', function(done) {
    get_test_parameters(apply_test_parameters, done);
  });

  /****************************************************************************
   *  Test various response types for tenant specific endpoint
   ***************************************************************************/
  
  // hybrid flow
  it('should succeed', function(done) {
    checkResult(hybrid_config, done);
  });

  // authorization code flow
  it('should succeed', function(done) {
    checkResult(code_config, done);
  }); 

  // implicit flow
  it('should succeed', function(done) {
    checkResult(implicit_config, done);
  }); 

  /***************************************************************************
   *  Test various response type for common endpoint
   **************************************************************************/

  // hybrid flow
  it('should succeed', function(done) {
    checkResult(hybrid_config_common_endpoint, done);
  }); 

  // authorization code flow
  it('should succeed', function(done) {
    checkResult(code_config_common_endpoint, done);
  }); 

  // implicit flow
  it('should succeed', function(done) {
    checkResult(implicit_config_common_endpoint, done);
  }); 
});

describe('oidc b2c positive other test', function() {
  this.timeout(TEST_TIMEOUT);

  /***************************************************************************
   *  Test issuer and validateIssuers for both tenant specific and common endpoint
   **************************************************************************/

  // tenant specific endpoint
  it('should succeed', function(done) {
    checkResult(hybrid_config_noIssuer, done);
  });

  // common endpoint with no issuer and no validateIssuer
  it('should succeed', function(done) {
    checkResult(hybrid_config_common_endpoint_noIssuer, done);
  });

  /****************************************************************************
   *  Test query response type for both tenant specific and common endpoint
   ***************************************************************************/

  // tenant specific endpoint
  it('should succeed', function(done) {
    checkResult(code_config_query, done);
  });

  // common endpoint
  it('should succeed', function(done) {
    checkResult(code_config_common_endpoint_query, done);
  });

  /****************************************************************************
   *  Test scope for both tenant specific and common endpoint
   ***************************************************************************/

  // tenant specific endpoint
  it('should succeed', function(done) {
    checkResult(hybrid_config_with_scope, done);
  });

  // common endpoint
  it('should succeed', function(done) {
    checkResult(hybrid_config_common_endpoint_with_scope, done);
  });
});

describe('oidc b2c negative test', function() {
  this.timeout(TEST_TIMEOUT);

  // Wrong clientSecret
  it('should fail with wrong client secret', function(done) {
    checkInvalidResult(hybrid_config_common_endpoint_wrong_secret, test_parameters.tenantID, done);
  });

  it('close service', function(done) {
    expect('1').to.equal('1');
    driver.quit();
    service.stop();
    done();
  });
});
