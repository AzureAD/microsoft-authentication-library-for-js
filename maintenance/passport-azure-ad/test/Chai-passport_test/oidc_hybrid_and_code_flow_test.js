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

/* eslint no-underscore-dangle: 0 */

var chai = require('chai');
var url = require('url');
chai.use(require('chai-passport-strategy'));

const TEST_TIMEOUT = 1000000; // 1000 seconds

var Metadata = require('../../lib/metadata').Metadata;
var OIDCStrategy = require('../../lib/index').OIDCStrategy;
var OAuth2 = require('../../node_modules/oauth/index').OAuth2;

var nonce = 'S2e+BeZvlK5mM2sQ';
var code = 'AQABAAAAAADRNYRQ3dhRSrm-4K-adpCJP_Q38QU-rrL8zGsv9WPZWE5W1tKo261T4pqLRklNO0VPKfDkkMVzgfR6vth8MvQUl4Ie89eg9mMlxQtuWAzJ6Ig6rJu-0cQyRYzV3F1qvmg6GUfnUK2zWkyHlqPuuC7XPgZxsVmOBuMpJSxrOdxeNiFlmYp3iYzuJ7HPKEG2gMxM4CTupcGU6idWDuQYJkBml4tvUtG-HAFNrNVTFlpCMyUVrwYJQGwp_kYtHLSF6nn9dO4hRVqV5t2n5ZiZtpiltEUlQsAnrFUKHD0VB7s8UgL7bgi74bCcHOHaFQCz4ofO6aX4JVKukQUYRjhVU_cOpqP_3f_DvqVbaZo-LDO5l-3A16OJI3JU4A1aoljgh9Q7r0wWcfmYX5rWR20OPkGmaVmbg-jdAqY7aQS-CkFotuZDrV4MZtv9pBCNMzLfaOsbhES_SKhtBVT8Ui2vNA4uNrYGnsCBTHxrXNBH7x2VP3bUceQcS60k-7rTfcvrkXR__SG7jeFjLeHNbVes7hfGHFjXZ2WjfYwNSXwp_RYdEXe03_iN7Phvj-F3JDbIgO5JyT6p8rHFg-RDHRsB1nIqf5-Z6s54YfYVy3J0NWOcJGoyk5xP91gfnXGqmg8wMNw7aXetaC4vN4DA63oMHYPn-Ckt8IO7rZnlzVVSYmHWLcd2Pj82KoiCrFmMMJ66X4IlpP6UtZkEejaqGbYfAseV8wc1ub342xp5LgjESvLTViAA';
var id_token_in_auth_resp = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlliUkFRUlljRV9tb3RXVkpLSHJ3TEJiZF85cyIsImtpZCI6IlliUkFRUlljRV9tb3RXVkpLSHJ3TEJiZF85cyJ9.eyJhdWQiOiIyYWJmM2E1Mi03ZDg2LTQ2MGItYTFlZi03N2RjNDNkZThhYWQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC8yNjhkYTFhMS05ZGI0LTQ4YjktYjFmZS02ODMyNTBiYTkwY2MvIiwiaWF0IjoxNDcxNDY4MTY2LCJuYmYiOjE0NzE0NjgxNjYsImV4cCI6MTQ3MTQ3MjA2NiwiYW1yIjpbInB3ZCJdLCJjX2hhc2giOiJpb2FNU1h6MXFhOTdOMlZoUmVmSzVRIiwiZmFtaWx5X25hbWUiOiJvbmUiLCJnaXZlbl9uYW1lIjoicm9ib3QiLCJpcGFkZHIiOiIxNjcuMjIwLjEuMTYwIiwibmFtZSI6InJvYm90IDEiLCJub25jZSI6IlMyZStCZVp2bEs1bU0yc1EiLCJvaWQiOiI3OTEyZmU3Yi1iNWFiLTQyNWItYmIxZi0wZTgzYjk5ZmNhN2YiLCJwd2RfZXhwIjoiNDI5OTIzIiwicHdkX3VybCI6Imh0dHBzOi8vcG9ydGFsLm1pY3Jvc29mdG9ubGluZS5jb20vQ2hhbmdlUGFzc3dvcmQuYXNweCIsInN1YiI6IjFKTWR6T3hKeVdlQ29jNVFzWXZEUGNvWnRxaHVXSVp4Z21IbkN6UVRYYVEiLCJ0aWQiOiIyNjhkYTFhMS05ZGI0LTQ4YjktYjFmZS02ODMyNTBiYTkwY2MiLCJ1bmlxdWVfbmFtZSI6InJvYm90QHNpanVuLm9ubWljcm9zb2Z0LmNvbSIsInVwbiI6InJvYm90QHNpanVuLm9ubWljcm9zb2Z0LmNvbSIsInZlciI6IjEuMCJ9.NnYMS-lTTgSCFb69IwnoTpCap-4DCUVindUvrvHHOUlS7iHqDC-gzOvAvxwj5MzhE4TOCwkx0smhl1X7ZouiX0gJAmPbge4nlyTRMY7AaaY17xtHcLW8NWzixJX7hDBlV7FJp-GFD03rxTcK4uUzSbFJSnKtotsDpnVfnGP5Tmr4R9pgI8Xs-j2INOD52REAgQxAILqABUojRuD4vt77JzJdasmcZqf0OkZIWUWGK0_1u_pZVS6DwzscpA-E-om8im3S6VXkeygDVvGawxELasM04zOuhw6P3_GM1tCFfq3P-4zBYYA0HSn3g_tkjzZCAuQEsaF4vvjhLNDw72A7dw';
var id_token_in_token_resp = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlliUkFRUlljRV9tb3RXVkpLSHJ3TEJiZF85cyIsImtpZCI6IlliUkFRUlljRV9tb3RXVkpLSHJ3TEJiZF85cyJ9.eyJhdWQiOiIyYWJmM2E1Mi03ZDg2LTQ2MGItYTFlZi03N2RjNDNkZThhYWQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC8yNjhkYTFhMS05ZGI0LTQ4YjktYjFmZS02ODMyNTBiYTkwY2MvIiwiaWF0IjoxNDcxNDY4MjI4LCJuYmYiOjE0NzE0NjgyMjgsImV4cCI6MTQ3MTQ3MjEyOCwiYW1yIjpbInB3ZCJdLCJmYW1pbHlfbmFtZSI6Im9uZSIsImdpdmVuX25hbWUiOiJyb2JvdCIsImlwYWRkciI6IjE2Ny4yMjAuMC4xNjAiLCJuYW1lIjoicm9ib3QgMSIsIm5vbmNlIjoiUzJlK0JlWnZsSzVtTTJzUSIsIm9pZCI6Ijc5MTJmZTdiLWI1YWItNDI1Yi1iYjFmLTBlODNiOTlmY2E3ZiIsInB3ZF9leHAiOiI0Mjk4NjEiLCJwd2RfdXJsIjoiaHR0cHM6Ly9wb3J0YWwubWljcm9zb2Z0b25saW5lLmNvbS9DaGFuZ2VQYXNzd29yZC5hc3B4Iiwic3ViIjoiMUpNZHpPeEp5V2VDb2M1UXNZdkRQY29adHFodVdJWnhnbUhuQ3pRVFhhUSIsInRpZCI6IjI2OGRhMWExLTlkYjQtNDhiOS1iMWZlLTY4MzI1MGJhOTBjYyIsInVuaXF1ZV9uYW1lIjoicm9ib3RAc2lqdW4ub25taWNyb3NvZnQuY29tIiwidXBuIjoicm9ib3RAc2lqdW4ub25taWNyb3NvZnQuY29tIiwidmVyIjoiMS4wIn0.HI7-g9-vRcpOXxkVOHXe42-NzIoHEwJohIRFaOScEj4uKYetnflIELbWrIxzVWw1U6p5n-Py6PcduR6xJ5r5R5YNbDvc-cc5XN3xfD3FiZjDRxgcYuLVIkSMK8y1BqG3suHurs09ijS7OKI4WHBDKbDKaCmOC4SILgplaHBD0O0Dmg5nc2WaZVi2A1kFDHoscKBNRKEcq4LOnRAgF85R3lrW_fCSIgIPgi-tQ0xDaSmXO3TO4E1Jw5rfgbySebyaJrb1GPZSacA4W4rrKFYJ_1XFJxcOGvGhjLzvV1yInxQgw5XPecVg4cT2wPTPwOVWcvuE496nv6i1YDetSr0ndA';
var id_token_in_auth_resp_wrong_signature = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlliUkFRUlljRV9tb3RXVkpLSHJ3TEJiZF85cyIsImtpZCI6IlliUkFRUlljRV9tb3RXVkpLSHJ3TEJiZF85cyJ9.eyJhdWQiOiIyYWJmM2E1Mi03ZDg2LTQ2MGItYTFlZi03N2RjNDNkZThhYWQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC8yNjhkYTFhMS05ZGI0LTQ4YjktYjFmZS02ODMyNTBiYTkwY2MvIiwiaWF0IjoxNDcxNDY4MTY2LCJuYmYiOjE0NzE0NjgxNjYsImV4cCI6MTQ3MTQ3MjA2NiwiYW1yIjpbInB3ZCJdLCJjX2hhc2giOiJpb2FNU1h6MXFhOTdOMlZoUmVmSzVRIiwiZmFtaWx5X25hbWUiOiJvbmUiLCJnaXZlbl9uYW1lIjoicm9ib3QiLCJpcGFkZHIiOiIxNjcuMjIwLjEuMTYwIiwibmFtZSI6InJvYm90IDEiLCJub25jZSI6IlMyZStCZVp2bEs1bU0yc1EiLCJvaWQiOiI3OTEyZmU3Yi1iNWFiLTQyNWItYmIxZi0wZTgzYjk5ZmNhN2YiLCJwd2RfZXhwIjoiNDI5OTIzIiwicHdkX3VybCI6Imh0dHBzOi8vcG9ydGFsLm1pY3Jvc29mdG9ubGluZS5jb20vQ2hhbmdlUGFzc3dvcmQuYXNweCIsInN1YiI6IjFKTWR6T3hKeVdlQ29jNVFzWXZEUGNvWnRxaHVXSVp4Z21IbkN6UVRYYVEiLCJ0aWQiOiIyNjhkYTFhMS05ZGI0LTQ4YjktYjFmZS02ODMyNTBiYTkwY2MiLCJ1bmlxdWVfbmFtZSI6InJvYm90QHNpanVuLm9ubWljcm9zb2Z0LmNvbSIsInVwbiI6InJvYm90QHNpanVuLm9ubWljcm9zb2Z0LmNvbSIsInZlciI6IjEuMCJ9.NnYMS-lTTgSCFb69IwnoTpCap-4DCUVindUvrvHHOUlS7iHqDC-gzOvAvxwj5MzhE4TOCwkx0smhl1X7ZouiX0gJAmPbge4nlyTRMY7AaaY17xtHcLW8NWzixJX7hDBlV7FJp-GFD03rxTcK4uUzSbFJSnKtotsDpnVfnGP5Tmr4R9pgI8Xs-j2INOD52REAgQxAILqABUojRuD4vt77JzJdasmcZqf0OkZIWUWGK0_1u_pZVS6DwzscpA-E-om8im3S6VXkeygDVvGawxELasM04zOuhw6P3_GM1tCFfq3P-4zBYYA0HSn3g_tkjzZCAuQEsaF4vvjhLNDw72A7dW';
var id_token_in_token_resp_wrong_sub = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlliUkFRUlljRV9tb3RXVkpLSHJ3TEJiZF85cyIsImtpZCI6IlliUkFRUlljRV9tb3RXVkpLSHJ3TEJiZF85cyJ9.eyJhdWQiOiIyYWJmM2E1Mi03ZDg2LTQ2MGItYTFlZi03N2RjNDNkZThhYWQiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC8yNjhkYTFhMS05ZGI0LTQ4YjktYjFmZS02ODMyNTBiYTkwY2MvIiwiaWF0IjoxNDcxNDg2MDY3LCJuYmYiOjE0NzE0ODYwNjcsImV4cCI6MTQ3MTQ4OTk2NywiYW1yIjpbInB3ZCJdLCJnaXZlbl9uYW1lIjoicm9ib3QzIiwiaXBhZGRyIjoiMTY3LjIyMC4xLjE2MCIsIm5hbWUiOiJyb2JvdDMiLCJub25jZSI6IlMyZStCZVp2bEs1bU0yc1EiLCJvaWQiOiI0ZTRjMjFjZi0zNTU5LTQ5MDEtYjRiYi03OWYzMDQyMWYyMzgiLCJzdWIiOiJQZG45TlNGZkQ5ZHdnXzdVeXQyY01PQ21kaWYyWG55RW1IUFFONVE0SjNBIiwidGlkIjoiMjY4ZGExYTEtOWRiNC00OGI5LWIxZmUtNjgzMjUwYmE5MGNjIiwidW5pcXVlX25hbWUiOiJyb2JvdDNAc2lqdW4ub25taWNyb3NvZnQuY29tIiwidXBuIjoicm9ib3QzQHNpanVuLm9ubWljcm9zb2Z0LmNvbSIsInZlciI6IjEuMCJ9.tbYOLL_X77wpEermfk7U-VYmcHpnColCtUoRjaIUOUSG3o3x2GrjWqBwrj6u69Vjxgv7dAcFGebNhVFSD3MlXzf0n5kd7s5zs9-g3MTxcABlHvPn2vwNEXK8vkVQkrEeMsKAXc1xm-3w6Uh2bCnlMzOMJXqrxpzsmAOUgzJT6xAPzZZHKmMdlt8Q-kVm2lKQbcg8TuUre6e9CYIUtGi1mKsdgD8W6hVllkgyNxzhHKZp_LgRpn6y0wiz5JDPhuhv7iRsUVk5_R6lpH2cuuDcZqYvGBGkwnbLR9Kin-bh4t9ses03uPn-o8gZjxgPE0yQXoPlgw06Yu6o94L3Uo4BIQ';
var access_token = 'AQABAAAAAADRNYRQ3dhRSrm-4K-adpCJ6KNePaAkgUzyI8wn5NTUSkfVlY2ZiKFn1vF-kA7G1cguxn_guaoE4Oj7sCCXBRPB-q0ROQEsAfAJIelDFcbOryCJyIm1Rgk9XDJMcol3hio2J5Q0_ja2D2xY3o24Ny9jhdUe5L-zR6MChyew9K_l90i7IRhFJXHS8pySbRk8HUEitiYklC7emsudlHWnLZTBYRwqvW7CI7HUKL89BECM23291FZ98pEc12MmN6rRTCfsFkh7H37H7uBJNrviBO7MOnS5J1KWmQrH1Amn0wmuL1KYpOFB6Drl730jguN4VZjNKGN14GRdqJvmnvN6zTsnCtxs9xpqd0fBO-v9fIdpJfx8i75D0ule_jIIe8BffL2V0n_aJHw74aAjFcHpoS_WSVzOL121UiSygS4XrBtttSgqUEeaVoCp3k0JkXdZicSezu7sMqH27jxdyBJeDsGiIqXtRGMTObLu_lCsqC-WB_tchEUeaketerawPudhvXQKrjBs4RlzrizCEBKdl1M7IAA';
var refresh_token = 'AQABAAAAAADRNYRQ3dhRSrm-4K-adpCJx5jvcZSRjvpKPiMc2qvkrT6brLnmLUHEgB9AQyp1doHbd1cyQQduFg6lSpO4nIrIANpnzo1E0-hRV99jhOxAm82QnUnlYrQ1nLLUFrQ9QR5KY0YRSTMltM3gy8H84qGJHX75SJjhYWRTIH9ha1XvfMp2oWxfQjdhrwqfYgfa2u180e3xbSJM0wnkETiEpeIV20hNelt6vI_-BbHceXmD29SElixZl1QLohpjIUBhlz2FO0bYDqvJ9XOM_30zrCWCMXVD1hd4onAboNR6px6W2w8Olc0TNJ-0Dz8yQf1UixnJx6bqKZeWoZhq6A4UqqlwY3ExTVeX9qiS6k4UQO-q9NJyA0MagGBlFAwgxXEWnc1rQu6it-ZCtKfKD480kyOaK_M0XYFhgc5jTWzqOIx4Vc7L32yfh5ZcHSlL5eZccxbBDSN3TNsHDKohrtd-GYst98MXUWc-bHBGfDNaRKRjpRe2pQ7sWSdcOq7qovbdkjrmhArQsnIupSxRgTbXuu5TeU21zB25rosnhgCga-JAsrFJTm6gOKmlcPJF7nuLV3NE2DcliMh4QgTStDJ7tSuP_94voiCQ0zYUhnejRRpTrza5kUVqQs0s7hZwKgYs6TM-4nrEaGi9RgObvgJAIrljYzN8s2JYu1l27OWrSzEbtYGx4uroeuJhlCn_dobsgmwgAA';
var userInfoURL = 'https://login.microsoftonline.com/268da1a1-9db4-48b9-b1fe-683250ba90cc/openid/userinfo?schema=openid';

