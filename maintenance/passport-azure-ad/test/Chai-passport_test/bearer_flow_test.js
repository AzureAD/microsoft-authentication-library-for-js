/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/* eslint-disable no-new */

'use strict';

var chai = require('chai');
chai.use(require('chai-passport-strategy'));
var BearerStrategy = require('../../lib/index').BearerStrategy;

const TEST_TIMEOUT = 1000000; // 1000 seconds

var PemKey =
  "-----BEGIN RSA PUBLIC KEY-----\n" +
  "MIIBCgKCAQEAvbcFrj193Gm6zeo5e2/y54Jx49sIgScv+2JO+n6NxNqQaKVnMkHc\n" +
  "z+S1j2FfpFngotwGMzZIKVCY1SK8SKZMFfRTU3wvToZITwf3W1Qq6n+h+abqpyJT\n" +
  "aqIcfhA0d6kEAM5NsQAKhfvw7fre1QicmU9LWVWUYAayLmiRX6o3tktJq6H58pUz\n" +
  "Ttx/D0Dprnx6z5sW+uiMipLXbrgYmOez7htokJVgDg8w+yDFCxZNo7KVueUkLkxh\n" +
  "NjYGkGfnt18s7ZW036WoTmdaQmW4CChf/o4TLE5VyGpYWm7I/+nV95BBvwlzokVV\n" +
  "KzveKf3l5UU3c6PkGy+BB3E/ChqFm6sPWwIDAQAB\n" +
  "-----END RSA PUBLIC KEY-----";

var access_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlliUkFRUlljRV9tb3RXVkpLSHJ3TEJiZF85cyIsImtpZCI6IlliUkFRUlljRV9tb3RXVkpLSHJ3TEJiZF85cyJ9.eyJhdWQiOiJzcG46NjUxNGE4Y2EtZDllNC00MTU1LWIyOTItNjUyNTgzOThmM2FhIiwiaXNzIjoiaHR0cHM6Ly9zdHMud2luZG93cy5uZXQvMjY4ZGExYTEtOWRiNC00OGI5LWIxZmUtNjgzMjUwYmE5MGNjLyIsImlhdCI6MTQ2NzMxMTI0OCwibmJmIjoxNDY3MzExMjQ4LCJleHAiOjE0NjczMTUxNDgsImFjciI6IjEiLCJhbXIiOlsicHdkIl0sImFwcGlkIjoiYmViZmFkNTctZWZkNy00MTliLWI3NGItNGI5ZGFiN2JkNDcwIiwiYXBwaWRhY3IiOiIxIiwiZmFtaWx5X25hbWUiOiJvbmUiLCJnaXZlbl9uYW1lIjoicm9ib3QiLCJpcGFkZHIiOiIxMzEuMTA3LjE2MC4yMjYiLCJuYW1lIjoicm9ib3QgMSIsIm9pZCI6Ijc5MTJmZTdiLWI1YWItNDI1Yi1iYjFmLTBlODNiOTlmY2E3ZiIsInNjcCI6InVzZXJfaW1wZXJzb25hdGlvbiIsInN1YiI6Ikt1Mi1GdDlsWTlpMkJ2ZmhtcTQxNjZaSDNrV0g0V1h0bXpHOU0tOE1GYWMiLCJ0aWQiOiIyNjhkYTFhMS05ZGI0LTQ4YjktYjFmZS02ODMyNTBiYTkwY2MiLCJ1bmlxdWVfbmFtZSI6InJvYm90QHNpanVuLm9ubWljcm9zb2Z0LmNvbSIsInVwbiI6InJvYm90QHNpanVuLm9ubWljcm9zb2Z0LmNvbSIsInZlciI6IjEuMCJ9.VTg8AqnbSzfC7nUmf3xKnNrS_3BcOSGqz_CBPi6Th2piwNc--3Aq_K6SOt2QlbP7yni8IOqeY2ooqDgj0CvcvV3HHHHFatS7X8Kppg4z35lB4b67DJuIeHgCYYBR75qMVC1z5n4dgYGoNE-JNvlZZmaeHnrO8FAmQBKJUOrIyCNpoBjIsUXgXJKTPdL7HQL9nFz6h9sUmvbvpwqk1NgfmfTsJ0wHuSNHjHmryZ7vGnnjJHUC1zQmo9nesF0t7ad2Gk2RdlU93FbcZEW0hFE5Rtu0SbjOZAQdDVsBj_Voi7iQ_Kr-CnC14vuZ5kE9ACSMf2VG5wfcg6z4pyQdw-LpjQ";

var options = {
  identityMetadata: 'https://login.microsoftonline.com/xxx.onmicrosoft.com/.well-known/openid-configuration',
  clientID: '6514a8ca-d9e4-4155-b292-65258398f3aa',
  validateIssuer: true,
  passReqToCallback: false,
  ignoreExpiration: true,
};

var newStrategy = function(_options) {
  _options = Object.assign({}, options, _options)

  var strategy = new BearerStrategy(_options, function(req, token, done) {
    if (!done) {
      done = token;
      token = req;
      done(null, token.oid);
    }
    else {
      done(null, req);
    }
  });

  strategy.loadMetadata = function(params, next) {
    var metadata = {oidc: {issuer: 'https://sts.windows.net/268da1a1-9db4-48b9-b1fe-683250ba90cc/', algorithms: ['RS256']}};
    metadata.generateOidcPEM = ()=> { return PemKey; };
    return next(null, metadata);
  };

  return strategy;
};


describe('bearer flow', function() {
  this.timeout(TEST_TIMEOUT);

  context('passReqToCallback = true', function() {
    var req = null;

    before(function (done) {
      chai.passport
        .use(newStrategy({ passReqToCallback: true }))
        .success(function (r, u, i) {
          req = r;
          done();
        })
        .req(function (req) {
          req.headers.authorization = 'Bearer ' + access_token;
        })
        .authenticate();
    });

    it('should cause req to be passed to callback', function() {
      chai.expect(req.url).to.equal('/');
    });
  });

  context('with valid params', function() {
    var challenge = null;
    var user = null;

    before(function (done) {
      chai.passport
        .use(newStrategy())
        .success(function (u, i) {
          user = u;
          done();
        })
        .req(function (req) {
          req.headers.authorization = 'Bearer ' + access_token;
        })
        .fail(function (c) {
          challenge = c;
          done();
        })
        .authenticate();
    });

    it('should succeed', function() {
      chai.expect(user).to.equal('7912fe7b-b5ab-425b-bb1f-0e83b99fca7f');
    });
  });
});
