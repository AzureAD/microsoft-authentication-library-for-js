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

'use strict';

var chai = require('chai');
var jws = require('jws');
var jwt = require('../../lib/jsonWebToken');

const TEST_TIMEOUT = 1000000; // 1000 seconds

const secret = "12345678901234567890123456789012"; // 512 bit symmetric key

describe('json web token test', function() {
  this.timeout(TEST_TIMEOUT);

  var signStream = jws.createSign(
  { 
    'header': { 'alg': 'HS256', 'typ': 'JWT'}, 
    'payload': { 'nbf': Date.now() / 1000, 'exp': Date.now() / 1000 +  300,  'iat': Date.now() / 1000, 'iss': 'https://example.com', 'aud': 'audience' }, 
    'secret': secret 
  });

  var jwtString = signStream.sign(); // create the corresponding json web token
  var options = { audience: 'audience', algorithms: ['HS256'], issuer: 'https://example.com' }; // validation options

  it('should fail with missing sub error', function(done) {
    jwt.verify(jwtString, secret, options, (err, token) => { chai.expect(err.message).to.equal('invalid sub value in payload'); done(); });
  });

  it('should succeed if testing access token', function(done) {
    options.isAccessToken = true;
    jwt.verify(jwtString, secret, options, (err, token) => { chai.expect(err).to.equal(null); done(); });
  });
});
