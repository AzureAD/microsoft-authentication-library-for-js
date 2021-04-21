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
    's1': { 'JWE_alg': 'RSA1_5', 'JWE_alg_key_kid': 'rsa_key', 'JWE_enc': 'A128CBC-HS256'},
    's2': { 'JWE_alg': 'RSA-OAEP', 'JWE_alg_key_kid': 'rsa_key', 'JWE_enc': 'A128CBC-HS256'},
    's3': { 'JWE_alg': 'A128KW', 'JWE_alg_key_kid': 'sym_key_128', 'JWE_enc': 'A128CBC-HS256'},
    's4': { 'JWE_alg': 'A256KW', 'JWE_alg_key_kid': 'sym_key_256', 'JWE_enc': 'A128CBC-HS256'},
    's5': { 'JWE_alg': 'dir', 'JWE_alg_key_kid': 'sym_key_256', 'JWE_enc': 'A128CBC-HS256'},

    's6': { 'JWE_alg': 'RSA1_5', 'JWE_alg_key_kid': 'rsa_key', 'JWE_enc': 'A256CBC-HS512'},
    's7': { 'JWE_alg': 'RSA-OAEP', 'JWE_alg_key_kid': 'rsa_key', 'JWE_enc': 'A256CBC-HS512'},
    's8': { 'JWE_alg': 'A128KW', 'JWE_alg_key_kid': 'sym_key_128', 'JWE_enc': 'A256CBC-HS512'},
    's9': { 'JWE_alg': 'A256KW', 'JWE_alg_key_kid': 'sym_key_256', 'JWE_enc': 'A256CBC-HS512'},
    's10': { 'JWE_alg': 'dir', 'JWE_alg_key_kid': 'sym_key_512', 'JWE_enc': 'A256CBC-HS512'},

    's11': { 'JWE_alg': 'RSA1_5', 'JWE_alg_key_kid': 'rsa_key', 'JWE_enc': 'A192CBC-HS384'},
    's12': { 'JWE_alg': 'RSA-OAEP', 'JWE_alg_key_kid': 'rsa_key', 'JWE_enc': 'A192CBC-HS384'},
    's13': { 'JWE_alg': 'A128KW', 'JWE_alg_key_kid': 'sym_key_128', 'JWE_enc': 'A192CBC-HS384'},
    's14': { 'JWE_alg': 'A256KW', 'JWE_alg_key_kid': 'sym_key_256', 'JWE_enc': 'A192CBC-HS384'},
    's15': { 'JWE_alg': 'dir', 'JWE_alg_key_kid': 'sym_key_384', 'JWE_enc': 'A192CBC-HS384'},

    'f1': { 'JWE_alg': 'RSA1_5', 'JWE_alg_key_kid': 'rsa_key', 'JWE_enc': 'A128CBC-HS256', 'id_token_JWE_invalid_authTag': true },
    'f2': { 'JWE_alg': 'RSA1_5', 'JWE_alg_key_kid': 'rsa_key', 'JWE_enc': 'A256CBC-HS512', 'id_token_JWE_invalid_authTag': true },
  };

  app.get('/t/:id', (req, res, next) => {
    req.logout();
    var id = req.params['id'];
    var tParams = base64url.encode(JSON.stringify(testList[id]));
    passport.authenticate('azuread-openidconnect', { extraAuthReqQueryParams: { 'tParams': tParams }, failureRedirect: '/result' })(req, res, next);
  }, (req, res) => {
    res.render('apiResult', { result: 'succeeded' });
  });

  app.get('/t_no_kid/:id', (req, res, next) => {
    req.logout();
    var id = req.params['id'];
    var json = JSON.parse(JSON.stringify(testList[id]));  // make a copy
    json['id_token_JWE_header_no_kid'] = true;
    var tParams = base64url.encode(JSON.stringify(json));
    passport.authenticate('azuread-openidconnect', { extraAuthReqQueryParams: { 'tParams': tParams }, failureRedirect: '/result' })(req, res, next);
  }, (req, res) => {
    res.render('apiResult', { result: 'succeeded' });
  });

  app.post('/auth/openid/return', 
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/result'}),
    (req, res) => {
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