// Mock the process of getting PEMkey
var PEMkey = "-----BEGIN RSA PUBLIC KEY-----\n\
MIIBCgKCAQEAvbcFrj193Gm6zeo5e2/y54Jx49sIgScv+2JO+n6NxNqQaKVnMkHc\n\
z+S1j2FfpFngotwGMzZIKVCY1SK8SKZMFfRTU3wvToZITwf3W1Qq6n+h+abqpyJT\n\
aqIcfhA0d6kEAM5NsQAKhfvw7fre1QicmU9LWVWUYAayLmiRX6o3tktJq6H58pUz\n\
Ttx/D0Dprnx6z5sW+uiMipLXbrgYmOez7htokJVgDg8w+yDFCxZNo7KVueUkLkxh\n\
NjYGkGfnt18s7ZW036WoTmdaQmW4CChf/o4TLE5VyGpYWm7I/+nV95BBvwlzokVV\n\
KzveKf3l5UU3c6PkGy+BB3E/ChqFm6sPWwIDAQAB\n\
-----END RSA PUBLIC KEY-----\n\
";

/*
 * test strategy (for response_type = 'id_token') which checks the expiration of id_token
 */

var options = {
  redirectUrl: 'https://localhost:3000/auth/openid/return',
  clientID: '2abf3a52-7d86-460b-a1ef-77dc43de8aad',
  clientSecret: 'secret',
  identityMetadata: 'https://login.microsoftonline.com/sijun.onmicrosoft.com/.well-known/openid-configuration',
  responseType: 'id_token code',
  responseMode: 'form_post',
  validateIssuer: true,
  passReqToCallback: false,
  sessionKey: 'my_key',
  oidcIssuer: 'https://sts.windows.net/268da1a1-9db4-48b9-b1fe-683250ba90cc/',
  ignoreExpiration: true,
  audience: null,
  algorithms: ['RS256']
};

