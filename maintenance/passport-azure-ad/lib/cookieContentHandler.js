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

'use restrict';

var crypto = require('crypto');
var createBuffer = require('./jwe').createBuffer;
var sameSiteNotAllowed = require('./aadutils').sameSiteNotAllowed;

/*
 * the handler for state/nonce/policy
 * @maxAmount          - the max amount of {state: x, nonce: x, policy: x} tuples you want to save in cookie
 * @maxAge            - when a tuple in session expires in seconds
 * @cookieEncryptionKeys
 *                    - keys used to encrypt and decrypt cookie
 * @domain            - sets the cookie's domain
 */
function CookieContentHandler(maxAmount, maxAge, cookieEncryptionKeys, domain, cookieSameSite) {
  if (!maxAge || (typeof maxAge !== 'number' || maxAge <= 0))
    throw new Error('CookieContentHandler: maxAge must be a positive number');
  this.maxAge = maxAge;  // seconds

  if (!maxAmount || (typeof maxAmount !== 'number' || maxAmount <= 0 || maxAmount % 1 !== 0))
    throw new Error('CookieContentHandler: maxAmount must be a positive integer');
  this.maxAmount = maxAmount;

  if (!cookieEncryptionKeys || !Array.isArray(cookieEncryptionKeys) || cookieEncryptionKeys.length === 0)
    throw new Error('CookieContentHandler: cookieEncryptionKeys must be a non-emptry array');

  if (typeof cookieSameSite !== 'boolean') {
    throw new Error('CookieContentHandler: cookieSameSite must be a boolean');
  }
  this.cookieSameSite = cookieSameSite

  for (var i = 0; i < cookieEncryptionKeys.length; i++) {
    var item = cookieEncryptionKeys[i];
    if (!item.key || !item.iv)
      throw new Error(`CookieContentHandler: array item ${i+1} in cookieEncryptionKeys must have the form { key: , iv: }`);
    if (item.key.length !== 32)
      throw new Error(`CookieContentHandler: key number ${i+1} is ${item.key.length} bytes, expected: 32 bytes`);
    if (item.iv.length !== 12)
      throw new Error(`CookieContentHandler: iv number ${i+1} is ${item.iv.length} bytes, expected: 12 bytes`);
  }

  this.cookieEncryptionKeys = cookieEncryptionKeys;

  this.domain = domain;
}

CookieContentHandler.prototype.findAndDeleteTupleByState = function(req, res, stateToFind) {
  if (!req.cookies)
    throw new Error('Cookie is not found in request. Did you forget to use cookie parsing middleware such as cookie-parser?');

  var cookieEncryptionKeys = this.cookieEncryptionKeys;

  var tuple = null;

  // try every key and every cookie
  for (var i = 0; i < cookieEncryptionKeys.length; i++) {
    var item = cookieEncryptionKeys[i];
    var key = createBuffer(item.key);
    var iv = createBuffer(item.iv);

    for (var cookie in req.cookies) {
      if (req.cookies.hasOwnProperty(cookie) && cookie.startsWith('passport-aad.')) {
        var encrypted = cookie.substring(13);

        try {
          var decrypted = decryptCookie(encrypted, key, iv);
          tuple = JSON.parse(decrypted);
        } catch (ex) {
          continue;
        }

        if (tuple.state === stateToFind) {
          res.clearCookie(cookie);
          return tuple;
        }
      }
    }
  }

  return null;
};

CookieContentHandler.prototype.add = function(req, res, tupleToAdd) {
  var cookies = [];

  // collect the related cookies
  for (var cookie in req.cookies) {
    if (req.cookies.hasOwnProperty(cookie) && cookie.startsWith('passport-aad.'))
      cookies.push(cookie);
  }

  // only keep the most recent maxAmount-1 many cookies
  if (cookies.length > this.maxAmount - 1) {
    cookies.sort();

    var numberToRemove = cookies.length - (this.maxAmount - 1);

    for (var i = 0; i < numberToRemove; i++) {
      res.clearCookie(cookies[0]);
      cookies.shift();
    }
  }

  // add the new cookie

  var tupleString = JSON.stringify(tupleToAdd);

  var item = this.cookieEncryptionKeys[0];
  var key = createBuffer(item.key);
  var iv = createBuffer(item.iv);

  var encrypted = encryptCookie(tupleString, key, iv);

  let options = { maxAge: this.maxAge * 1000, httpOnly: true }
  if (this.domain) {
    options.domain = this.domain;
  }

  if (this.cookieSameSite && !sameSiteNotAllowed(req.get('User-Agent'))) {
    options.sameSite = 'none';
    options.secure = true;
  }

  res.cookie('passport-aad.' + Date.now() + '.' + encrypted, 0, options);
};

var encryptCookie = function(content, key, iv) {
  var cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  var encrypted = cipher.update(content, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  var authTag = cipher.getAuthTag().toString('hex');

  return encrypted + '.' + authTag;
};

var decryptCookie = function(encrypted, key, iv) {
  var parts = encrypted.split('.');
  if (parts.length !== 3)
    throw new Error('invalid cookie');

  // the first part is timestamp, ignore it
  var content = createBuffer(parts[1], 'hex');
  var authTag = createBuffer(parts[2], 'hex');

  var decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  var decrypted = decipher.update(content, 'hex', 'utf8');
  decrypted +=  decipher.final('utf8');

  return decrypted;
};

exports.CookieContentHandler = CookieContentHandler;

