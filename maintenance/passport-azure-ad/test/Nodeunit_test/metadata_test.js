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

const Metadata = require('../../lib/metadata').Metadata;

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

const metadataUrl = 'https://login.windows.net/GraphDir1.OnMicrosoft.com/federationmetadata/2007-06/federationmetadata.xml';
const oidcMetadataUrl = 'https://login.microsoftonline.com/common/.well-known/openid-configuration';
const oidcMetadataUrl2 = 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration';
const options = {};

exports.metadata = {

  'has option': (test) => {
    test.expect(1);
    // tests here

    test.doesNotThrow(
      () => {
        new Metadata(oidcMetadataUrl, 'oidc', options);
      },
      Error,
      'Should not fail with url present'
    );

    test.done();
  },
  'missing option url': (test) => {
    test.expect(1);
    // tests here

    test.throws(
      () => {
        new Metadata();
      },
      Error,
      'Should fail with url missing'
    );

    test.done();
  },
  'missing option auth': (test) => {
    test.expect(1);
    // tests here

    test.throws(
      () => {
        new Metadata(oidcMetadataUrl, options);
      },
      Error,
      'Should fail with auth type missing'
    );

    test.done();
  },
  'missing option options': (test) => {
    test.expect(1);
    // tests here

    test.throws(
      () => {
        new Metadata(oidcMetadataUrl, 'oidc');
      },
      Error,
      'Should fail with options missing'
    );

    test.done();
  },
  'fetch metadata saml': (test) => {
    test.expect(1);
    // tests here

    test.throws(
      () => {
        new Metadata(metadataUrl, 'saml', options);
      },
      Error,
      'Should fail with unsupported auth type'
    );

    test.done();
  },
  'fetch metadata oidc': (test) => {
    test.expect(4);
    // tests here

    test.doesNotThrow(
      () => {
        const m = new Metadata(oidcMetadataUrl, 'oidc', options);
        m.fetch((err) => {
          test.ifError(err);
          test.ok(m.oidc.algorithms, 'fetch algorithms');
          test.ok(m.oidc.issuer, 'fetch issuer');
          test.done();
        });
      },
      Error,
      'Should not fail with url present and auth type oidc'
    );
  },
  'fetch metadata oidc v2': (test) => {
    test.expect(4);
    // tests here

    test.doesNotThrow(
      () => {
        const m = new Metadata(oidcMetadataUrl2, 'oidc', options);
        m.fetch((err) => {
          test.ifError(err);
          test.ok(m.oidc.algorithms, 'fetch algorithms');
          test.ok(m.oidc.issuer, 'fetch issuer');
          test.done();
        });
      },
      Error,
      'Should not fail with url present and auth type oidc'
    );
  },
  'check keys and pem generation': (test) => {
    test.expect(5);

    const m = new Metadata('www.example.com', 'oidc', {});

    // example public keys from AAD

    var key1 = {
      e: "AQAB", 
      kid: "MnC_VZcATfM5pOYiJHMba9goEKY", 
      n: "vIqz-4-ER_vNWLON9yv8hIYV737JQ6rCl6XfzOC628seYUPf0TaGk91CFxefhzh23V9Tkq-RtwN1Vs_z57hO82kkzL-cQHZX3bMJD-GEGOKXCEXURN7VMyZWMAuzQoW9vFb1k3cR1RW_EW_P-C8bb2dCGXhBYqPfHyimvz2WarXhntPSbM5XyS5v5yCw5T_Vuwqqsio3V8wooWGMpp61y12NhN8bNVDQAkDPNu2DT9DXB1g0CeFINp_KAS_qQ2Kq6TSvRHJqxRR68RezYtje9KAqwqx4jxlmVAQy0T3-T-IAbsk1wRtWDndhO6s1Os-dck5TzyZ_dNOhfXgelixLUQ"
    };

    var key2 = {
      e: "AQAB",
      kid: "YbRAQRYcE_motWVJKHrwLBbd_9s",
      n: "vbcFrj193Gm6zeo5e2_y54Jx49sIgScv-2JO-n6NxNqQaKVnMkHcz-S1j2FfpFngotwGMzZIKVCY1SK8SKZMFfRTU3wvToZITwf3W1Qq6n-h-abqpyJTaqIcfhA0d6kEAM5NsQAKhfvw7fre1QicmU9LWVWUYAayLmiRX6o3tktJq6H58pUzTtx_D0Dprnx6z5sW-uiMipLXbrgYmOez7htokJVgDg8w-yDFCxZNo7KVueUkLkxhNjYGkGfnt18s7ZW036WoTmdaQmW4CChf_o4TLE5VyGpYWm7I_-nV95BBvwlzokVVKzveKf3l5UU3c6PkGy-BB3E_ChqFm6sPWw"
    };

    var correctPemKey2 = "-----BEGIN RSA PUBLIC KEY-----\n" + 
                     "MIIBCgKCAQEAvbcFrj193Gm6zeo5e2/y54Jx49sIgScv+2JO+n6NxNqQaKVnMkHc\n" +
                     "z+S1j2FfpFngotwGMzZIKVCY1SK8SKZMFfRTU3wvToZITwf3W1Qq6n+h+abqpyJT\n" +
                     "aqIcfhA0d6kEAM5NsQAKhfvw7fre1QicmU9LWVWUYAayLmiRX6o3tktJq6H58pUz\n" +
                     "Ttx/D0Dprnx6z5sW+uiMipLXbrgYmOez7htokJVgDg8w+yDFCxZNo7KVueUkLkxh\n" +
                     "NjYGkGfnt18s7ZW036WoTmdaQmW4CChf/o4TLE5VyGpYWm7I/+nV95BBvwlzokVV\n" +
                     "KzveKf3l5UU3c6PkGy+BB3E/ChqFm6sPWwIDAQAB\n" + 
                     "-----END RSA PUBLIC KEY-----\n";

    m.oidc = {keys: [key1, key2]};

    test.doesNotThrow(
      () => {
        var pem = m.generateOidcPEM(key2.kid);
        test.ok(pem === correctPemKey2, 'get the correct pem');
      },
      Error,
      'should not fail with the correct keys, kid and pem'
    );

    test.throws(
      () => {
        // wrong kid
        var pem = m.generateOidcPEM('wrong_kid');
      },
      Error,
      "Should fail with 'a key with kid my_kid cannot be found'"
    );

    test.throws(
      () => {
        // missing kid
        var pem = m.generateOidcPEM(null);
      },
      Error,
      "Should fail with 'kid is missing'"
    );

    test.throws(
      () => {
        // missing keys
        m.oidc = {};
        var pem = m.generateOidcPEM(key2.kid);
      },
      Error,
      "Should fail with 'keys is missing'"
    );

    test.done();
  }
};