// functions used to change the fields in options
var setIgnoreExpirationFalse = function(options) { options.ignoreExpiration = false; };
var setWrongIssuer = function(options) { options.issuer = 'wrong_issuer'; };
var rmValidateIssuer = function(options) { options.validateIssuer = undefined; };
var setWrongAudience = function(options) { options.audience = 'wrong_audience'; };

var testStrategy = new OIDCStrategy(options, function(profile, done) {
    done(null, profile.upn);
});

// mock the userinfo endpoint response
var setUserInfoResponse = function(sub_choice) {
  if (sub_choice === 'use_valid_sub') {
    return () => {
      OAuth2.prototype.get = function(url, access_token, callback) {
        var userInfoBody = '{"sub":"1JMdzOxJyWeCoc5QsYvDPcoZtqhuWIZxgmHnCzQTXaQ", "upn":"robot@sijun.onmicrosoft.com"}';
        callback(null, userInfoBody);
      };
    };
  } else {
    return () => {
      OAuth2.prototype.get = function(url, access_token, callback) {
        var userInfoBody = '{"sub":"invalid sub", "upn":"robot@sijun.onmicrosoft.com"}';
        callback(null, userInfoBody);
      };
    };
  }
};

// mock the token response we want when we consume the code
var setTokenResponse = function(id_token_in_token_resp, access_token_in_token_resp) {
  return () => {
    testStrategy._getAccessTokenBySecretOrAssertion = function(code, oauthConfig, next, callback) {
      var params = {
        'id_token': id_token_in_token_resp, 
        'token_type': 'Bearer',
        'access_token': access_token_in_token_resp,
        'refresh_token': refresh_token
      };
      callback(null, params);
    }
  };
};

