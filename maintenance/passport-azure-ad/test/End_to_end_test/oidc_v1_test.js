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
var fs = require('fs');

const TEST_TIMEOUT = 1000000; // 1000 seconds
const LOGIN_WAITING_TIME = 1000; // 1 second

/******************************************************************************
 *  Configurations needed
 *****************************************************************************/
// test parameters like clientID, clientSecret, username, password etc
var test_parameters = {};

// tenant specific endpoint configurations
var config_template, hybrid_config, hybrid_config_alternative, code_config,
implicit_config, code_config_query, hybrid_config_noIssuer, hybrid_config_with_scope,
hybrid_config_passReqToCallback = {};

// common endpoint configurations
var config_template_common_endpoint, hybrid_config_common_endpoint, 
code_config_common_endpoint, implicit_config_common_endpoint, 
code_config_common_endpoint_query, hybrid_config_common_endpoint_noIssuer,
hybrid_config_common_endpoint_with_scope = {}; 

// invalid configurations
var hybrid_config_common_endpoint_wrong_issuer, 
hybrid_config_common_endpoint_short_lifetime, 
hybrid_config_common_endpoint_wrong_secret = {};

// drivers needed for the tests
var driver;
var driver1;
var driver2;
var first_time = true;

/******************************************************************************
 *  Untility functions for the tests
 *****************************************************************************/

var get_test_parameters = (apply_test_parameters_callback, done) => {
  var is_test_parameters_completed = require('./test_parameters').is_test_parameters_completed;

  if (is_test_parameters_completed) {
    test_parameters = require('./test_parameters').test_parameters.v1_params;
    apply_test_parameters_callback(done);
  } else {
    require('./script').set_test_parameters((params) => {
      test_parameters = params.v1_params;
      apply_test_parameters_callback(done);
    });
  }
};

var apply_test_parameters = (done) => {

  /****************************************************************************
   *  Tenant specific endpoint configurations
   ***************************************************************************/
  config_template = {
    identityMetadata: 'https://login.microsoftonline.com/' + test_parameters.tenantID + '/.well-known/openid-configuration', 
    clientID: test_parameters.clientID,
    responseType: 'code id_token', 
    responseMode: 'form_post', 
    redirectUrl: 'http://localhost:3000/auth/openid/return', 
    allowHttpForRedirectUrl: true,
    clientSecret: test_parameters.clientSecret,
    validateIssuer: true,
    issuer: ['https://sts.windows.net/' + test_parameters.tenantID + '/'],
    passReqToCallback: false,
    scope: null,
    loggingLevel: null,
    nonceLifetime: null,
  };

  // 1. Config with various of response type
  // - hybrid flow config with 'code id_token'
  hybrid_config = config_template;
  // - hybrid flow config with 'id_token code'
  hybrid_config_alternative = JSON.parse(JSON.stringify(config_template));
  hybrid_config_alternative.responseType = 'id_token code';
  // - authorization flow config
  code_config = JSON.parse(JSON.stringify(config_template));
  code_config.responseType = 'code';
  // - implicit flow config with 'id_token'
  implicit_config = JSON.parse(JSON.stringify(config_template));
  implicit_config.responseType = 'id_token';

  // 2. Config using query as the response mode
  // - authorization flow config with query response type
  code_config_query = JSON.parse(JSON.stringify(config_template));
  code_config_query.responseType = 'code';
  code_config_query.responseMode = 'query';

  // 3. Config without issue value
  // - hybrid flow with no issue value
  hybrid_config_noIssuer = JSON.parse(JSON.stringify(config_template));
  hybrid_config_noIssuer.issuer = null;

  // 4. Config with scope values
  // - hybrid flow with scope value email and profile
  hybrid_config_with_scope = JSON.parse(JSON.stringify(config_template));
  hybrid_config_with_scope.scope = ['email', 'profile'];

  // 5. Config with passReqToCallback set to true
  hybrid_config_passReqToCallback = JSON.parse(JSON.stringify(config_template));
  hybrid_config_passReqToCallback.passReqToCallback = true;

  /****************************************************************************
   *  Tenant specific endpoint configurations
   ***************************************************************************/
  config_template_common_endpoint = JSON.parse(JSON.stringify(config_template));
  config_template_common_endpoint.identityMetadata = 'https://login.microsoftonline.com/common/.well-known/openid-configuration';

  // 1. Config with various of response type
  // - hybrid flow config with 'code id_token'
  hybrid_config_common_endpoint = config_template;
  // - authorization code flow config
  code_config_common_endpoint = JSON.parse(JSON.stringify(config_template_common_endpoint));
  code_config_common_endpoint.responseType = 'code';
  // - implicit flow config with 'id_token'
  implicit_config_common_endpoint = JSON.parse(JSON.stringify(config_template_common_endpoint));
  implicit_config_common_endpoint.responseType = 'id_token';

  // 2. Config using query as the response mode
  // - authorization code flow config with query response type
  code_config_common_endpoint_query = JSON.parse(JSON.stringify(config_template_common_endpoint));
  code_config_common_endpoint_query.responseType = 'code';
  code_config_common_endpoint_query.responseMode = 'query';

  // 3. Config without issue value
  // - hybrid flow with no issue value and no validateIssuer
  hybrid_config_common_endpoint_noIssuer = JSON.parse(JSON.stringify(config_template_common_endpoint));
  hybrid_config_common_endpoint_noIssuer.issuer = null;
  hybrid_config_common_endpoint_noIssuer.validateIssuer = false;

  // 4. Config with scope values
  // - hybrid flow with scope value ['email', 'profile']
  hybrid_config_common_endpoint_with_scope = JSON.parse(JSON.stringify(config_template_common_endpoint));
  hybrid_config_common_endpoint_with_scope.scope = ['email', 'profile'];

  /****************************************************************************
   *  Invalid configurations
   ***************************************************************************/
  // 1. common endpoint with no issuer
  hybrid_config_common_endpoint_wrong_issuer = JSON.parse(JSON.stringify(config_template_common_endpoint));
  hybrid_config_common_endpoint_wrong_issuer.issuer = ['wrong_issuer'];
  // 2. common endpoint with too short nonceLifetime
  hybrid_config_common_endpoint_short_lifetime = JSON.parse(JSON.stringify(config_template_common_endpoint));
  hybrid_config_common_endpoint_short_lifetime.nonceLifetime = 0.001; // 1ms
  // 2. common endpoint with wrong client secret
  hybrid_config_common_endpoint_wrong_secret = JSON.parse(JSON.stringify(config_template_common_endpoint));
  hybrid_config_common_endpoint_wrong_secret.clientSecret = 'wrong_secret';  
  done();  
};

