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

/******************************************************************************
 *  Testing tools setup
 *****************************************************************************/

var chromedriver = require('./driver');
var service = chromedriver.get_service();
var webdriver = chromedriver.webdriver;
var By = webdriver.By;
var until = webdriver.until;
var base64url = require('base64url');

var chai = require('chai');
var expect = chai.expect;

const TEST_TIMEOUT = 500000; // 30 seconds
const LOGIN_WAITING_TIME = 1000; // 1 second

/******************************************************************************
 *  configurations needed
 *****************************************************************************/

var driver;
var server;

var privatePemKey = '-----BEGIN RSA PRIVATE KEY-----\n\
MIIEowIBAAKCAQEA6+FrFkt/TByQ/L5d7or+9PVAowpswxUe3dJeYFTY0Lgq7zKI\n\
5OQ5RnSrI0T9yrfnRzE9oOdd4zmVj9txVLI+yySvinAu3yQDQou2Ga42ML/+K4Jr\n\
d5clMUPRGMbXdV5Rl9zzB0s2JoZJedua5dwoQw0GkS5Z8YAXBEzULrup06fnB5n6\n\
x5r2y1C/8Ebp5cyE4Bjs7W68rUlyIlx1lzYvakxSnhUxSsjx7u/mIdywyGfgiT3t\n\
w0FsWvki/KYurAPR1BSMXhCzzZTkMWKE8IaLkhauw5MdxojxyBVuNY+J/elq+HgJ\n\
/dZK6g7vMNvXz2/vT+SykIkzwiD9eSI9UWfsjwIDAQABAoIBAAuhBmWH/VOkSOWd\n\
AQaEpcMv4CrplakcfnQTLgHzzOilW8CFLkiSk9xMXi+T9CstW+Kfo9kt7uwH5766\n\
4+B4FS5wtZLOqxDnNp3uQ2EKvLM0k/RTLrcrpXLDVCizjOXFa6JgCz89zwKhNjgi\n\
woU4kGeV2dAIh/inBvt4SjGvoNTFZxlvkkpptu10MEbVLRUBX8Q7i9BNH8gPTvWR\n\
QVedtNZXnQWi3Q3DwRfHBwudxpuRuhUV90FaaHsJt8hpNvFs3v2LzZfFN4b28Xot\n\
iqHP2/cDGxcbx7Hi0K8bxYP9m8hNnpvBa8SbLcYDe6oTLGHAMsNahiWPnGF/gG/9\n\
WwQqXXECgYEA/avCCyuo7hHlqu9Ec6R47ub/Ul/zNiS+xvkkuYwW+4lNnI66A5zM\n\
m/BOQVMnaCkBua1OmOgx7e63+jHFvG5lyrhyYEmkA2CS3kMCrI+dx0fvNMLEXInP\n\
xd4np/7GUd1/XzPZEkPxBhqf09kqryHMj/uf7UtPcrJNvFY+GNrzlJkCgYEA7gvY\n\
RkpqM+SC883KImmy66eLiUrGE6G6/7Y8BS9oD4HhXcZ4rW6JJKuBzm7FlnsVhVGr\n\
o9M+QQ/GSLaDoxOPQfHQq62ERt+y/lCzSsMeWHbqOMci/pbtvJknpMv4ifsQXKJ4\n\
Lnk/AlGr+5r5JR5rUHgPFzCk9dJt69ff3QhzG2cCgYASs/c6m5148Bje4YVKgXXp\n\
J17r0+c6trraMMRkac/H+/ec82kDmyv601zxtA/TvjJCXmTNIVGNGWy3JbROkFUw\n\
/ShxsPxGw3gQqyAnWO9pIgSg/zs7F24aSKbj3AUDRDF/83KtxhSfPpdKJ1jeUL+k\n\
XgkMleDls//HQxSRAJO1AQKBgGGwbLYT7deT7IW/KzfKJsn8vQ+/puABnCs6jxEV\n\
rl/GzkTcoUOTPCbXV3LvFJk3s9I9fPHDTCYJIjdO52CyMzU91oPNtp4bSWqClcGV\n\
p0toqaBZYKwYJkIinBlON5XweXt6lVWFHm2GNM0RgTNRc3rXemHq7ZeQHtoNgmpE\n\
AHD7AoGBAJW5Y1slWPgw/2bootonwM9I6x0zLzfmEvZf88mMgP0nJ2pcNt30H+Vi\n\
HGYm8SSZZeR9JDUyJPEgscj8zUoShio4KcmR7CQSoC94gIJp8JOpPM62/5amtLHd\n\
UFkgfkaosOwKlarzVHZyKoZvr90fLWK8cwKpFLBnBW0GI+DOfxf+\n\
-----END RSA PRIVATE KEY-----\n';

