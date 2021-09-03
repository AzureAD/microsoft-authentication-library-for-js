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

var users = [];

module.exports = function(strategyOptions) {
  var base64url = require('base64url');
  var express = require('express');
  var cookieParser = require('cookie-parser');
  var expressSession = require('express-session');
  var bodyParser = require('body-parser');
  var methodOverride = require('method-override');
  var passport = require('passport');
  var request = require('request');
  var enableGracefulShutdown = require('server-graceful-shutdown');
  var OIDCStrategy = require('../../../lib/index').OIDCStrategy;

  users = [];

  var findBySub = function(sub, fn) {
    for (var i = 0, len = users.length; i < len; i++) {
      var user = users[i];
      if (user.sub === sub)
        return fn(null, user);
    }
    return fn(null, null);
  };

  var strategy = new OIDCStrategy(strategyOptions, 
    function(profile, done) {
      findBySub(profile.sub, function(err, user) {
        if (!user) {
          users.push(profile);
          return done(null, profile);
        }
        return done(null, user);
      });
    }
  );

  passport.use(strategy);
  passport.serializeUser(function(user, done) { done(null, user.sub); });
  passport.deserializeUser(function(sub, done) {
    findBySub(sub, function (err, user) {
      done(err, user);
    });
  });

  var app = express();

  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger());
  app.use(methodOverride());
  app.use(cookieParser());
  app.use(expressSession({ secret: 'keyboard cat', resave: true, saveUninitialized: false }));
  app.use(bodyParser.urlencoded({ extended : true }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);

  app.get('/', function(req, res) {
      res.render('index', { user: null });
  });

  var testList = {
    "alg1": {
      "original": "{id_token_alg_none: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX2FsZ19ub25lOiB0cnVlfQ"
    },
    "iss1": {
      "original": "{id_token_missing_iss: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX21pc3NpbmdfaXNzOiB0cnVlfQ"
    },
    "iss2": {
      "original": "{id_token_invalid_iss: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX2ludmFsaWRfaXNzOiB0cnVlfQ"
    },
    "sub1": {
      "original": "{id_token_missing_sub: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX21pc3Npbmdfc3ViOiB0cnVlfQ"
    },
    "sub2": {
      "original": "{id_token_invalid_sub: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX2ludmFsaWRfc3ViOiB0cnVlfQ"
    },
    "aud1": {
      "original": "{id_token_missing_aud: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX21pc3NpbmdfYXVkOiB0cnVlfQ"
    },
    "aud2": {
      "original": "{id_token_invalid_aud: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX2ludmFsaWRfYXVkOiB0cnVlfQ"
    },
    "exp1": {
      "original": "{id_token_missing_exp: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX21pc3NpbmdfZXhwOiB0cnVlfQ"
    },
    "exp2": {
      "original": "{id_token_expired: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX2V4cGlyZWQ6IHRydWV9"
    },
    "iat1": {
      "original": "{id_token_missing_iat: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX21pc3NpbmdfaWF0OiB0cnVlfQ"
    },
    "nonce1": {
      "original": "{id_token_missing_nonce: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX21pc3Npbmdfbm9uY2U6IHRydWV9"
    },
    "nonce2": {
      "original": "{id_token_invalid_nonce: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX2ludmFsaWRfbm9uY2U6IHRydWV9"
    },
    "azp1": {
      "original": "{id_token_multiple_aud_no_azp: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX211bHRpcGxlX2F1ZF9ub19henA6IHRydWV9"
    },
    "azp2": {
      "original": "{id_token_multiple_aud_invalid_azp: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX211bHRpcGxlX2F1ZF9pbnZhbGlkX2F6cDogdHJ1ZX0"
    },
    "nbf1": {
      "original": "{id_token_future_nbf: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX2Z1dHVyZV9uYmY6IHRydWV9"
    },
    "sig1": {
      "original": "{id_token_missing_signature: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX21pc3Npbmdfc2lnbmF0dXJlOiB0cnVlfQ"
    },
    "sig2": {
      "original": "{id_token_invalid_signature: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX2ludmFsaWRfc2lnbmF0dXJlOiB0cnVlfQ"
    },
    "at_hash1": {
      "original": "{id_token_missing_at_hash: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX21pc3NpbmdfYXRfaGFzaDogdHJ1ZX0"
    },
    "at_hash2": {
      "original": "{id_token_invalid_at_hash: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX2ludmFsaWRfYXRfaGFzaDogdHJ1ZX0"
    },
    "c_hash1": {
      "original": "{id_token_missing_c_hash: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX21pc3NpbmdfY19oYXNoOiB0cnVlfQ"
    },
    "c_hash2": {
      "original": "{id_token_invalid_c_hash: true}",
      "base64urlEncoded": "e2lkX3Rva2VuX2ludmFsaWRfY19oYXNoOiB0cnVlfQ"
    },
    "state1": {
      "original": "{auth_response_missing_state: true}",
      "base64urlEncoded": "e2F1dGhfcmVzcG9uc2VfbWlzc2luZ19zdGF0ZTogdHJ1ZX0"
    },
    "state2": {
      "original": "{auth_response_invalid_state: true}",
      "base64urlEncoded": "e2F1dGhfcmVzcG9uc2VfaW52YWxpZF9zdGF0ZTogdHJ1ZX0"
    },
    "code1": {
      "original": "{auth_response_missing_code: true}",
      "base64urlEncoded": "e2F1dGhfcmVzcG9uc2VfbWlzc2luZ19jb2RlOiB0cnVlfQ"
    },
    "code2": {
      "original": "{auth_response_invalid_code: true}",
      "base64urlEncoded": "e2F1dGhfcmVzcG9uc2VfaW52YWxpZF9jb2RlOiB0cnVlfQ"
    },
    "id_token_authResp": {
      "original": "{auth_response_missing_id_token: true}",
      "base64urlEncoded": "e2F1dGhfcmVzcG9uc2VfbWlzc2luZ19pZF90b2tlbjogdHJ1ZX0"
    },
    "access_token_authResp": {
      "original": "{auth_response_missing_access_token: true}",
      "base64urlEncoded": "e2F1dGhfcmVzcG9uc2VfbWlzc2luZ19hY2Nlc3NfdG9rZW46IHRydWV9"
    },
    "denied": {
      "original": "{auth_response_access_denied: true}",
      "base64urlEncoded": "e2F1dGhfcmVzcG9uc2VfYWNjZXNzX2RlbmllZDogdHJ1ZX0"
    },
    "id_token_tokenResp": {
      "original": "{token_response_missing_id_token: true}",
      "base64urlEncoded": "e3Rva2VuX3Jlc3BvbnNlX21pc3NpbmdfaWRfdG9rZW46IHRydWV9"
    },
    "access_token_tokenResp": {
      "original": "{token_response_missing_access_token: true}",
      "base64urlEncoded": "e3Rva2VuX3Jlc3BvbnNlX21pc3NpbmdfYWNjZXNzX3Rva2VuOiB0cnVlfQ"
    },
    "access_token_expired": {
      "original": "{token_response_expired_access_token: true}",
      "base64urlEncoded": "e3Rva2VuX3Jlc3BvbnNlX2V4cGlyZWRfYWNjZXNzX3Rva2VuOiB0cnVlfQ"
    }
  };

  var extraTokenReqQueryParams = null;

  app.get('/auth/:id', (req, res, next) => {
    req.logout();

    var id = req.params['id'];
    extraTokenReqQueryParams = null;

    passport.authenticate('azuread-openidconnect', { extraAuthReqQueryParams: { 'tParams': testList[id]["base64urlEncoded"] }, failureRedirect: '/result' })(req, res, next);
  }, (req, res) => {
    res.render('apiResult', { result: 'succeeded' });
  });

  app.get('/token/:id', (req, res, next) => {
    req.logout();

    var id = req.params['id'];
    extraTokenReqQueryParams = { 'tParams': testList[id]["base64urlEncoded"] };

    passport.authenticate('azuread-openidconnect', { failureRedirect: '/result' })(req, res, next);
  }, (req, res) => {
    res.render('apiResult', { result: 'succeeded' });
  });

  app.post('/auth/openid/return', (req, res, next) => {
      passport.authenticate('azuread-openidconnect', { extraTokenReqQueryParams: extraTokenReqQueryParams, failureRedirect: '/result'})(req, res, next);
    }, (req, res) => {
      res.render('apiResult', { result: 'succeeded' });
    }
  );

  app.get('/result', function(req, res) {
    res.render('apiResult', { result: 'failed' });
  });

  var server = app.listen(3000);
  enableGracefulShutdown(server);
  return server;
};


