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

const OidcStrategy = require('../../lib/index').OIDCStrategy;

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

function setConfig(redirectUrl, clientID, responseType, responseMode, validateIssuer, testCallback) {
  var config = {
    identityMetadata: 'https://login.microsoftonline.com/contoso.onmicrosoft.com/v2.0/.well-known/openid-configuration',
    redirectUrl: redirectUrl,
    clientID: clientID,
    responseType: responseType,
    responseMode: responseMode,
    validateIssuer: validateIssuer,
    clientSecret: 'secret'
  };

  testCallback(config);
}

function setConfigCommon(redirectUrl, clientID, responseType, responseMode, validateIssuer, issuer, testCallback) {
  var config = {
    identityMetadata: 'https://login.microsoftonline.com/contoso.onmicrosoft.com/common/v2.0/.well-known/openid-configuration',
    redirectUrl: redirectUrl,
    clientID: clientID,
    responseType: responseType,
    responseMode: responseMode,
    validateIssuer: validateIssuer,
    issuer: issuer,
    clientSecret: 'secret'
  };

  testCallback(config);
}

exports.oidc = {
  'no args': (test) => {
    test.expect(1);

    test.throws(() => { new OidcStrategy(); },
      TypeError,
      'Should fail with no arguments)'
    );

    test.done();
  },
  'no verify function': (test) => {
    test.expect(1);

    test.throws(() => { new OidcStrategy({}, null); },
      TypeError,
      'Should fail with no verify function (2nd argument)'
    );

    test.done();
  },

  'no options': (test) => {
    test.expect(1);

    test.throws(
      () => {
        new OidcStrategy({}, noop);
      },
      TypeError,
      'Should fail with no OIDC config options'
    );

    test.done();
  },
  'clientID (empty)': (test) => {
    test.expect(1);

    setConfig('https://www.example.com', '', 'id_token token', 'form_post', 'true', (oidcConfig) =>
    {
      test.throws(() => {
        new OidcStrategy(oidcConfig, noop);
      },
      TypeError,
        'Should have failed clientID (empty)'
      );
    });

    test.done();
  },
  'redirectUrl (empty)': (test) => {
    test.expect(1);

    setConfig('', '123', 'id_token token', 'form_post', 'true', (oidcConfig) =>
    {
      test.throws(() => {
        new OidcStrategy(oidcConfig, noop);
      },
      TypeError,
        'Should have failed: redirectUrl (empty)'
      );
    });

    test.done();
  },
  'responseType (unknown): id_tokennn': (test) => {
    test.expect(1);

    setConfig('https://www.example.com', '123', 'id_token token', 'form_post', 'true', (oidcConfig) =>
    {
      test.throws(() => {
        new OidcStrategy(oidcConfig, noop);
      },
      TypeError,
        'Should have failed responseType (unknown): id_tokennn'
      );
    });

    test.done();
  },
  'responseType (unsupported): id_token token': (test) => {
    test.expect(1);

    setConfig('https://www.example.com', '123', 'id_token token', 'form_post', 'true', (oidcConfig) =>
    {
      test.throws(() => {
        new OidcStrategy(oidcConfig, noop);
      },
      TypeError,
        'Should have failed responseType: id_token token'
      );
    });

    test.done();
  },
  'responseType (unsupported): code token': (test) => {
    test.expect(1);

    setConfig('https://www.example.com', '123', 'code token', 'form_post', 'true', (oidcConfig) =>
    {
      test.throws(() => {
        new OidcStrategy(oidcConfig, noop);
      },
      TypeError,
        'Should have failed responseType: code token'
      );
    });

    test.done();
  },
  'responseType (unsupported): id_token code token': (test) => {
    test.expect(1);

    setConfig('https://www.example.com', '123', 'id_token code token', 'form_post', 'true', (oidcConfig) =>
    {
      test.throws(() => {
        new OidcStrategy(oidcConfig, noop);
      },
      TypeError,
        'Should have failed responseType: id_token code token'
      );
    });

    test.done();
  },
  'responseType (supported): id_token': (test) => {
    test.expect(1);

    setConfig('https://www.example.com', '123', 'id_token', 'form_post', 'true', (oidcConfig) =>
    {
      test.doesNotThrow(() => {
        new OidcStrategy(oidcConfig, noop);
      },
      Error,
        'Should not have failed responseType: id_token'
      );
    });

    test.done();
  },
  'responseType (supported): code': (test) => {
    test.expect(1);

    setConfig('https://www.example.com', '123', 'code', 'form_post', 'true', (oidcConfig) =>
    {
      test.doesNotThrow(() => {
        new OidcStrategy(oidcConfig, noop);
      },
      Error,
        'Should not have failed responseType: code'
      );
    });

    test.done();
  },
  'responseType (supported): id_token code': (test) => {
    test.expect(1);

    setConfig('https://www.example.com', '123', 'id_token code', 'form_post', 'true', (oidcConfig) =>
    {
      test.doesNotThrow(() => {
        new OidcStrategy(oidcConfig, noop);
      },
      Error,
        'Should not have failed responseType: id_token code'
      );
    });

    test.done();
  },
  'responseMode (unsupported): fragment': (test) => {
    test.expect(1);

    setConfig('https://www.example.com', '123', 'id_token code', 'fragment', 'true', (oidcConfig) =>
    {
      test.throws(() => {
        new OidcStrategy(oidcConfig, noop);
      },
      TypeError,
        'Should have failed responseMode: fragment'
      );
    });

    test.done();
  },
  'responseMode (supported): query': (test) => {
    test.expect(1);

    setConfig('https://www.example.com', '123', 'id_token code', 'query', 'true', (oidcConfig) =>
    {
      test.doesNotThrow(() => {
        new OidcStrategy(oidcConfig, noop);
      },
      Error,
        'Should NOT have failed responseMode: query'
      );
    });

    test.done();
  },
  'responseMode (supported): form_post': (test) => {
    test.expect(1);

    setConfig('https://www.example.com', '123', 'id_token code', 'form_post', 'true', (oidcConfig) =>
    {
      test.doesNotThrow(() => {
        new OidcStrategy(oidcConfig, noop);
      },
      Error,
        'Should NOT have failed responseMode: form_post'
      );
    });

    test.done();
  },
  'redirectUrl: only allow https by default': (test) => {
    test.expect(1);

    setConfig('http://www.example.com', '123', 'id_token code', 'form_post', 'true', (oidcConfig) =>
    {
      test.throws(() => {
        new OidcStrategy(oidcConfig, noop);
      },
      Error,
        'Should have failed with http redirectUrl by default'
      );
    });

    test.done();
  },
  'redirectUrl: allows http and https if allowHttpForRedirectUrl is set to true': (test) => {
    test.expect(1);

    setConfig('http://www.example.com', '123', 'id_token code', 'form_post', 'true', (oidcConfig) =>
    {
      test.doesNotThrow(() => {
        oidcConfig.allowHttpForRedirectUrl = true;
        new OidcStrategy(oidcConfig, noop);
      },
      Error,
        'Should NOT have failed with http redirectUrl and allowHttpForRedirectUrl set to true'
      );
    });

    test.done();
  },
  'validateIssuer: should use the default value true if it is set null or not set': (test) => {
    test.expect(2);

    setConfig('https://www.example.com', '123', 'id_token code', 'form_post', undefined, (oidcConfig) =>
    {
      var strategy = new OidcStrategy(oidcConfig, noop);
      test.ok(strategy._options.validateIssuer === true, 'validateIssuer should use the default value true if it is not set');
    });

    setConfig('https://www.example.com', '123', 'id_token code', 'form_post', null, (oidcConfig) =>
    {
      var strategy = new OidcStrategy(oidcConfig, noop);
      test.ok(strategy._options.validateIssuer === true, 'validateIssuer should use the default value true if it is set null');
    });

    test.done();
  },
  'validateIssuer: should be consistent with the user input if it is not null or undefined': (test) => {
    test.expect(2);

    setConfig('https://www.example.com', '123', 'id_token code', 'form_post', false, (oidcConfig) =>
    {
      var strategy = new OidcStrategy(oidcConfig, noop);
      test.ok(strategy._options.validateIssuer === false, 'validateIssuer should be consistent with the user input');
    });

    setConfig('https://www.example.com', '123', 'id_token code', 'form_post', true, (oidcConfig) =>
    {
      var strategy = new OidcStrategy(oidcConfig, noop);
      test.ok(strategy._options.validateIssuer === true, 'validateIssuer should be consistent with the user input');
    });

    test.done();
  },
  'validateIssuer tests on v2 common endpoint': (test) => {
    test.expect(5);

    setConfigCommon('https://www.example.com', '123', 'id_token code', 'form_post', true, null, (oidcConfig) =>
    {
      test.doesNotThrow(() => {
        new OidcStrategy(oidcConfig, noop);
      },
      Error,
      'Should not throw with validateIssuer set true on common endpoint'
      );
    });

    setConfigCommon('https://www.example.com', '123', 'id_token code', 'form_post', true, 'my_issuer', (oidcConfig) =>
    {
      var strategy;
      test.doesNotThrow(() => {
        strategy = new OidcStrategy(oidcConfig, noop);
      },
      Error,
      'Should not throw with validateIssuer set true on common endpoint with issuer provided'
      );
      test.ok(strategy._options.responseType === 'code id_token', 'should have changed id_token code to code id_token');
    });

    setConfigCommon('https://www.example.com', '123', 'id_token code', 'form_post', false, null, (oidcConfig) =>
    {
      var strategy;
      test.doesNotThrow(() => {
        strategy = new OidcStrategy(oidcConfig, noop);
      },
      Error,
      'Should not throw with validateIssuer set false on common endpoint'
      );
      test.ok(strategy._options.validateIssuer === false, 'validateIssuer should be consistent with the user input')
    });

    test.done();
  },
};