// used to remember the error message in self.fail
var challenge;
// used to remember the 'user' when we successfully log in
var user;

// mock the request (resulting request from the 302 redirection response) by putting 
// id_token and code into the body, and state and nonce into the session
var setReqFromAuthRespRedirect = function(id_token_in_auth_resp, code_in_auth_resp, nonce_to_use, action) {
  return function(done) {
    // Mock `setOptions` 
    testStrategy.setOptions = function(params, oauthConfig, optionsToValidate, done) {
      params.metadata.generateOidcPEM = () => { return PEMkey; };

      optionsToValidate.validateIssuer = true;
      optionsToValidate.issuer = 'https://sts.windows.net/268da1a1-9db4-48b9-b1fe-683250ba90cc/';
      optionsToValidate.audience = '2abf3a52-7d86-460b-a1ef-77dc43de8aad';
      optionsToValidate.allowMultiAudiencesInToken = false;
      optionsToValidate.ignoreExpiration = true;
      optionsToValidate.algorithms = ['RS256'];
      optionsToValidate.nonce = nonce_to_use;
      optionsToValidate.clockSkew = testStrategy._options.clockSkew;

      oauthConfig.authorization_endpoint = "https://login.microsoftonline.com/268da1a1-9db4-48b9-b1fe-683250ba90cc/oauth2/authorize";
      oauthConfig.redirectUrl = "http://localhost:3000/auth/openid/return";
      oauthConfig.clientID = "2abf3a52-7d86-460b-a1ef-77dc43de8aad";
      oauthConfig.token_endpoint = "https://login.microsoftonline.com/268da1a1-9db4-48b9-b1fe-683250ba90cc/oauth2/token";
      oauthConfig.userinfo_endpoint = "https://login.microsoftonline.com/268da1a1-9db4-48b9-b1fe-683250ba90cc/openid/userinfo";

      if (action) {
        for (let i = 0; i < action.length; i++)
          action[i](optionsToValidate);
      }
      return done();
    };

    chai.passport
      .use(testStrategy)
      .fail(function(c) {
        challenge = c; done();
      })
      .error(function(e) {
        done();
      })
      .success(function(u) {
        user = u; done();
      })
      .req(function(req) {
        // reset the value of challenge and user
        challenge = user = undefined;
        var time = Date.now();
        // add state and nonce to session
        req.session = {'my_key': {'content': [{'state': 'my_state', 'nonce': nonce_to_use, 'policy': undefined, 'timeStamp': time}]}}; 
        // add id_token and state to body
        req.body = {'id_token': id_token_in_auth_resp , 'code' : code_in_auth_resp, 'state' : 'my_state'}; 
        // empty query
        req.query = {};
      })
      .authenticate({});
  };
};


