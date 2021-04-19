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
var CookieContentHandler = require('../../lib/cookieContentHandler').CookieContentHandler;

const TEST_TIMEOUT = 1000000; // 1000 seconds

var req = { get: () => 'test' };
var res = {};

res.cookie = function(cookieProperty, value, options) {
  if (!req.cookies)
    req.cookies = {};
  req.cookies[cookieProperty] = value;
  req.testOpts = options;
};

res.clearCookie = function(cookieProperty) {
  delete req.cookies[cookieProperty];
  delete req.testOpts;
};

var countCookie = function() {
  var number = 0;

  for (var cookie in req.cookies) {
    if (req.cookies.hasOwnProperty(cookie) & cookie.startsWith('passport-aad.'))
      number++;
  }

  return number;
};

var getFirstPassportCookie = function() {
  for (var cookie in req.cookies) {
    if (req.cookies.hasOwnProperty(cookie) & cookie.startsWith('passport-aad.'))
      return cookie;
  }

  return null;
};

describe('cookie test', function() {
  this.timeout(TEST_TIMEOUT);

  it('should pass adding and deleting cookies', function(done) {
    // create a handler
    var handler = new CookieContentHandler(2, 10, [ { key: '3zTvzr3p67VC61jmV54rIYu1545x4TlY', iv: '60iP0h6vJoEa' }, { key: '12345678901234567890123456789012', iv: '123456789012' } ], null, true);

    // clear request
    req = { get: () => 'test' };

    // set the first cookie
    handler.add(req, res, { state: '1', nonce: 'some nonce' });
    expect(countCookie()).to.equal(1);

    // check the cookie is encrypted
    var cookie = getFirstPassportCookie();
    // skip the passport-aad prefix and timestamp, check the encrypted content and authTag
    expect(cookie.substring(27)).equal('6ba133e675492c0c4fef3d2fb4bb2166fb246d29ed9f03372e7e647119de7676766e.f79b7a90af7173b807da797994f46be7');

    // set the second cookie
    handler.add(req, res, { state: '2', nonce: 'some nonce' });
    expect(countCookie()).to.equal(2);

    // set the third cookie, since we only allow two cookies, the first will be deleted
    handler.add(req, res, { state: '3', nonce: 'some nonce' });
    expect(countCookie()).to.equal(2);

    // try to find the first cookie, should not be there
    expect(handler.findAndDeleteTupleByState(req, res, '1')).to.equal(null);

    // try to find the second cookie, should be there and deleted after the retrieval
    expect(handler.findAndDeleteTupleByState(req, res, '2').state).to.equal('2');
    expect(countCookie()).to.equal(1);

    // try to find the third cookie, should be there and deleted after the retrieval
    expect(handler.findAndDeleteTupleByState(req, res, '3').state).to.equal('3');
    expect(countCookie()).to.equal(0);

    done();
  });

  it('should fail if no valid keys', function(done) {
    // create a handler
    var handler1 = new CookieContentHandler(2, 10, [ { key: '3zTvzr3p67VC61jmV54rIYu1545x4TlY', iv: '60iP0h6vJoEa' } ], null, true);
    var handler2 = new CookieContentHandler(2, 10, [ { key: '12345678901234567890123456789012', iv: '123456789012' } ], null, true);

    // clear request
    req = { get: () => 'test' };

    // set cookie using handler1
    handler1.add(req, res, { state: '1', nonce: 'some nonce' });
    expect(countCookie()).to.equal(1);

    // try to find the cookie using handler2, this should not work, we should still have the cookie in request
    expect(handler2.findAndDeleteTupleByState(req, res, '1')).to.equal(null);
    expect(countCookie()).to.equal(1);

    // try to find the cookie using handler1, this should work, we should have no cookie left in request
    expect(handler1.findAndDeleteTupleByState(req, res, '1').state).to.equal('1');
    expect(countCookie()).to.equal(0);

    done();
  });

  it('should throw if the constructor parameters are inappropriate', function(done) {
    var exception;

    // 1. wrong key size (key size != 32)

    try {
      new CookieContentHandler(2, 10, [ { key: '3zTvzr3p67VC61', iv: '60iP0h6vJoEa' }, { key: '12345678901234567890123456789012', iv: '123456789012' } ], null, true);
    } catch(ex) {
      exception = ex;
    }

    expect(exception.message).to.equal('CookieContentHandler: key number 1 is 14 bytes, expected: 32 bytes');

    // 2. wrong iv size (key size != 12)

    try {
      new CookieContentHandler(2, 10, [ { key: '3zTvzr3p67VC61jmV54rIYu1545x4TlY', iv: '60iP0h6vJoEa' }, { key: '12345678901234567890123456789012', iv: '123' } ], null, true);
    } catch(ex) {
      exception = ex;
    }

    expect(exception.message).to.equal('CookieContentHandler: iv number 2 is 3 bytes, expected: 12 bytes');

    // 3. wrong format ( not {key:, iv: } )

    try {
      new CookieContentHandler(2, 10, [ { key: '3zTvzr3p67VC61jmV54rIYu1545x4TlY' }, { key: '12345678901234567890123456789012', iv: '123' } ], null, true);
    } catch(ex) {
      exception = ex;
    }

    expect(exception.message).to.equal('CookieContentHandler: array item 1 in cookieEncryptionKeys must have the form { key: , iv: }');

    try {
      new CookieContentHandler(2, 10, [ { key: '3zTvzr3p67VC61jmV54rIYu1545x4TlY', iv: '60iP0h6vJoEa' }, { iv: '123' } ], null, true);
    } catch(ex) {
      exception = ex;
    }

    expect(exception.message).to.equal('CookieContentHandler: array item 2 in cookieEncryptionKeys must have the form { key: , iv: }');

    // 4. maxAmount, maxAge not positive number

    try {
      new CookieContentHandler(-1, 10, [ { key: '12345678901234567890123456789012', iv: '123456789012' } ], null, true);
    } catch(ex) {
      exception = ex;
    }

    expect(exception.message).to.equal('CookieContentHandler: maxAmount must be a positive integer');

    try {
      new CookieContentHandler(1, -1, [ { key: '12345678901234567890123456789012', iv: '123456789012' } ], null, true);
    } catch(ex) {
      exception = ex;
    }

    expect(exception.message).to.equal('CookieContentHandler: maxAge must be a positive number');

    done();
  });

  it('sets samesite cookies when expected', (done) => {
    // create a handler
    var handler1 = new CookieContentHandler(2, 10, [ { key: '3zTvzr3p56VC61jmV54rIYu1545x4TlY', iv: '60iP0h6vPoEa' } ], null, true);

    // clear request
    req = { get: () => 'test' };

    // set cookie using handler1
    handler1.add(req, res, { state: '1', nonce: 'some nonce' });
    expect(countCookie()).to.equal(1);
    expect(req.testOpts.sameSite).to.equal('none');

    // try to find the cookie using handler1, this should work, we should have no cookie left in request
    const cookie = handler1.findAndDeleteTupleByState(req, res, '1');
    expect(cookie.state).to.equal('1');
    expect(countCookie()).to.equal(0);

    done();
  });

  it('sets samesite cookies when not expected', (done) => {
    // create a handler
    var handler1 = new CookieContentHandler(2, 10, [ { key: '4zTvzr3p56VC61jmV54rIYu1545x4TlY', iv: '70iP0h6vPoEa' } ], null, false);

    // clear request
    req = { get: () => 'test' };

    // set cookie using handler1
    handler1.add(req, res, { state: '1', nonce: 'some nonce' });
    expect(countCookie()).to.equal(1);
    expect(req.testOpts.sameSite).to.be.undefined;

    // try to find the cookie using handler1, this should work, we should have no cookie left in request
    const cookie = handler1.findAndDeleteTupleByState(req, res, '1');
    expect(cookie.state).to.equal('1');
    expect(countCookie()).to.equal(0);

    done();
  });

  it('sets samesite cookies when not expected because of user agent', (done) => {
    // create a handler
    var handler1 = new CookieContentHandler(2, 10, [ { key: '4zTvzr3p56VC61jmV54rIYu1545x4TlY', iv: '70iP0h6vPoEa' } ], null, true);

    // clear request
    req = { get: () => 'iPad; CPU OS 12' };

    // set cookie using handler1
    handler1.add(req, res, { state: '1', nonce: 'some nonce' });
    expect(countCookie()).to.equal(1);
    expect(req.testOpts.sameSite).to.be.undefined;

    // try to find the cookie using handler1, this should work, we should have no cookie left in request
    const cookie = handler1.findAndDeleteTupleByState(req, res, '1');
    expect(cookie.state).to.equal('1');
    expect(countCookie()).to.equal(0);

    done();
  });
});
