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
implicit_config, hybrid_config_passReqToCallback, code_config_query, 
hybrid_config_noIssuer, hybrid_config_with_scope,
hybrid_config_clientAssertion, code_config_clientAssertion = {};

// common endpoint configurations
var config_template_common_endpoint, hybrid_config_common_endpoint, 
code_config_common_endpoint, implicit_config_common_endpoint, 
code_config_common_endpoint_query, hybrid_config_common_endpoint_noIssuer, 
hybrid_config_common_endpoint_with_scope = {};

// invalid configurations
var hybrid_config_common_endpoint_wrong_issuer, hybrid_config_common_endpoint_wrong_secret,
hybrid_config_clientAssertion_unregistered_pemKey,
hybrid_config_invalid_identityMetadata = {};

// driver needed for the tests
var driver;
// when we come to login page again, we can click this username_id button to log in
var username_id_on_page;  

/******************************************************************************
 *  Untility functions for the tests
 *****************************************************************************/

var get_test_parameters = (apply_test_parameters_callback, done) => {
  var is_test_parameters_completed = require('./test_parameters').is_test_parameters_completed;

  if (is_test_parameters_completed) {
    test_parameters = require('./test_parameters').test_parameters.v2_params;
    apply_test_parameters_callback(done);
  } else {
    require('./script').set_test_parameters((params) => {
      test_parameters = params.v2_params;
      apply_test_parameters_callback(done);
    });
  }
};

var apply_test_parameters = (done) => {
  // when we come to the login page the second time, we just need to click a button to choose
  // the user and log in. The id for the user is the username with @ and . replaced by _
  username_id_on_page = test_parameters.username.toLowerCase().replace('@', '_').replace(/\./g, '_');

  /******************************************************************************
   *  Tenant specific endpoint configurations
   *****************************************************************************/

  config_template = {
    identityMetadata: 'https://login.microsoftonline.com/' + test_parameters.tenantID + '/v2.0/.well-known/openid-configuration', 
    clientID: test_parameters.clientID,
    responseType: 'code id_token', 
    responseMode: 'form_post', 
    redirectUrl: 'http://localhost:3000/auth/openid/return', 
    allowHttpForRedirectUrl: true,
    clientSecret: test_parameters.clientSecret, 
    validateIssuer: true,
    issuer: ['https://login.microsoftonline.com/' + test_parameters.tenantID + '/v2.0'],
    passReqToCallback: false,
    scope: ['user.read'],
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

  // 2. Config with passReqToCallback. 
  // - hybrid flow config with 'id_token code'
  hybrid_config_passReqToCallback = JSON.parse(JSON.stringify(config_template));
  hybrid_config_passReqToCallback.passReqToCallback = true;

  // 3. Config using query as the response mode
  // - authorization flow config with query response type
  code_config_query = JSON.parse(JSON.stringify(config_template));
  code_config_query.responseType = 'code';
  code_config_query.responseMode = 'query';

  // 4. Config without issue value
  // - hybrid flow with no issue value
  hybrid_config_noIssuer = JSON.parse(JSON.stringify(config_template));
  hybrid_config_noIssuer.issuer = null;

  // 5. Config with additional scope values
  // - hybrid flow with scope value ['email', 'profile', 'offline_access']
  hybrid_config_with_scope = JSON.parse(JSON.stringify(config_template));
  hybrid_config_with_scope.scope = ['email', 'profile', 'offline_access'];

  /******************************************************************************
   *  Common endpoint configurations
   *****************************************************************************/

  config_template_common_endpoint = JSON.parse(JSON.stringify(config_template));
  config_template_common_endpoint.identityMetadata = 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration';

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

  /******************************************************************************
   *  Invalid configuration
   *****************************************************************************/

  // 1. common endpoint with no issuer
  hybrid_config_common_endpoint_wrong_issuer = JSON.parse(JSON.stringify(config_template_common_endpoint));
  hybrid_config_common_endpoint_wrong_issuer.issuer = ['wrong_issuer'];

  // 2. common endpoint with wrong client secret
  hybrid_config_common_endpoint_wrong_secret = JSON.parse(JSON.stringify(config_template_common_endpoint));
  hybrid_config_common_endpoint_wrong_secret.clientSecret = 'wrong_secret';

  // 3. invalid identityMetadata
  hybrid_config_invalid_identityMetadata = JSON.parse(JSON.stringify(config_template_common_endpoint));
  hybrid_config_invalid_identityMetadata.identityMetadata = 'https://login.microsoftonline.com/common/v2.0/.well-known/wrong';

  done();
};

var client_already_logged_in = false;

var checkResult = (test_app_config, done) => { 
  var server = create_app(test_app_config, {}, 8);

  if (!driver)
    driver = chromedriver.get_driver();

  driver.get('http://localhost:3000/login')
  .then(() => {
    if (!client_already_logged_in) {
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
      client_already_logged_in = true;
      driver.findElement(By.id('idSIButton9')).then((element)=>{element.click();}, () => {}); // might have 'keep signed in?' button
      driver.findElement(By.id('idBtn_Back')).then((element)=>{element.click();}, () => {});
    }
  }).then(() => {
    if (test_app_config.identityMetadata && test_app_config.identityMetadata.indexOf('common')!= -1) {
      driver.getTitle().then((title) => {
        if (title == 'Sign in to your account') {
          var selectAccoutButton = driver.wait(until.elementLocated(By.xpath('//*[@id="i0281"]/div[1]/div/div[1]/div[2]/div/div/div[2]/div[1]/div/div[2]')), 5000);
          driver.wait(until.elementIsVisible(selectAccoutButton), 5000).click();
        }
      });
    }
    driver.findElement(By.xpath('//*[@id="i0281"]/div[1]/div/div[1]/div[2]/div/div/div[2]/div[1]/div/div[2]')).then((element)=>{element.click();}, () => {});
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
    driver.getTitle().then((title) => {
      if (!client_already_logged_in) {
        driver.wait(until.titleIs('Sign in to your account'), 10000); 
        var usernamebox = driver.findElement(By.name('loginfmt'));
        usernamebox.sendKeys(test_parameters.username);
        usernamebox.sendKeys(webdriver.Key.ENTER);
        var passwordbox = driver.findElement(By.name('passwd'));
        passwordbox.sendKeys(test_parameters.password);
        driver.sleep(LOGIN_WAITING_TIME);
        passwordbox = driver.findElement(By.name('passwd'));
        passwordbox.sendKeys(webdriver.Key.ENTER);
        client_already_logged_in = true;
      } else {
        driver.findElement(By.xpath('//*[@id="i0281"]/div[1]/div/div[1]/div[2]/div/div/div[2]/div[1]/div/div[2]')).then((element) => {
          element.click();
        }, (err) => {});
      }
    });
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

describe('oidc v2 positive test', function() {
  this.timeout(TEST_TIMEOUT);

  it('get and apply test parameters', function(done) {
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

  /**************************************************************************
   *  Test issuer and validateIssuers for both tenant specific and common endpoint
   *************************************************************************/

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
});

describe('oidc v2 negative test', function() {
  this.timeout(TEST_TIMEOUT);

  // Wrong issuer
  it('should fail with wrong issuer', function(done) {
    checkInvalidResult(hybrid_config_common_endpoint_wrong_issuer, done);
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