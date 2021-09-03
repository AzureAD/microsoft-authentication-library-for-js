/*
 * @copyright
 * Copyright © Microsoft Open Technologies, Inc.
 *
 * All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http: *www.apache.org/licenses/LICENSE-2.0
 *
 * THIS CODE IS PROVIDED *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS
 * OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION
 * ANY IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A
 * PARTICULAR PURPOSE, MERCHANTABILITY OR NON-INFRINGEMENT.
 *
 * See the Apache License, Version 2.0 for the specific language
 * governing permissions and limitations under the License.
 */

'use strict';
/* Directive tells jshint that suite and test are globals defined by mocha */
/* global suite */
/* global test */
import * as assert from "assert";
import * as nock from "nock";

const util = require('./util/util');
const cp = util.commonParameters;
const testRequire = util.testRequire;

const UserRealm = testRequire('user-realm');

/**
 * Tests the UserRealm class and user realm discovery.
 */
suite('UserRealm', function() {
  var authority = 'https://login.windows.net/';
  var user = 'test@federatedtenant-com';

  function setupExpectedResponse(doc: any) {
    var userRealmPath = cp.userRealmPathTemplate.replace('<user>', encodeURIComponent(user));
    var query = 'api-version=1.0';

    var userRealmRequest = nock(authority)
                            .filteringPath(function(path) {
                              return util.removeQueryStringIfMatching(path, query);
                            })
                            .get(userRealmPath)
                            .reply(200, doc);

    util.matchStandardRequestHeaders(userRealmRequest);

    return userRealmRequest;
  }

  function negativeTest(response: any, done: Function) {
    var userRealmRequest = setupExpectedResponse(response);

    var userRealm = new UserRealm(cp.callContext, user, authority);
    userRealm.discover(function(err: Error) {
      userRealmRequest.done();
      assert(err, 'Did not receive expected error');
      done();
    });
  }

  test('happy-path-federated', function(done) {
    var userRealmResponse = '{\"account_type\":\"Federated\",\"federation_protocol\":\"wstrust\",\"federation_metadata_url\":\"https://adfs.federatedtenant.com/adfs/services/trust/mex\",\"federation_active_auth_url\":\"https://adfs.federatedtenant.com/adfs/services/trust/2005/usernamemixed\",\"ver\":\"0.8\"}';
    var userRealmRequest = setupExpectedResponse(userRealmResponse);

    var userRealm = new UserRealm(cp.callContext, user, authority);
    userRealm.discover(function(err: Error) {
      userRealmRequest.done();
      if (!err) {
        assert(userRealm.federationMetadataUrl === 'https://adfs.federatedtenant.com/adfs/services/trust/mex',
          'Returned Mex URL does not match expected value:' + userRealm.federationMetadataUrl);
        assert(userRealm.federationActiveAuthUrl === 'https://adfs.federatedtenant.com/adfs/services/trust/2005/usernamemixed',
          'Returned active auth URL does not match expected value: ' + userRealm.federationActiveAuthUrl);
      }
      done(err);
    });
  });

  test('negative-wrong-field', function(done) {
    var response = '{\"account_type\":\"Manageddf\",\"federation_protocol\":\"SAML20fgfg\",\"federation_metadata\":\"https://adfs.federatedtenant.com/adfs/services/trust/mex\",\"federation_active_auth_url\":\"https://adfs.federatedtenant.com/adfs/services/trust/2005/usernamemixed\",\"version\":\"0.8\"}';
    negativeTest(response, done);
  });

  test('negative-noroot', function(done) {
    var response = 'noroot';
    negativeTest(response, done);
  });

  test('negative-empty-json', function(done) {
    var response = '{}';
    negativeTest(response, done);
  });

  test('negative-fed-err', function(done) {
    var response = '{\"account_type\":\"Federated\",\"federation_protocol\":\"wstrustww\",\"federation_metadata_url\":\"https://adfs.federatedtenant.com/adfs/services/trust/mex\",\"federation_active_auth_url\":\"https://adfs.federatedtenant.com/adfs/services/trust/2005/usernamemixed\",\"ver\":\"0.8\"}';
    negativeTest(response, done);
  });
});

