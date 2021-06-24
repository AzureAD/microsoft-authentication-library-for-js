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
  app.use(bodyParser.urlencoded({ extended : true }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);

  app.get('/', function(req, res) {
      res.render('index', { user: null });
  });

  app.get('/login', (req, res, next) => {
    req.logout();

    passport.authenticate('azuread-openidconnect', { response: res, failureRedirect: '/result' })(req, res, next);
  }, (req, res) => {
    res.render('apiResult', { result: 'succeeded' });
  });

  app.post('/auth/openid/return', (req, res, next) => {
      passport.authenticate('azuread-openidconnect', { response: res, failureRedirect: '/result' })(req, res, next);
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


