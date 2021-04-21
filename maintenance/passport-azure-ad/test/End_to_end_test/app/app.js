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

module.exports = function(strategyOptions, authenicateOptions, verifyFuncNumber) {
  var express = require('express');
  var cookieParser = require('cookie-parser');
  var expressSession = require('express-session');
  var bodyParser = require('body-parser');
  var methodOverride = require('method-override');
  var passport = require('passport');
  var enableGracefulShutdown = require('server-graceful-shutdown');
  var OIDCStrategy = require('../../../lib/index').OIDCStrategy;
  var hasReq = strategyOptions.passReqToCallback;

  users = []; 
  var findBySub = function(sub, fn) {
    for (var i = 0, len = users.length; i < len; i++) {
      var user = users[i];
      if (user.sub === sub)
        return fn(null, user);
    }
    return fn(null, null);
  };

  const verifyArityArgsMap = {
    8: ['iss', 'sub', 'profile', 'jwtClaims', 'access_token', 'refresh_token', 'params', 'done'],
    7: ['iss', 'sub', 'profile', 'access_token', 'refresh_token', 'params', 'done'],
    6: ['iss', 'sub', 'profile', 'access_token', 'refresh_token', 'done'],
    4: ['iss', 'sub', 'profile', 'done'],
    3: ['iss', 'sub', 'done'],
    2: ['profile', 'done']
  };

  // we choose the 'function(profile, done)' or 'function(req, profile, done)' for the default verify callback
  if (!verifyFuncNumber)
    verifyFuncNumber = 2;

  // the verify function helper 
  var verifyFuncHelper = function () {
    var args = {};
    var length = hasReq ? (arguments.length - 1) : arguments.length;

    // save the stuff from arguments to args
    if (verifyArityArgsMap[length]) {
      for (let i = 0; i < length; i++)
        args[verifyArityArgsMap[length][i]] = hasReq ? arguments[i+1] : arguments[i];
    }

    // normalize the result
    if (length === 2)
      args.sub = args.profile.sub;
    args.access_token = args.access_token ? "exists" : "none";
    args.refresh_token = args.refresh_token ? "exists" : "none";
    args.profile = args.profile ? args.profile : { upn : 'none', oid : 'none'};

    findBySub(args.sub, (err, user) => {
      if (err)
        return done(err);
      if (!user) {
        users.push(args);
        return args.done(null, args);
      }
      return args.done(null, user);
    });
  };

  // register all the possible verify functions
  var funcs = {};
  if (!hasReq) {
    funcs[8] = function(iss, sub, profile, jwtClaims, access_token, refresh_token, params, done) {
      verifyFuncHelper.apply(null, arguments);
    };
    funcs[7] = function(iss, sub, profile, access_token, refresh_token, params, done) {
      verifyFuncHelper.apply(null, arguments);
    };
    funcs[6] = function(iss, sub, profile, access_token, refresh_token, done) {
      verifyFuncHelper.apply(null, arguments);
    };
    funcs[4] = function(iss, sub, profile, done) {
      verifyFuncHelper.apply(null, arguments);
    };
    funcs[3] = function(iss, sub, done) {
      verifyFuncHelper.apply(null, arguments);
    };
    funcs[2] = function(profile, done) {
      verifyFuncHelper.apply(null, arguments);
    };
  } else {
    funcs[8] = function(req, iss, sub, profile, jwtClaims, access_token, refresh_token, params, done) {
      verifyFuncHelper.apply(null, arguments);
    };
    funcs[7] = function(req, iss, sub, profile, access_token, refresh_token, params, done) {
      verifyFuncHelper.apply(null, arguments);
    };
    funcs[6] = function(req, iss, sub, profile, access_token, refresh_token, done) {
      verifyFuncHelper.apply(null, arguments);
    };
    funcs[4] = function(req, iss, sub, profile, done) {
      verifyFuncHelper.apply(null, arguments);
    };
    funcs[3] = function(req, iss, sub, done) {
      verifyFuncHelper.apply(null, arguments);
    };
    funcs[2] = function(req, profile, done) {
      verifyFuncHelper.apply(null, arguments);
    };    
  }

  var strategy = new OIDCStrategy(strategyOptions, funcs[verifyFuncNumber]);
  passport.use(strategy);
  passport.serializeUser(function(user, done) { done(null, user.sub); });
  passport.deserializeUser(function(sub, done) {
    findBySub(sub, function (err, user) {
      done(err, user);
    });
  });

  var indexPage = strategyOptions.isB2C ? 'index_b2c' : 'index';

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
  app.use(express.static(__dirname + '/../../public'));

  app.get('/', function(req, res) {
    console.log('##### homepage get called #####');
    res.render(indexPage, { user: req.user });
  });

  app.get('/result', function(req, res) {
    res.render('result', { user: req.user });
  });

  app.get('/login', passport.authenticate('azuread-openidconnect', { 
    tenantIdOrName: authenicateOptions.tenantIdOrName, 
    resourceURL: authenicateOptions.resourceURL, 
    customState: authenicateOptions.customState,
    prompt: authenicateOptions.prompt,
    domain_hint: authenicateOptions.domain_hint,
    login_hint: authenicateOptions.login_hint,
    extraReqQueryParams: authenicateOptions.extraReqQueryParams,
    failureRedirect: '/result' 
  }));

  app.get('/auth/openid/return',
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/result' }),
    function(req, res) {
      res.render('result', { user: req.user });
    });

  app.post('/auth/openid/return',
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/result' }),
    function(req, res) {
      res.render('result', { user: req.user });
    });

  var server = app.listen(3000);
  enableGracefulShutdown(server);
  return server;
};


