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

var webdriver = require('selenium-webdriver');
var chai = require('chai');
var chrome = require('selenium-webdriver/chrome');
var path = require('chromedriver').path;
var expect = chai.expect;

var chromeCapabilities = webdriver.Capabilities.chrome();
var chromeOptions = {
  'args': ['--no-sandbox', 'disable-infobars']
};
chromeCapabilities.set('chromeOptions', chromeOptions);

exports = module.exports = {
  error_handler: (ex, server, done) => {
    server.shutdown(() => {
      expect(ex).to.equal(null);
      done();
    });
  },
  get_service: () => { 
  	var service = new chrome.ServiceBuilder(path).build();
    chrome.setDefaultService(service);
  	return service; 
  },
  get_driver: () => { return new webdriver.Builder().withCapabilities(chromeCapabilities).build(); },
  webdriver: webdriver
};
