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

var adalNode = require('adal-node'); 
var azureKeyVault = require('azure-keyvault');
var async = require('async');

// Get the clientID and clientSecret from environment variables.
// Those parameters are given by Jenkins.
var clientId = process.env.KEY_VAULT_CLIENT_ID;
var clientSecret = process.env.KEY_VAULT_CLIENT_SECRET;


var authenticator = (challenge, callback) => {
  // Create a new authentication context. 
  var context = new adalNode.AuthenticationContext(challenge.authorization);
  // Use the context to acquire an authentication token.
    return context.acquireTokenWithClientCredentials(challenge.resource, clientId, clientSecret, function(err, tokenResponse) {
        if (err) throw err;
        // Calculate the value to be set in the request's Authorization header and resume the call. 
        var authorizationValue = tokenResponse.tokenType + ' ' + tokenResponse.accessToken;
        return callback(null, authorizationValue);
    }); 
};

var credentials = new azureKeyVault.KeyVaultCredentials(authenticator);
var client = new azureKeyVault.KeyVaultClient(credentials);

// Key vault uri for ADAL testing
var vaultUri = 'https://jse2ekeyvault.vault.azure.net';

// The secrets we want to get from the key vault
var v1_v2_user_password_kv_name = 'v1v2UserPassword';
var v1_v2_user_password;
var b2c_user_password_kv_name = 'b2cUserPassword';
var b2c_user_password;
var v1_client_secret_kv_name = 'v1ClientSecret';
var v1_client_secret;
var v2_client_secret_kv_name = 'v2ClientSecret';
var v2_client_secret;
var b2c_client_secret_kv_name = 'b2cClientSecret';
var b2c_client_secret;

exports.set_test_parameters = (callback) => {
  var test_parameters = {};

  async.waterfall([
    (next) => {
      client.getSecret(vaultUri + '/secrets/' + v1_v2_user_password_kv_name, function (err, result) {
        if (err) throw err;
        v1_v2_user_password = result.value;
        return next();
      });
    },

    (next) => {
      client.getSecret(vaultUri + '/secrets/' + b2c_user_password_kv_name, function (err, result) {
        if (err) throw err;
        b2c_user_password = result.value;
        return next();
      });    
    },

    (next) => {
      client.getSecret(vaultUri + '/secrets/' + v1_client_secret_kv_name, function (err, result) {
        if (err) throw err;
        v1_client_secret = result.value;
        return next();
      });
    },

    (next) => {
      client.getSecret(vaultUri + '/secrets/' + v2_client_secret_kv_name, function (err, result) {
        if (err) throw err;
        v2_client_secret = result.value;
        return next();
      });    
    },

    (next) => {
      client.getSecret(vaultUri + '/secrets/' + b2c_client_secret_kv_name, function (err, result) {
        if (err) throw err;
        b2c_client_secret = result.value;
        return next();
      });
    },

    (next) => {
      test_parameters.v1_params = {
        tenantID: '268da1a1-9db4-48b9-b1fe-683250ba90cc',
        clientID: 'a8600356-09b7-4ca5-aee1-04aa7841a05b',
        clientSecret: v1_client_secret,
        username: 'robot@sijun.onmicrosoft.com',
        password: v1_v2_user_password
      };

      test_parameters.v2_params = {
        tenantID: '268da1a1-9db4-48b9-b1fe-683250ba90cc',
        clientID: '186104ca-b7a3-4462-ac54-43b60161243f',
        clientSecret: v2_client_secret,
        username: 'robot@sijun.onmicrosoft.com',
        password: v1_v2_user_password
      };

      test_parameters.b2c_params = {
        tenantID: '22bf40c6-1186-4ea5-b49b-3dc4ec0f54eb',
        clientID: 'f0b6e4eb-2d8c-40b6-b9c6-e26d1074846d',
        clientSecret: b2c_client_secret,
        username: 'lsj31415926@gmail.com',
        password: b2c_user_password,
        scopeForBearer: ['read', 'write'],
        scopeForOIDC: ['https://sijun1b2c.onmicrosoft.com/oidc-b2c/read', 'https://sijun1b2c.onmicrosoft.com/oidc-b2c/write']
      };

      return callback(test_parameters);  
    }],

    (waterfallError) => {
      if (waterfallError)
        console.log(waterfallError.message);
      return true;
    }
  );
};