/* 
 * Begin the testing
 *
 */

describe('OIDCStrategy hybrid flow test', function() {
  this.timeout(TEST_TIMEOUT);

  /*
   * success if we ignore the expiration
   */

  describe('success', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp, code, nonce, 
      [setTokenResponse(id_token_in_token_resp, access_token), setUserInfoResponse('use_valid_sub')]));

    it('should succeed with expected user', function() {
      chai.expect(user).to.equal('robot@sijun.onmicrosoft.com');
    });
  });

  /*
   * test the incoming request with id_token and code, make sure test fail if
   * (1) wrong nonce
   * (2) invalid c_hash
   * (3) id_token expired
   * (4) id_token signature is invalid
   * (5) wrong issuer
   * (6) wrong audience
   */

  describe('fail: wrong nonce', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp, code, 'wrong_nonce'));

    it('should fail with wrong nonce', function() {
      chai.expect(challenge).to.equal('In _validateResponse: invalid nonce');
    });
  });

  describe('fail: invalid c_hash', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp, 'wrong_code', nonce));

    it('should fail with invalid c_hash', function() {
      chai.expect(challenge).to.equal('In _validateResponse: invalid c_hash');
    });
  });

  describe('fail: expired id_token', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp, code, nonce, [setIgnoreExpirationFalse]));

    it('should fail with expired id_token', function() {
      chai.expect(challenge).to.equal('In _validateResponse: jwt is expired');
    });
  });

  describe('fail: invalid signature in id_token', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp_wrong_signature, code, nonce));

    it('should fail with invalid signature in id_token', function() {
      chai.expect(challenge).to.equal('In _validateResponse: invalid signature');
    });
  });

  describe('fail: invalid issuer', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp, code, nonce, [setWrongIssuer]));

    it('should fail with invalid issuer', function() {
      chai.expect(challenge).to.equal('In _validateResponse: jwt issuer is invalid');
    });
  });

  describe('fail: invalid audience', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp, code, nonce, [setWrongAudience]));

    it('should fail with invalid audience', function() {
      chai.expect(challenge).to.equal('In _validateResponse: jwt audience is invalid');
    });
  });

  /*
   * test the access_token, id_token received from code consumpution, make sure test fail if we get
   * (1) invalid at_hash  // @TODO cannot get an id_token that contains at_hash from AAD using
   *                      // the response_type we supported in passport-azure-ad
   * (2) wrong issuer/sub
   */

  describe('fail: invalid sub in id_token in token response', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp, code, nonce, 
      [setTokenResponse(id_token_in_token_resp_wrong_sub, access_token)]));

    it('should fail with invalid sub in id_token', function() {
      chai.expect(challenge).to.equal('In _authCodeFlowHandler: After redeeming the code, sub in id_token from authorize_endpoint does not match sub in id_token from token_endpoint');
    });
  });

  /*
   * userInfo test, make sure test fail if 
   * (1) no access_token
   * (2) useInfo has a different sub from the one in id_token
   */

  describe('success', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp, code, nonce, 
      [setTokenResponse(id_token_in_token_resp, access_token)]));

    it('should succeed with expected user', function() {
      chai.expect(user).to.equal('robot@sijun.onmicrosoft.com');
    });
  });

  describe('fail: missing access_token', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp, code, nonce, 
      [setTokenResponse(id_token_in_token_resp, null)]));

    it('should fail with access_token missing', function() {
      chai.expect(challenge).to.equal('In _authCodeFlowHandler: we want to access userinfo endpoint, but access_token is not received');
    });
  });

  describe('fail: invalid sub in userinfo', function() {
    before(setReqFromAuthRespRedirect(id_token_in_auth_resp, code, nonce, 
      [setTokenResponse(id_token_in_token_resp, access_token), 
        setUserInfoResponse('use_invalid_sub')]));

    it('should fail with invalid sub in userInfo', function() {
      chai.expect(challenge).to.equal('In _authCodeFlowHandler: sub received in userinfo and id_token do not match');
    });
  });
});