var code_config = {
  identityMetadata: 'https://testingsts.azurewebsites.net/.well-known/openid-configuration', 
  clientID: 'client-001',
  responseType: 'code', 
  responseMode: 'form_post', 
  redirectUrl: 'http://localhost:3000/auth/openid/return', 
  allowHttpForRedirectUrl: true,
  clientSecret: 'secret-001', 
  validateIssuer: false,
  passReqToCallback: false,
  scope: null,
  loggingLevel: null,
  nonceLifetime: null,
  jweKeyStore: [ 
    { 'kid': 'sym_key_128', 'kty': 'oct', 'k': 'GawgguFyGrWKav7AX4VKUg'}, 
    { 'kid': 'sym_key_192', 'kty': 'oct', 'k': 'MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0' }, 
    { 'kid': 'sym_key_256', 'kty': 'oct', 'k': 'WIVds2iwJPwNhgUgwZXmn/46Ql1EkiL+M+QqDRdQURE' }, 
    { 'kid': 'sym_key_384', 'kty': 'oct', 'k': 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4v'},
    { 'kid': 'sym_key_512', 'kty': 'oct', 'k': 'MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNA'},
    { 'kid': 'rsa_key', 
      'kty': 'RSA', 
      "n":"6-FrFkt_TByQ_L5d7or-9PVAowpswxUe3dJeYFTY0Lgq7zKI5OQ5RnSrI0\
           T9yrfnRzE9oOdd4zmVj9txVLI-yySvinAu3yQDQou2Ga42ML_-K4Jrd5cl\
           MUPRGMbXdV5Rl9zzB0s2JoZJedua5dwoQw0GkS5Z8YAXBEzULrup06fnB5\
           n6x5r2y1C_8Ebp5cyE4Bjs7W68rUlyIlx1lzYvakxSnhUxSsjx7u_mIdyw\
           yGfgiT3tw0FsWvki_KYurAPR1BSMXhCzzZTkMWKE8IaLkhauw5MdxojxyB\
           VuNY-J_elq-HgJ_dZK6g7vMNvXz2_vT-SykIkzwiD9eSI9UWfsjw",
      "e":"AQAB",
      "d":"C6EGZYf9U6RI5Z0BBoSlwy_gKumVqRx-dBMuAfPM6KVbwIUuSJKT3ExeL5\
           P0Ky1b4p-j2S3u7Afnvrrj4HgVLnC1ks6rEOc2ne5DYQq8szST9FMutyul\
           csNUKLOM5cVromALPz3PAqE2OCLChTiQZ5XZ0AiH-KcG-3hKMa-g1MVnGW\
           -SSmm27XQwRtUtFQFfxDuL0E0fyA9O9ZFBV5201ledBaLdDcPBF8cHC53G\
           m5G6FRX3QVpoewm3yGk28Wze_YvNl8U3hvbxei2Koc_b9wMbFxvHseLQrx\
           vFg_2byE2em8FrxJstxgN7qhMsYcAyw1qGJY-cYX-Ab_1bBCpdcQ",
      "p":"_avCCyuo7hHlqu9Ec6R47ub_Ul_zNiS-xvkkuYwW-4lNnI66A5zMm_BOQV\
           MnaCkBua1OmOgx7e63-jHFvG5lyrhyYEmkA2CS3kMCrI-dx0fvNMLEXInP\
           xd4np_7GUd1_XzPZEkPxBhqf09kqryHMj_uf7UtPcrJNvFY-GNrzlJk",
      "q":"7gvYRkpqM-SC883KImmy66eLiUrGE6G6_7Y8BS9oD4HhXcZ4rW6JJKuBzm\
           7FlnsVhVGro9M-QQ_GSLaDoxOPQfHQq62ERt-y_lCzSsMeWHbqOMci_pbt\
           vJknpMv4ifsQXKJ4Lnk_AlGr-5r5JR5rUHgPFzCk9dJt69ff3QhzG2c",
      "dp":"ErP3OpudePAY3uGFSoF16Sde69PnOra62jDEZGnPx_v3nPNpA5sr-tNc8\
            bQP074yQl5kzSFRjRlstyW0TpBVMP0ocbD8RsN4EKsgJ1jvaSIEoP87Ox\
            duGkim49wFA0Qxf_NyrcYUnz6XSidY3lC_pF4JDJXg5bP_x0MUkQCTtQE",
      "dq":"YbBsthPt15Pshb8rN8omyfy9D7-m4AGcKzqPERWuX8bORNyhQ5M8JtdXc\
            u8UmTez0j188cNMJgkiN07nYLIzNT3Wg822nhtJaoKVwZWnS2ipoFlgrB\
            gmQiKcGU43lfB5e3qVVYUebYY0zRGBM1Fzetd6Yertl5Ae2g2CakQAcPs",
      "qi":"lbljWyVY-DD_Zuii2ifAz0jrHTMvN-YS9l_zyYyA_Scnalw23fQf5WIcZ\
            ibxJJll5H0kNTIk8SCxyPzNShKGKjgpyZHsJBKgL3iAgmnwk6k8zrb_lq\
            a0sd1QWSB-Rqiw7AqVqvNUdnIqhm-v3R8tYrxzAqkUsGcFbQYj4M5_F_4"
    }
  ]
};

var implicit_config = JSON.parse(JSON.stringify(code_config));
implicit_config.responseType = 'id_token';

var hybrid_config = JSON.parse(JSON.stringify(code_config));
hybrid_config.responseType = 'code id_token';

var code_config_no_kid = JSON.parse(JSON.stringify(code_config));
code_config_no_kid.jweKeyStore = [ 
    { 'kty': 'oct', 'k': 'GawgguFyGrWKav7AX4VKUg'}, 
    { 'kty': 'oct', 'k': 'MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0' }, 
    { 'kty': 'oct', 'k': 'WIVds2iwJPwNhgUgwZXmn/46Ql1EkiL+M+QqDRdQURE' }, 
    { 'kty': 'oct', 'k': 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4v'},
    { 'kty': 'oct', 'k': 'MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNA'},
    {  
      'kty': 'RSA', 
      "n":"6-FrFkt_TByQ_L5d7or-9PVAowpswxUe3dJeYFTY0Lgq7zKI5OQ5RnSrI0\
           T9yrfnRzE9oOdd4zmVj9txVLI-yySvinAu3yQDQou2Ga42ML_-K4Jrd5cl\
           MUPRGMbXdV5Rl9zzB0s2JoZJedua5dwoQw0GkS5Z8YAXBEzULrup06fnB5\
           n6x5r2y1C_8Ebp5cyE4Bjs7W68rUlyIlx1lzYvakxSnhUxSsjx7u_mIdyw\
           yGfgiT3tw0FsWvki_KYurAPR1BSMXhCzzZTkMWKE8IaLkhauw5MdxojxyB\
           VuNY-J_elq-HgJ_dZK6g7vMNvXz2_vT-SykIkzwiD9eSI9UWfsjw",
      "e":"AQAB",
      "d":"C6EGZYf9U6RI5Z0BBoSlwy_gKumVqRx-dBMuAfPM6KVbwIUuSJKT3ExeL5\
           P0Ky1b4p-j2S3u7Afnvrrj4HgVLnC1ks6rEOc2ne5DYQq8szST9FMutyul\
           csNUKLOM5cVromALPz3PAqE2OCLChTiQZ5XZ0AiH-KcG-3hKMa-g1MVnGW\
           -SSmm27XQwRtUtFQFfxDuL0E0fyA9O9ZFBV5201ledBaLdDcPBF8cHC53G\
           m5G6FRX3QVpoewm3yGk28Wze_YvNl8U3hvbxei2Koc_b9wMbFxvHseLQrx\
           vFg_2byE2em8FrxJstxgN7qhMsYcAyw1qGJY-cYX-Ab_1bBCpdcQ",
      "p":"_avCCyuo7hHlqu9Ec6R47ub_Ul_zNiS-xvkkuYwW-4lNnI66A5zMm_BOQV\
           MnaCkBua1OmOgx7e63-jHFvG5lyrhyYEmkA2CS3kMCrI-dx0fvNMLEXInP\
           xd4np_7GUd1_XzPZEkPxBhqf09kqryHMj_uf7UtPcrJNvFY-GNrzlJk",
      "q":"7gvYRkpqM-SC883KImmy66eLiUrGE6G6_7Y8BS9oD4HhXcZ4rW6JJKuBzm\
           7FlnsVhVGro9M-QQ_GSLaDoxOPQfHQq62ERt-y_lCzSsMeWHbqOMci_pbt\
           vJknpMv4ifsQXKJ4Lnk_AlGr-5r5JR5rUHgPFzCk9dJt69ff3QhzG2c",
      "dp":"ErP3OpudePAY3uGFSoF16Sde69PnOra62jDEZGnPx_v3nPNpA5sr-tNc8\
            bQP074yQl5kzSFRjRlstyW0TpBVMP0ocbD8RsN4EKsgJ1jvaSIEoP87Ox\
            duGkim49wFA0Qxf_NyrcYUnz6XSidY3lC_pF4JDJXg5bP_x0MUkQCTtQE",
      "dq":"YbBsthPt15Pshb8rN8omyfy9D7-m4AGcKzqPERWuX8bORNyhQ5M8JtdXc\
            u8UmTez0j188cNMJgkiN07nYLIzNT3Wg822nhtJaoKVwZWnS2ipoFlgrB\
            gmQiKcGU43lfB5e3qVVYUebYY0zRGBM1Fzetd6Yertl5Ae2g2CakQAcPs",
      "qi":"lbljWyVY-DD_Zuii2ifAz0jrHTMvN-YS9l_zyYyA_Scnalw23fQf5WIcZ\
            ibxJJll5H0kNTIk8SCxyPzNShKGKjgpyZHsJBKgL3iAgmnwk6k8zrb_lq\
            a0sd1QWSB-Rqiw7AqVqvNUdnIqhm-v3R8tYrxzAqkUsGcFbQYj4M5_F_4"
    }
  ];

var implicit_config_pemKey = JSON.parse(JSON.stringify(implicit_config));
implicit_config_pemKey.jweKeyStore = [ { 'kty': 'RSA', 'kid': 'rsa_key', 'privatePemKey': privatePemKey } ];

var implicit_config_no_valid_key = JSON.parse(JSON.stringify(code_config));
implicit_config_no_valid_key.jweKeyStore = [ 
  { 'kty': 'RSA', 'privatePemKey': 'invalid pem key' }, 
  { 'kty': 'oct', 'k': '1234567890123456'},  // size 16
  { 'kty': 'oct', 'k': '123456789012345678901234'},  // size 24
  { 'kty': 'oct', 'k': '12345678901234567890123456789012'},   // size 32
  { 'kty': 'oct', 'k': '123456789012345678901234567890123456789012345678'},   // size 48
  { 'kty': 'oct', 'k': '1234567890123456789012345678901234567890123456789012345678901234'}   // size 64
];

var runTest = (id, result, done) => {
  driver.get('http://localhost:3000/t/' + id).then(() => {
    driver.wait(until.titleIs('result'), 10000);
    driver.findElement(By.id('status')).getText().then((text) => { 
      expect(text).to.equal(result);
      done();
    });
  });  
};

var runNoKidTest = (id, result, done) => {
  driver.get('http://localhost:3000/t_no_kid/' + id).then(() => {
    driver.wait(until.titleIs('result'), 10000);
    driver.findElement(By.id('status')).getText().then((text) => { 
      expect(text).to.equal(result);
      done();
    });
  });  
};

/******************************************************************************
 *  The test cases
 *  check the test id in app/app_for_jwe.js
 *****************************************************************************/

describe('pem key test', function() {
  this.timeout(TEST_TIMEOUT);

  it('start app for authorization code flow', function(done) {
    if (!driver)
      driver = chromedriver.get_driver();

    server = require('./app/app_for_jwe')(implicit_config_pemKey);
    done();
  });

  it('RSA1_5 with A128CBC-HS256', function(done) {
    runTest('s1', 'succeeded', done);
  });

  it('RSA-OAEP with A128CBC-HS256', function(done) {
    runTest('s2', 'succeeded', done);
  });

  it('shut down app', function(done) {
    server.shutdown(done);
  })
});

describe('authorization code flow JWE test', function() {
  this.timeout(TEST_TIMEOUT);

  it('start app for authorization code flow', function(done) {
    if (!driver)
      driver = chromedriver.get_driver();

    server = require('./app/app_for_jwe')(code_config);
    done();
  });

  // A128CBC-HS256

  it('RSA1_5 with A128CBC-HS256', function(done) {
    runTest('s1', 'succeeded', done);
  });

  it('RSA-OAEP with A128CBC-HS256', function(done) {
    runTest('s2', 'succeeded', done);
  });

  it('A128KW with A128CBC-HS256', function(done) {
    runTest('s3', 'succeeded', done);
  });

  it('A256KW with A128CBC-HS256', function(done) {
    runTest('s4', 'succeeded', done);
  });

  it('dir with A128CBC-HS256', function(done) {
    runTest('s5', 'succeeded', done);
  });

  // A256CBC-HS512
  
  it('RSA1_5 with A256CBC-HS512', function(done) {
    runTest('s6', 'succeeded', done);
  });

  it('RSA-OAEP with A256CBC-HS512', function(done) {
    runTest('s7', 'succeeded', done);
  });

  it('A128KW with A256CBC-HS512', function(done) {
    runTest('s8', 'succeeded', done);
  });

  it('A256KW with A256CBC-HS512', function(done) {
    runTest('s9', 'succeeded', done);
  });

  it('dir with A256CBC-HS512', function(done) {
    runTest('s10', 'succeeded', done);
  });

  // A192CBC-HS384
  
  it('RSA1_5 with A192CBC-HS384', function(done) {
    runTest('s11', 'succeeded', done);
  });

  it('RSA-OAEP with A192CBC-HS384', function(done) {
    runTest('s12', 'succeeded', done);
  });

  it('A128KW with A192CBC-HS384', function(done) {
    runTest('s13', 'succeeded', done);
  });

  it('A256KW with A192CBC-HS384', function(done) {
    runTest('s14', 'succeeded', done);
  });

  it('dir with A192CBC-HS384', function(done) {
    runTest('s15', 'succeeded', done);
  });

  it('shut down app', function(done) {
    server.shutdown(done);
  })
});

describe('authorization code flow JWE test with no kid provided', function() {
  this.timeout(TEST_TIMEOUT);

  // passport should be able to try every possible key

  it('start app for authorization code flow', function(done) {
    if (!driver)
      driver = chromedriver.get_driver();

    server = require('./app/app_for_jwe')(code_config_no_kid);
    done();
  });
  
  // A128CBC-HS256

  it('RSA1_5 with A128CBC-HS256', function(done) {
    runNoKidTest('s1', 'succeeded', done);
  });

  it('RSA-OAEP with A128CBC-HS256', function(done) {
    runNoKidTest('s2', 'succeeded', done);
  });

  it('A128KW with A128CBC-HS256', function(done) {
    runNoKidTest('s3', 'succeeded', done);
  });

  it('A256KW with A128CBC-HS256', function(done) {
    runNoKidTest('s4', 'succeeded', done);
  });

  it('dir with A128CBC-HS256', function(done) {
    runNoKidTest('s5', 'succeeded', done);
  });

  // A256CBC-HS512
  
  it('RSA1_5 with A256CBC-HS512', function(done) {
    runNoKidTest('s6', 'succeeded', done);
  });

  it('RSA-OAEP with A256CBC-HS512', function(done) {
    runNoKidTest('s7', 'succeeded', done);
  });

  it('A128KW with A256CBC-HS512', function(done) {
    runNoKidTest('s8', 'succeeded', done);
  });

  it('A256KW with A256CBC-HS512', function(done) {
    runNoKidTest('s9', 'succeeded', done);
  });

  it('dir with A256CBC-HS512', function(done) {
    runNoKidTest('s10', 'succeeded', done);
  });

  // A192CBC-HS384
  
  it('RSA1_5 with A192CBC-HS384', function(done) {
    runNoKidTest('s11', 'succeeded', done);
  });

  it('RSA-OAEP with A192CBC-HS384', function(done) {
    runNoKidTest('s12', 'succeeded', done);
  });

  it('A128KW with A192CBC-HS384', function(done) {
    runNoKidTest('s13', 'succeeded', done);
  });

  it('A256KW with A192CBC-HS384', function(done) {
    runNoKidTest('s14', 'succeeded', done);
  });

  it('dir with A192CBC-HS384', function(done) {
    runNoKidTest('s15', 'succeeded', done);
  });

  it('shut down app', function(done) {
    server.shutdown(done);
  })
});

describe('hybrid flow JWE test', function() {
  this.timeout(TEST_TIMEOUT);

  it('start app for authorization code flow', function(done) {
    if (!driver)
      driver = chromedriver.get_driver();

    server = require('./app/app_for_jwe')(hybrid_config);
    done();
  });

  // A128CBC-HS256

  it('RSA1_5 with A128CBC-HS256', function(done) {
    runTest('s1', 'succeeded', done);
  });

  it('RSA-OAEP with A128CBC-HS256', function(done) {
    runTest('s2', 'succeeded', done);
  });

  it('A128KW with A128CBC-HS256', function(done) {
    runTest('s3', 'succeeded', done);
  });

  it('A256KW with A128CBC-HS256', function(done) {
    runTest('s4', 'succeeded', done);
  });

  it('dir with A128CBC-HS256', function(done) {
    runTest('s5', 'succeeded', done);
  });

  // A256CBC-HS512
  
  it('RSA1_5 with A256CBC-HS512', function(done) {
    runTest('s6', 'succeeded', done);
  });

  it('RSA-OAEP with A256CBC-HS512', function(done) {
    runTest('s7', 'succeeded', done);
  });

  it('A128KW with A256CBC-HS512', function(done) {
    runTest('s8', 'succeeded', done);
  });

  it('A256KW with A256CBC-HS512', function(done) {
    runTest('s9', 'succeeded', done);
  });

  it('dir with A256CBC-HS512', function(done) {
    runTest('s10', 'succeeded', done);
  });

  // A192CBC-HS384
  
  it('RSA1_5 with A192CBC-HS384', function(done) {
    runTest('s11', 'succeeded', done);
  });

  it('RSA-OAEP with A192CBC-HS384', function(done) {
    runTest('s12', 'succeeded', done);
  });

  it('A128KW with A192CBC-HS384', function(done) {
    runTest('s13', 'succeeded', done);
  });

  it('A256KW with A192CBC-HS384', function(done) {
    runTest('s14', 'succeeded', done);
  });

  it('dir with A192CBC-HS384', function(done) {
    runTest('s15', 'succeeded', done);
  });

  it('shut down app', function(done) {
    server.shutdown(done);
  })
});

describe('implicit flow JWE test', function() {
  this.timeout(TEST_TIMEOUT);

  it('start app for authorization code flow', function(done) {
    if (!driver)
      driver = chromedriver.get_driver();

    server = require('./app/app_for_jwe')(implicit_config);
    done();
  });

  // A128CBC-HS256

  it('RSA1_5 with A128CBC-HS256', function(done) {
    runTest('s1', 'succeeded', done);
  });

  it('RSA-OAEP with A128CBC-HS256', function(done) {
    runTest('s2', 'succeeded', done);
  });

  it('A128KW with A128CBC-HS256', function(done) {
    runTest('s3', 'succeeded', done);
  });

  it('A256KW with A128CBC-HS256', function(done) {
    runTest('s4', 'succeeded', done);
  });

  it('dir with A128CBC-HS256', function(done) {
    runTest('s5', 'succeeded', done);
  });

  // A256CBC-HS512
  
  it('RSA1_5 with A256CBC-HS512', function(done) {
    runTest('s6', 'succeeded', done);
  });

  it('RSA-OAEP with A256CBC-HS512', function(done) {
    runTest('s7', 'succeeded', done);
  });

  it('A128KW with A256CBC-HS512', function(done) {
    runTest('s8', 'succeeded', done);
  });

  it('A256KW with A256CBC-HS512', function(done) {
    runTest('s9', 'succeeded', done);
  });

  it('dir with A256CBC-HS512', function(done) {
    runTest('s10', 'succeeded', done);
  });

  // A192CBC-HS384
  
  it('RSA1_5 with A192CBC-HS384', function(done) {
    runTest('s11', 'succeeded', done);
  });

  it('RSA-OAEP with A192CBC-HS384', function(done) {
    runTest('s12', 'succeeded', done);
  });

  it('A128KW with A192CBC-HS384', function(done) {
    runTest('s13', 'succeeded', done);
  });

  it('A256KW with A192CBC-HS384', function(done) {
    runTest('s14', 'succeeded', done);
  });

  it('dir with A192CBC-HS384', function(done) {
    runTest('s15', 'succeeded', done);
  });

  it('shut down app', function(done) {
    server.shutdown(done);
  })
});

describe('JWE negative test: invalid authTag', function() {
  this.timeout(TEST_TIMEOUT);

  it('start app', function(done) {
    if (!driver)
      driver = chromedriver.get_driver();

    server = require('./app/app_for_jwe')(implicit_config);
    done();
  });

  it('invalid authTag: RSA1_5 with A128CBC-HS256', function(done) {
    runTest('f1', 'failed', done);
  });

  it('invalid authTag: RSA1_5 with A256CBC-HS512', function(done) {
    runTest('f2', 'failed', done);
  });

  it('shut down app', function(done) {
    server.shutdown(done);
  })
});

describe('JWE negative test: invalid key', function() {
  this.timeout(TEST_TIMEOUT);

  it('start app', function(done) {
    if (!driver)
      driver = chromedriver.get_driver();

    server = require('./app/app_for_jwe')(implicit_config_no_valid_key);
    done();
  });

  it('invalid key: RSA1_5 with A128CBC-HS256', function(done) {
    runTest('s1', 'failed', done);
  });

  it('invalid key: RSA-OAEP with A128CBC-HS256', function(done) {
    runTest('s2', 'failed', done);
  });

  it('invalid key: A128KW with A128CBC-HS256', function(done) {
    runTest('s3', 'failed', done);
  });

  it('invalid key: A256KW with A128CBC-HS256', function(done) {
    runTest('s4', 'failed', done);
  });

  it('invalid key: dir with A128CBC-HS256', function(done) {
    runTest('s5', 'failed', done);
  });

  it('shut down app', function(done) {
    driver.quit();
    service.stop();
    server.shutdown(done);
  })
});
