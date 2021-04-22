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
var error_handler = chromedriver.error_handler;
var webdriver = chromedriver.webdriver;
var By = webdriver.By;
var until = webdriver.until;

var chai = require('chai');
var expect = chai.expect;

const TEST_TIMEOUT = 1000000; // 1000 seconds
const LOGIN_WAITING_TIME = 1000; // 1 second

/******************************************************************************
 *  configurations needed
 *****************************************************************************/
var test_parameters = {};

var client_config = {};
var server_config,  server_config_with_req, server_config_allow_multiAud,
server_config_wrong_issuer, server_config_wrong_identityMetadata, 
server_config_wrong_audience, server_config_wrong_issuer_no_validateIssuer,
server_config_multiple_audience,
server_config_common_endpoint, server_config_common_endpoint_with_req,
server_config_common_endpoint_dynamic_tenant,
server_config_common_endpoint_allow_multiAud, server_config_common_endpoint_wrong_issuer,
server_config_common_endpoint_wrong_audience,
server_config_common_endpoint_wrong_issuer_no_validateIssuer = {};

var driver;
var client_already_logged_in = false;
var client;

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

  client_config = {
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

  server_config = {
    identityMetadata: 'https://login.microsoftonline.com/' + test_parameters.tenantID + '/.well-known/openid-configuration', 
    clientID: test_parameters.clientID,
    validateIssuer: true,
    passReqToCallback: false,
    issuer: null,
    audience: null,  // passport is expected to use clientID by default if audience is not provided
    allowMultiAudiencesInToken: false,
    loggingLevel: null,
  };

  server_config_with_req = JSON.parse(JSON.stringify(server_config));
  server_config_with_req.passReqToCallback = true;

  server_config_allow_multiAud = JSON.parse(JSON.stringify(server_config));
  server_config_allow_multiAud.allowMultiAudiencesInToken = false;

  server_config_wrong_issuer = JSON.parse(JSON.stringify(server_config));
  server_config_wrong_issuer.issuer = 'wrong_issuer';

  server_config_wrong_identityMetadata = JSON.parse(JSON.stringify(server_config));
  server_config_wrong_identityMetadata.identityMetadata = 'https://login.microsoftonline.com/wrongTenant/.well-known/openid-configuration';

  server_config_wrong_audience = JSON.parse(JSON.stringify(server_config));
  server_config_wrong_audience.audience = 'wrong_audience';

  server_config_wrong_issuer_no_validateIssuer = JSON.parse(JSON.stringify(server_config));
  server_config_wrong_issuer_no_validateIssuer.issuer = 'wrong_issuer';
  server_config_wrong_issuer_no_validateIssuer.validateIssuer = false;

  server_config_multiple_audience = JSON.parse(JSON.stringify(server_config));
  server_config_multiple_audience.audience = ['https://graph.windows.net', test_parameters.clientID];

  server_config_common_endpoint = JSON.parse(JSON.stringify(server_config));
  server_config_common_endpoint.identityMetadata = 'https://login.microsoftonline.com/common/.well-known/openid-configuration';
  server_config_common_endpoint.issuer = 'https://sts.windows.net/' + test_parameters.tenantID + '/';

  server_config_common_endpoint_dynamic_tenant = JSON.parse(JSON.stringify(server_config));
  server_config_common_endpoint_dynamic_tenant.identityMetadata = 'https://login.microsoftonline.com/common/.well-known/openid-configuration';
  server_config_common_endpoint_dynamic_tenant.tenantIdOrName = test_parameters.tenantID;

  server_config_common_endpoint_with_req = JSON.parse(JSON.stringify(server_config_common_endpoint));
  server_config_common_endpoint_with_req.passReqToCallback = true;

  server_config_common_endpoint_allow_multiAud = JSON.parse(JSON.stringify(server_config_common_endpoint));
  server_config_common_endpoint_allow_multiAud.allowMultiAudiencesInToken = false;

  server_config_common_endpoint_wrong_issuer = JSON.parse(JSON.stringify(server_config_common_endpoint));
  server_config_common_endpoint_wrong_issuer.issuer = 'wrong_issuer';

  server_config_common_endpoint_wrong_audience = JSON.parse(JSON.stringify(server_config_common_endpoint));
  server_config_common_endpoint_wrong_audience.audience = 'wrong_audience';

  server_config_common_endpoint_wrong_issuer_no_validateIssuer = JSON.parse(JSON.stringify(server_config_common_endpoint));
  server_config_common_endpoint_wrong_issuer_no_validateIssuer.issuer = 'wrong_issuer';
  server_config_common_endpoint_wrong_issuer_no_validateIssuer.validateIssuer = false;

  done();  
};

