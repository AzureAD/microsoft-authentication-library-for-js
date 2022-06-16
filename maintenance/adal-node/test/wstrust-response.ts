/*
 * @copyright
 * Copyright © Microsoft Open Technologies, Inc.
 *
 * All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http: *www.apache.org/licenses/LICENSE-2.0
 *
 * THIS CODE IS PROVIDED *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS
 * OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION
 * ANY IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A
 * PARTICULAR PURPOSE, MERCHANTABILITY OR NON-INFRINGEMENT.
 *
 * See the Apache License, Version 2.0 for the specific language
 * governing permissions and limitations under the License.
 */

'use strict';
/* Directive tells jshint that suite and test are globals defined by mocha */
/* global suite */
/* global test */

import * as assert from "assert";
import * as fs from "fs";

const util = require('./util/util');
const cp = util.commonParameters;
const testRequire = util.testRequire;

const WSTrustResponse = testRequire('wstrust-response');
const WSTrustVersion = testRequire('constants').WSTrustVersion;

/**
 * Tests the WSTrustResponse class which parses a ws-trust RSTR.
 */
suite('WSTrustResponse', function() {
  test('parse-error-happy-path', function(done) {
    var errorResponse = '\
    <s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">\
      <s:Header>\
       <a:Action s:mustUnderstand="1">http://www.w3.org/2005/08/addressing/soap/fault</a:Action>\
       <o:Security s:mustUnderstand="1" xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">\
         <u:Timestamp u:Id="_0">\
         <u:Created>2013-07-30T00:32:21.989Z</u:Created>\
         <u:Expires>2013-07-30T00:37:21.989Z</u:Expires>\
         </u:Timestamp>\
       </o:Security>\
       </s:Header>\
     <s:Body>\
       <s:Fault>\
         <s:Code>\
           <s:Value>s:Sender</s:Value>\
           <s:Subcode>\
           <s:Value xmlns:a="http://docs.oasis-open.org/ws-sx/ws-trust/200512">a:RequestFailed</s:Value>\
           </s:Subcode>\
         </s:Code>\
         <s:Reason>\
         <s:Text xml:lang="en-US">MSIS3127: The specified request failed.</s:Text>\
         </s:Reason>\
       </s:Fault>\
    </s:Body>\
    </s:Envelope>\
    ';

    var wstrustResponse = new WSTrustResponse(cp.callContext, errorResponse);

    var thrownError;
    try {
      wstrustResponse.parse();
    } catch (err) {
      thrownError = err;
    }

    assert(thrownError, 'Exppected an exception but none was thrown');
    assert(wstrustResponse.errorCode === 'RequestFailed', 'wstrustResponse.ErrorCode does not match expected value: ' + wstrustResponse.errorCode);
    assert(-1 !== wstrustResponse.faultMessage.indexOf('MSIS3127: The specified request failed.'), 'wstrustResponse.FaultMessage does not match expected value: ' + wstrustResponse.faultMessage);

    done();
  });

  test('token-parsing-happy-path', function(done) {
    var tokenResponse = fs.readFileSync(__dirname + '/wstrust/RSTR.xml', 'utf8');

    var wstrustResponse = new WSTrustResponse(cp.callContext, tokenResponse);

    wstrustResponse.parse();
    assert(wstrustResponse.tokenType === 'urn:oasis:names:tc:SAML:1.0:assertion', 'TokenType did not match expected value: ' + wstrustResponse.tokenType);
    assert(-1 !== wstrustResponse.token.indexOf('1TIu064jGEmmf+hnI+F0Jg=='), 'Did not find expected ImmutableID value in Token property: ' + wstrustResponse.token);
    done();
  });

  test('rstr-undefined', function(done) {
    var wstrustResponse = new WSTrustResponse(cp.callContext, undefined);
    var thrownError;
    try {
      wstrustResponse.parse();
    } catch (err) {
      thrownError = err;
    }

    assert(thrownError, 'Did not receive expected exception');
    assert(-1 !== thrownError.message.indexOf('empty'), 'Did not receive expected error message: ' + thrownError);
    assert(!wstrustResponse.errorCode, 'Received ErrorCode when none was expected: ' + wstrustResponse.errorCode);
    assert(!wstrustResponse.faultMessage, 'Received FaultMessage when none was expected' + wstrustResponse.faultMessage);
    done();
  });

  test('rstr-empty-string', function(done) {
    var wstrustResponse = new WSTrustResponse(cp.callContext, '');
    var thrownError;
    try {
      wstrustResponse.parse();
    } catch (err) {
      thrownError = err;
    }

    assert(thrownError, 'Did not receive expected exception');
    assert(-1 !== thrownError.message.indexOf('empty'), 'Did not receive expected error message: ' + thrownError.stack);
    assert(!wstrustResponse.errorCode, 'Received ErrorCode when none was expected: ' + wstrustResponse.errorCode);
    assert(!wstrustResponse.faultMessage, 'Received FaultMessage when none was expected' + wstrustResponse.faultMessage);
    done();
  });

  test('rstr-unparseable-xml', function(done) {
    var wstrustResponse = new WSTrustResponse(cp.callContext, '<This is not parseable as an RSTR');
    var thrownError;
    try {
      wstrustResponse.parse();
    } catch (err) {
      thrownError = err;
    }

    assert(thrownError, 'Did not receive expected exception');
    assert(-1 !== thrownError.message.indexOf('Failed to parse'), 'Did not receive expected error message: ' + thrownError);
    assert(!wstrustResponse.errorCode, 'Received ErrorCode when none was expected: ' + wstrustResponse.errorCode);
    assert(!wstrustResponse.faultMessage, 'Received FaultMessage when none was expected' + wstrustResponse.faultMessage);
    done();
  });

  test('happy-path-wstrust2005', function(done) {
    var tokenResponse = fs.readFileSync(__dirname + '/wstrust/RSTR2005.xml', 'utf8');
        
    var wstrustResponse = new WSTrustResponse(cp.callContext, tokenResponse, WSTrustVersion.WSTRUST2005);
        
    wstrustResponse.parse();
    assert(wstrustResponse.tokenType === 'urn:oasis:names:tc:SAML:1.0:assertion', 'TokenType did not match expected value: ' + wstrustResponse.tokenType);
    assert(-1 !== wstrustResponse.token.indexOf('y7TujD6J60uo1eFddnNJ1g=='), 'Did not find expected ImmutableID value in Token property: ' + wstrustResponse.token);
    done();
  });
});

