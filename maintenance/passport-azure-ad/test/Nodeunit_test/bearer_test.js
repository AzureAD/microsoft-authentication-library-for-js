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

const BearerStrategy = require('../../lib/index').BearerStrategy;

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

function noop() {}

var commonMetadataURL = 'https://login.microsoftonline.com/common/.well-known/openid-configuration';
var nonCommonMetadataURL = 'https://login.microsoftonline.com/xxx.onmicrosoft.com/.well-known/openid-configuration';

function setConfig(metadataURL, validateIssuer, callback) {
  var config = {
    clientID: 'spn:6514a8ca-d9e4-4155-b292-65258398f3aa',
    identityMetadata: metadataURL,
    validateIssuer: validateIssuer
  };

  callback(config);
};

exports.bearer = {
  'validateIssuer tests': (test) => {
    test.expect(15);

    setConfig(commonMetadataURL, true, (bearerConfig) => {
      test.doesNotThrow(() => { 
          new BearerStrategy(bearerConfig, noop);
        },
        Error,
        'Should not throw with validateIssuer set true on common endpoint'
      );
    });

    setConfig(commonMetadataURL, undefined, (bearerConfig) => {
      test.doesNotThrow(() => { 
          new BearerStrategy(bearerConfig, noop);
        },
        Error,
        'Should throw with default validateIssuer value on common endpoint'
      );
    });

    setConfig(commonMetadataURL, null, (bearerConfig) => {
      test.doesNotThrow(() => { 
          new BearerStrategy(bearerConfig, noop);
        },
        Error,
        'Should throw with default validateIssuer value on common endpoint'
      );
    });

    setConfig(commonMetadataURL, null, (bearerConfig) => {
      test.doesNotThrow(() => {
          bearerConfig.issuer = 'some issuer'; 
          new BearerStrategy(bearerConfig, noop);
        },
        Error,
        'Should not throw if validateIssuer is true and issuer is provided on common endpoint'
      );
    });

    setConfig(commonMetadataURL, null, (bearerConfig) => {
      test.doesNotThrow(() => {
          bearerConfig.isB2C = true;
          bearerConfig.policyName = 'B2C_1_signin';
          bearerConfig.validateIssuer = false; 
          new BearerStrategy(bearerConfig, noop);
        },
        Error,
        'Should throw for using B2C on common endpoint'
      );
    });

    setConfig(nonCommonMetadataURL, null, (bearerConfig) => {
      test.throws(() => {
          bearerConfig.isB2C = true;
          bearerConfig.policyName = 'signin';
          bearerConfig.validateIssuer = false; 
          new BearerStrategy(bearerConfig, noop);
        },
        Error,
        'Should throw for using B2C with wrong policy name'
      );
    });

    setConfig(nonCommonMetadataURL, null, (bearerConfig) => {
      test.throws(() => {
          bearerConfig.isB2C = true;
          bearerConfig.policyName = 'b2c_1_signin';
          bearerConfig.validateIssuer = false; 
          bearerConfig.scope = 'scope';
          new BearerStrategy(bearerConfig, noop);
        },
        Error,
        'Should throw for using B2C if scope is not an array'
      );
    });

    setConfig(nonCommonMetadataURL, null, (bearerConfig) => {
      test.throws(() => {
          bearerConfig.isB2C = true;
          bearerConfig.policyName = 'b2c_1_signin';
          bearerConfig.validateIssuer = false; 
          bearerConfig.scope = [];
          new BearerStrategy(bearerConfig, noop);
        },
        Error,
        'Should throw for using B2C if scope is an empty array'
      );
    });

    setConfig(nonCommonMetadataURL, null, (bearerConfig) => {
      test.doesNotThrow(() => {
          bearerConfig.isB2C = true;
          bearerConfig.policyName = 'b2c_1_signin';
          bearerConfig.validateIssuer = false; 
          new BearerStrategy(bearerConfig, noop);
        },
        Error,
        'Should not throw with lower case prefix for B2C'
      );
    });

    setConfig(commonMetadataURL, false, (bearerConfig) => {
      var strategy;
      test.doesNotThrow(() => { 
          strategy = new BearerStrategy(bearerConfig, noop);
        },
        Error,
        'Should not throw with validateIssuer value set false on common endpoint'
      );
      test.ok(strategy._options.validateIssuer === false, 'validateIssuer should be consistent with the user input');
    });

    setConfig(nonCommonMetadataURL, true, (bearerConfig) => {
      var strategy = new BearerStrategy(bearerConfig, noop);
      test.ok(strategy._options.validateIssuer === true, 'validateIssuer should be consistent with the user input');
    });

    setConfig(nonCommonMetadataURL, false, (bearerConfig) => {
      var strategy = new BearerStrategy(bearerConfig, noop);
      test.ok(strategy._options.validateIssuer === false, 'validateIssuer should be consistent with the user input');
    });

    setConfig(nonCommonMetadataURL, null, (bearerConfig) => {
      var strategy = new BearerStrategy(bearerConfig, noop);
      test.ok(strategy._options.validateIssuer === true, 'validateIssuer should use the default validateIssuer value if it is set null');
    });

    setConfig(nonCommonMetadataURL, undefined, (bearerConfig) => {
      var strategy = new BearerStrategy(bearerConfig, noop);
      test.ok(strategy._options.validateIssuer === true, 'validateIssuer should use the default validateIssuer value if it is not set');
    });

    test.done();
  },
};

