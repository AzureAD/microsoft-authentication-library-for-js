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

var chai = require('chai');
var expect = chai.expect;
var CONSTANTS = require('../../lib/constants');

const TEST_TIMEOUT = 1000000; // 1000 seconds

describe('policy checking', function() {
  this.timeout(TEST_TIMEOUT);

  it('should pass with good policy name', function(done) {
    expect(CONSTANTS.POLICY_REGEX.test('b2c_1_signin')).to.equal(true);
    expect(CONSTANTS.POLICY_REGEX.test('B2C_1_SIGNIN')).to.equal(true);
    expect(CONSTANTS.POLICY_REGEX.test('B2C_1_My.SIGNIN')).to.equal(true);
    expect(CONSTANTS.POLICY_REGEX.test('B2C_1_My_SIGNIN')).to.equal(true);
    expect(CONSTANTS.POLICY_REGEX.test('B2C_1_My-SIGNIN')).to.equal(true);
    expect(CONSTANTS.POLICY_REGEX.test('b2c_1a_signin')).to.equal(true);
    expect(CONSTANTS.POLICY_REGEX.test('B2C_1a_SIGNIN')).to.equal(true);
    expect(CONSTANTS.POLICY_REGEX.test('B2C_1a_My.SIGNIN')).to.equal(true);
    expect(CONSTANTS.POLICY_REGEX.test('B2C_1A_My_SIGNIN')).to.equal(true);
    expect(CONSTANTS.POLICY_REGEX.test('B2C_1A_My-SIGNIN')).to.equal(true);
    done();
  });

  it('should fail with bad policy name', function(done) {
    expect(CONSTANTS.POLICY_REGEX.test('signin')).to.equal(false);
    expect(CONSTANTS.POLICY_REGEX.test('b2c_SIGNIN')).to.equal(false);
    expect(CONSTANTS.POLICY_REGEX.test('b2c_1_')).to.equal(false);
    expect(CONSTANTS.POLICY_REGEX.test('b2c_1_*SIGNIN')).to.equal(false);
    expect(CONSTANTS.POLICY_REGEX.test('signin')).to.equal(false);
    expect(CONSTANTS.POLICY_REGEX.test('b2c_a_SIGNIN')).to.equal(false);
    expect(CONSTANTS.POLICY_REGEX.test('b2c_1A_')).to.equal(false);
    expect(CONSTANTS.POLICY_REGEX.test('b2c_1A_*SIGNIN')).to.equal(false);
    done();
  });
});
