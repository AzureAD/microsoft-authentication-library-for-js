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

const fs = require('fs');
const pem = require('../../lib/pem');
const correctKeyOrCert = require('../resource/correctKeyOrCert');

/*
 ======== A Handy Little Nodeunit Reference ========
 https://github.com/caolan/nodeunit

 Test methods:
 test.expect(numAssertions)
 test.done()
 Test assertions:
 test.ok(value, [message])
 test.equal(actual, expected, [message])
 test.notEqual(actual, expected, [message])
 test.deepEqual(actual, expected, [message])
 test.notDeepEqual(actual, expected, [message])
 test.strictEqual(actual, expected, [message])
 test.notStrictEqual(actual, expected, [message])
 test.throws(block, [error], [message])
 test.doesNotThrow(block, [error], [message])
 test.ifError(value)
 */

var extractAndCompare = function(extractFunc, pemFileName, correctValue) {
  var pem = null;
  var pemKeyOrCert = null;

  try {
    pem = fs.readFileSync(__dirname + '/../resource/' + pemFileName, 'utf8');
  } catch (e) {
    return { pass: false, message: e.message};
  }

  try {
    pemKeyOrCert = extractFunc(pem);
  } catch (e) {
    return { pass: false, message: e.message};
  }

  return {pass: pemKeyOrCert === correctValue, message: 'should be the same key/certificate'};
};

exports.pemTest = {

  'get private key': (test) => {
    test.expect(1);
    var result = extractAndCompare(pem.getPrivateKey, 'private.pem', correctKeyOrCert.privateKey);
    test.ok(result.pass, result.message);
    test.done();
  },

  'get certificate': (test) => {
    test.expect(1);
    var result = extractAndCompare(pem.getCertificate, 'public.pem', correctKeyOrCert.certificate);
    test.ok(result.pass, result.message);
    test.done();
  },

  'test certToPem': (test) => {
    test.expect(1);
    var pemContent = pem.certToPEM('myCertificate');

    var result = (function() {
      var certificate = null;
      try {
        certificate = pem.getCertificate(pemContent);
      } catch (e) {
        return {pass: false, message: e.message};
      }
      return {pass: certificate === 'myCertificate', message: 'should get the same certificate'};
    }());

    test.ok(result.pass, result.message);
    test.done();
  }
}
