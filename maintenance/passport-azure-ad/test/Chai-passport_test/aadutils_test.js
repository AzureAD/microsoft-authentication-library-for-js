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
var aadutils = require('../../lib/aadutils');

const TEST_TIMEOUT = 1000000; // 1000 seconds

describe('uid test', function() {
  this.timeout(TEST_TIMEOUT);

  it('should return an id with the required length and no url unsafe characters', function(done) {
    // generate and test uid 10 times
    
    for (let i = 0; i < 10; i++) {
      let uid = aadutils.uid(32);
      let uid_url_safe = uid.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      expect(uid.length).to.equal(32);
      expect(uid).to.equal(uid_url_safe);
    }

    for (let i = 0; i < 10; i++) {
      let uid = aadutils.uid(24);
      let uid_url_safe = uid.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      expect(uid.length).to.equal(24);
      expect(uid).to.equal(uid_url_safe);
    }

    done();
  });
});

describe('concatUrl test', function() {
  it('should generate a valid url if a query parameter is already in place', function(done) {
    const currentUrl = 'http://example.com?foo=bar';
    const newUrl = aadutils.concatUrl(currentUrl, ['bar=foo']);
    expect(newUrl).to.equal(`${currentUrl}&bar=foo`);
    done();
  });

  it('should generate a valid url if no query parameter is present', function(done) {
    const currentUrl = 'http://example.com';
    const newUrl = aadutils.concatUrl(currentUrl, 'bar=foo');
    expect(newUrl).to.equal(`${currentUrl}?bar=foo`);
    done();
  });
  
  it('should return the bare url if no additional arguments are present', function(done) {
    const currentUrl = 'http://example.com';
    const newUrl = aadutils.concatUrl(currentUrl);
    expect(newUrl).to.equal(currentUrl);
    done();
  });
  
  it('should return parseable query parameters if no url is present', function(done) {
    const parameters = ['bar=foo&foo=bar'];
    const newUrl = aadutils.concatUrl(undefined, parameters)
    expect(newUrl).to.equal(`?${parameters}`);
    done();
  });
})