describe('OIDCStrategy authorization code flow test', function() {
  this.timeout(TEST_TIMEOUT);

  /*
   * success if we ignore the expiration
   */

  describe('success', function() {
    before(setReqFromAuthRespRedirect(null, code, nonce, 
      [setTokenResponse(id_token_in_token_resp, access_token), setUserInfoResponse('use_valid_sub')]));

    it('should succeed with expected user', function() {
      chai.expect(user).to.equal('robot@sijun.onmicrosoft.com');
    });
  });

  /*
   * test the incoming request with id_token and code, make sure test fail if
   * (1) wrong nonce
   * (2) id_token expired
   * (3) id_token signature is invalid
   * (4) wrong issuer
   * (5) wrong audience
   */

  describe('fail: wrong nonce', function() {
    before(setReqFromAuthRespRedirect(null, code, 'wrong_nonce'));

    it('should fail with wrong nonce', function() {
      chai.expect(challenge).to.equal('In _validateResponse: invalid nonce');
    });
  });

  describe('fail: expired id_token', function() {
    before(setReqFromAuthRespRedirect(null, code, nonce, 
      [setIgnoreExpirationFalse]));

    it('should fail with expired id_token', function() {
      chai.expect(challenge).to.equal('In _validateResponse: jwt is expired');
    });
  });

  describe('fail: invalid issuer', function() {
    before(setReqFromAuthRespRedirect(null, code, nonce, 
      [setWrongIssuer]));

    it('should fail with invalid issuer', function() {
      chai.expect(challenge).to.equal('In _validateResponse: jwt issuer is invalid');
    });
  });

  describe('fail: invalid audience', function() {
    before(setReqFromAuthRespRedirect(null, code, nonce, 
      [setWrongAudience]));

    it('should fail with invalid audience', function() {
      chai.expect(challenge).to.equal('In _validateResponse: jwt audience is invalid');
    });
  });

  describe('fail: invalid signature in id_token', function() {
    before(setReqFromAuthRespRedirect(null, code, nonce, 
      [setTokenResponse(id_token_in_auth_resp_wrong_signature, access_token)]));

    it('should fail with invalid signature in id_token', function() {
      chai.expect(challenge).to.equal('In _validateResponse: invalid signature');
    });
  });

  /*
   * userinfo test, make sure test fail if we have no access_token at hand
   */

  describe('success', function() {
    before(setReqFromAuthRespRedirect(null, code, nonce, 
      [setTokenResponse(id_token_in_token_resp, access_token)]));

    it('should succeed with expected user', function() {
      chai.expect(user).to.equal('robot@sijun.onmicrosoft.com');
    });
  });

  describe('fail: access_token is not received', function() {
    before(setReqFromAuthRespRedirect(null, code, nonce, 
      [setTokenResponse(id_token_in_token_resp, null)]));

    it('should fail with access_token missing', function() {
      chai.expect(challenge).to.equal('In _authCodeFlowHandler: we want to access userinfo endpoint, but access_token is not received');
    });
  });

  describe('fail: invalid sub in userinfo', function() {
    before(setReqFromAuthRespRedirect(null, code, nonce, 
      [setTokenResponse(id_token_in_token_resp, access_token), 
        setUserInfoResponse('use_invalid_sub')]));

    it('should fail with invalid sub in userInfo', function() {
      chai.expect(challenge).to.equal('In _authCodeFlowHandler: sub received in userinfo and id_token do not match');
    });
  });
});