var get_token_for_resource = (resource, done) => {
  if (!driver)
    driver = chromedriver.get_driver();
  
  client = require('./app/client_for_api')(client_config, { resourceURL: resource });

  driver.get('http://localhost:3000')
  .then(() => {
    driver.wait(until.titleIs('Example'), 10000);
    driver.findElement(By.xpath('/html/body/p/a')).click();
  }).then(() => {
    // we only need to enter the user name and password if we haven't logged in yet
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
    }
  }).then(() => {
    driver.wait(until.titleIs('Sign in to your account'), 5000).then(
      ()=>{ driver.findElement(By.id('idBtn_Back')).click().then(()=>{done();}); },
      ()=>{ done();}
    );
  });
};

var checkResult = (test_app_config, result, done) => {
  var server = require('./app/api')(test_app_config);
  driver.get('http://localhost:3000/callApi')
  .then(() => {
    driver.wait(until.titleIs('result'), 10000).catch((ex) => {
      error_handler(ex, server, done);
    });
    driver.findElement(By.id('status')).getText().then((text) => { 
      expect(text).to.equal(result);
      server.shutdown(done);
    }).catch((ex) => {
      error_handler(ex, server, done);
    });
  });
};

/******************************************************************************
 *  The test cases
 *****************************************************************************/

describe('bearer test', function() {
  this.timeout(TEST_TIMEOUT);

  it('get and apply config', function(done) {
    get_test_parameters(apply_test_parameters, done);
  });

  it('get token for the client itself', function(done) {
    get_token_for_resource(test_parameters.clientID, done);
  });

  /******************************************************************************
   *  tenant specific endpoint
   *****************************************************************************/

  it('should succeed', function(done) {
    checkResult(server_config, 'succeeded', done);
  });

  it('should succeed', function(done) {
    checkResult(server_config_with_req, 'succeeded', done);
  });

  it('should succeed', function(done) {
    checkResult(server_config_allow_multiAud, 'succeeded', done);
  });

  it('should succeed', function(done) {
    checkResult(server_config_wrong_issuer_no_validateIssuer, 'succeeded', done);
  });

  it('should fail with wrong audience', function(done) {
    checkResult(server_config_wrong_audience, 'Unauthorized', done);
  });

  it('should fail with wrong issuer', function(done) {
    checkResult(server_config_wrong_issuer, 'Unauthorized', done);
  });

  it('should fail with wrong identityMetadata', function(done) {
    checkResult(server_config_wrong_identityMetadata, 'Unauthorized', done);
  });

  /******************************************************************************
   *  common endpoint
   *****************************************************************************/

  it('should succeed', function(done) {
    checkResult(server_config_common_endpoint, 'succeeded', done);
  });

  it('should succeed', function(done) {
    checkResult(server_config_common_endpoint_dynamic_tenant, 'succeeded', done);
  });

  it('should succeed', function(done) {
    checkResult(server_config_common_endpoint_with_req, 'succeeded', done);
  });

  it('should succeed', function(done) {
    checkResult(server_config_common_endpoint_allow_multiAud, 'succeeded', done);
  });

  it('should succeed', function(done) {
    checkResult(server_config_wrong_issuer_no_validateIssuer, 'succeeded', done);
  });

  it('should fail with wrong audience', function(done) {
    checkResult(server_config_common_endpoint_wrong_audience, 'Unauthorized', done);
  });

  it('should fail with wrong issuer', function(done) {
    checkResult(server_config_common_endpoint_wrong_issuer, 'Unauthorized', done);
  });

  /******************************************************************************
   *  test with multiple audiences in config
   *****************************************************************************/

  // first test the token whose audience is itself (the clientID of this app)
  it('should succeed with multiple audience provided in config and access token for itself', function(done) {
    checkResult(server_config_multiple_audience, 'succeeded', done);
  });

  // shut down the client which can get access_token for itself
  it('shutdown client', function(done) {
    expect('1').to.equal('1');
    client.shutdown(done);
  });
  
  // create a client which can get access_token for graph and generate an access_token
  it('get token for graph', function(done) {
    get_token_for_resource('https://graph.windows.net', done);
  });

  it('should succeed with multiple audience provided in config and access token for graph', function(done) {
    checkResult(server_config_multiple_audience, 'succeeded', done);
  });

  // clean up work
  it('close service', function(done) {
    expect('1').to.equal('1');
    driver.quit();
    service.stop();
    client.shutdown(done);
  });
});