var checkResult = (test_app_config, arity, done) => {
  var server = create_app(test_app_config, {}, arity);

  if (!driver)
    driver = chromedriver.get_driver();

  driver.get('http://localhost:3000/login')
  .then(() => {
    if (first_time) {
      driver.wait(until.titleIs('Sign in to your account'), 10000);  
      var usernamebox = driver.findElement(By.name('loginfmt'));
      usernamebox.sendKeys(test_parameters.username);
      usernamebox.sendKeys(webdriver.Key.ENTER);
      driver.sleep(LOGIN_WAITING_TIME);
      var passwordbox = driver.findElement(By.name('passwd'));
      passwordbox.sendKeys(test_parameters.password);
      driver.sleep(LOGIN_WAITING_TIME);
      passwordbox = driver.findElement(By.name('passwd'));
      passwordbox.sendKeys(webdriver.Key.ENTER);
      first_time = false;
      driver.findElement(By.id('idSIButton9')).then((element)=>{element.click();}, () => {});
    }
  }).then(() => {
    driver.findElement(By.id('idBtn_Back')).then((element)=>{element.click();}, () => {});
  }).then(() => {
    driver.wait(until.titleIs('result'), 10000);
    driver.findElement(By.id('status')).getText().then((text) => { 
      expect(text).to.equal('succeeded');
      server.shutdown(done); 
    });
  });
};

var checkInvalidResult = (test_app_config, done) => {
  var server = create_app(test_app_config, {}, 8);

  if (!driver)
    driver = chromedriver.get_driver();

  driver.get('http://localhost:3000/login')
  .then(() => {
    if (first_time) {
      driver.wait(until.titleIs('Sign in to your account'), 10000);  
      var usernamebox = driver.findElement(By.name('loginfmt'));
      usernamebox.sendKeys(test_parameters.username);
      usernamebox.sendKeys(webdriver.Key.ENTER);
      var passwordbox = driver.findElement(By.name('passwd'));
      passwordbox.sendKeys(test_parameters.password);
      driver.sleep(LOGIN_WAITING_TIME);
      passwordbox = driver.findElement(By.name('passwd'));
      passwordbox.sendKeys(webdriver.Key.ENTER);
      first_time = false;
    }
  })
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
describe('oidc v1 positive arity test', function() {
  this.timeout(TEST_TIMEOUT);

  it('get and apply config', function(done) {
    get_test_parameters(apply_test_parameters, done);
  });

  // In the tests below, we set passReqToCallback to be false

  it('should succeed with arity 8 for verify function', function(done) {
    checkResult(hybrid_config, 8, done);
  });

  it('should succeed with arity 7 for verify function', function(done) {
    checkResult(hybrid_config, 7, done);
  });

  it('should succeed with arity 6 for verify function', function(done) {
    checkResult(hybrid_config, 6, done);
  }); 

  it('should succeed with arity 4 for verify function', function(done) {
    checkResult(hybrid_config, 4, done);
  });

  it('should succeed with arity 3 for verify function', function(done) {
    checkResult(hybrid_config, 3, done);
  });

  it('should succeed with arity 2 for verify function', function(done) {
    checkResult(hybrid_config, 2, done);
  }); 

  // In the tests below, we set passReqToCallback to be true

  it('should succeed with arity 8 for verify function with req parameter', function(done) {
    checkResult(hybrid_config_passReqToCallback, 8, done);
  });

  it('should succeed with arity 7 for verify function with req parameter', function(done) {
    checkResult(hybrid_config_passReqToCallback, 7, done);
  });

  it('should succeed with arity 6 for verify function with req parameter', function(done) {
    checkResult(hybrid_config_passReqToCallback, 6, done);
  }); 

  it('should succeed with arity 4 for verify function with req parameter', function(done) {
    checkResult(hybrid_config_passReqToCallback, 4, done);
  });

  it('should succeed with arity 3 for verify function with req parameter', function(done) {
    checkResult(hybrid_config_passReqToCallback, 3, done);
  });

  it('should succeed with arity 2 for verify function with req parameter', function(done) {
    checkResult(hybrid_config_passReqToCallback, 2, done);
  }); 
});

describe('oidc v1 positive other test', function() {
  this.timeout(TEST_TIMEOUT);

  /****************************************************************************
   *  Test various response types for tenant specific endpoint
   ***************************************************************************/
  
  // hybrid with 'id_token code'
  it('should succeed', function(done) {
    checkResult(hybrid_config_alternative, 8, done);
  }); 

  // authorization code flow
  it('should succeed', function(done) {
    checkResult(code_config, 8, done);
  }); 

  // implicit flow
  it('should succeed', function(done) {
    checkResult(implicit_config, 2, done);
  }); 

  /****************************************************************************
   *  Test various response type for common endpoint
   ***************************************************************************/

  // hybrid flow
  it('should succeed', function(done) {
    checkResult(hybrid_config_common_endpoint, 8, done);
  }); 

  // authorization code flow
  it('should succeed', function(done) {
    checkResult(code_config_common_endpoint, 8, done);
  }); 

  // implicit flow
  it('should succeed', function(done) {
    checkResult(implicit_config_common_endpoint, 2, done);
  }); 

  /**************************************************************************
   *  Test issuer and validateIssuers for both tenant specific and common endpoint
   *************************************************************************/

  // tenant specific endpoint
  it('should succeed', function(done) {
    checkResult(hybrid_config_noIssuer, 2, done);
  });

  // common endpoint with no issuer and no validateIssuer
  it('should succeed', function(done) {
    checkResult(hybrid_config_common_endpoint_noIssuer, 2, done);
  });

  /****************************************************************************
   *  Test scope for both tenant specific and common endpoint
   ***************************************************************************/

  // tenant specific endpoint
  it('should succeed', function(done) {
    checkResult(hybrid_config_with_scope, 2, done);
  });

  // common endpoint
  it('should succeed', function(done) {
    checkResult(hybrid_config_common_endpoint_with_scope, 2, done);
  });

  /****************************************************************************
   *  Test query response type for both tenant specific and common endpoint
   ***************************************************************************/

  // tenant specific endpoint
  it('should succeed', function(done) {
    checkResult(code_config_query, 2, done);
  });

  // common endpoint
  it('should succeed', function(done) {
    checkResult(code_config_common_endpoint_query, 2, done);
  });
});

describe('oidc v1 negative test', function() {
  this.timeout(TEST_TIMEOUT);

  // Wrong issuer
  it('should fail with wrong issuer', function(done) {
    checkInvalidResult(hybrid_config_common_endpoint_wrong_issuer, done);
  });

  // Nonce lifetime is too short
  it('should fail with short nonce lifetime', function(done) {
    checkInvalidResult(hybrid_config_common_endpoint_short_lifetime, done);
  });

  // Wrong clientSecret
  it('should fail with wrong client secret', function(done) {
    checkInvalidResult(hybrid_config_common_endpoint_wrong_secret, done);
  });

  it('close service', function(done) {
    expect('1').to.equal('1');
    driver.quit();
    service.stop();
    done();
  });
});
