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

'use restrict';

const aadutils = require('./aadutils');
const CONSTANTS = require('./constants');
const jws = require('jws');

// check if two arrays have common elements
var hasCommonElem = (array1, array2) => {
  for (var i = 0; i < array1.length; i++) {
    if (array2.indexOf(array1[i]) !== -1)
      return true;
  }
  return false;
};

/* Verify the token and return the payload
 *
 * @jwtString
 * @PEMKey
 * @options
 *   - algorithms (required)
 *   - audience (required)
 *   - allowMultiAudiencesInToken (optional, default is true)
 *   - validateIssuer (optional, default is true)
 *   - issuer (required if validateIssuer is true)
 *   - subject (optional, validate if provided)
 *   - ignoreExpiration (optional, if not set true we will validate expiration)
 *   - isAccessToken (optional. Specify if the token is id_token or access_token. The default value is false.)
 * @callback
 */
exports.verify = function(jwtString, PEMKey, options, callback) {

  /*********************************************************************
   * Checking parameters
   ********************************************************************/

  // check the existence of callback function and options, if we don't have them, that means we have
  // less than 4 parameters passed. This is a server (code) error, we should throw.
  if (!callback)
    throw new Error('callback must be provided in jsonWebToken.verify');
  if (typeof callback !== 'function')
    throw new Error('callback in jsonWebToken.verify must be a function');
  if (!options)
    throw new Error('options must be provided in jsonWebToken.verify');

  // check jwtString and PEMKey are provided. Since jwtString and PEMKey are generated, this is
  // a non-server error, we shouldn't throw, we just give the error back and let authentication fail.
  if (!jwtString || jwtString === '')
    return done(new Error('jwtString must be provided in jsonWebToken.verify'));
  if (!PEMKey || PEMKey === '')
    return done(new Error('PEMKey must be provided in jsonWebToken.verify'));

  // asynchronous wrapper for callback
  var done = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    return process.nextTick(function() {
      callback.apply(null, args);
    });
  };

  // make sure we have the required fields in options
  if (!(options.audience && (typeof options.audience === 'string' || 
    (Array.isArray(options.audience) && options.audience.length > 0))))
    return done(new Error('invalid options.audience value is provided in jsonWebToken.verify'));
  if (!options.algorithms)
    return done(new Error('options.algorithms is missing in jsonWebToken.verify'));
  if (!Array.isArray(options.algorithms) || options.algorithms.length == 0 ||
    (options.algorithms.length === 1 && options.algorithms[0] === 'none'))
    return done(new Error('options.algorithms must be an array containing at least one algorithm'));

  /*********************************************************************
   * Checking jwtString structure, getting header, payload and signature
   ********************************************************************/

  // split jwtString, make sure we have three parts and we have signature
  var parts = jwtString.split('.');
  if (parts.length !== 3)
    return done(new Error('jwtString is malformed'));
  if (parts[2] === '')
    return done(new Error('signature is missing in jwtString'));
  
  // decode jwsString
  var decodedToken;
  try {
    decodedToken = jws.decode(jwtString);
  } catch(err) {
    return done(new Error('failed to decode the token'));
  }

  if (!decodedToken) {
    return done(new Error('invalid token'));
  }

  // get header, payload and signature
  var header = decodedToken.header;
  var payload = decodedToken.payload;
  var signature = decodedToken.signature;

  if (!header)
    return done(new Error('missing header in the token'));
  if (!payload)
    return done(new Error('missing payload in the token'));
  if (!signature)
    return done(new Error('missing signature in the token'));

  /*********************************************************************
   * validate algorithm and signature
   ********************************************************************/

  // header.alg should be one of the algorithms provided in options.algorithms
  if (typeof header.alg !== 'string' || header.alg === '' || header.alg === 'none' ||
    options.algorithms.indexOf(header.alg) == -1) {
    return done(new Error('invalid algorithm'));
  }

  try {
    var valid = jws.verify(jwtString, header.alg, PEMKey);
    if (!valid)
      return done(new Error('invalid signature'));
  } catch (e) {
    return done(e);
  }

  /*********************************************************************
   * validate payload content
   ********************************************************************/

  // (1) issuer
  //   - check the existence and the format of payload.iss
  //   - validate if options.issuer is set
  if (typeof payload.iss !== 'string' || payload.iss === '')
    return done(new Error('invalid iss value in payload'));
  if (options.validateIssuer !== false) {
    if (!options.issuer || options.issuer === '' || (Array.isArray(options.issuer) && options.issuer.length === 0))
      return done(new Error('options.issuer is missing'));
    var valid = false;
    if (Array.isArray(options.issuer))
      valid = (options.issuer.indexOf(payload.iss) !== -1);
    else
      valid = (options.issuer === payload.iss);
    if (!valid)
      return done(new Error('jwt issuer is invalid'));
  }

  // (2) subject (id_token only. We don't check subject for access_token)
  //   - check the existence and the format of payload.sub
  //   - validate if options.subject is set
  if (options.isAccessToken !== true) {
    if (typeof payload.sub !== 'string' || payload.sub === '')
      return done(new Error('invalid sub value in payload'));
    if (options.subject && options.subject !== payload.sub)
        return done(new Error('jwt subject is invalid. expected'));
  }

  // (3) audience
  //   - always validate
  //   - allow payload.aud to be an array of audience
  //   - options.audience must be a string
  //   - if there are multiple audiences, then azp claim must exist and must equal client_id
  if (typeof options.audience === 'string')
    options.audience = [options.audience, 'spn:' + options.audience];
  if (options.allowMultiAudiencesInToken === false && Array.isArray(payload.aud) && payload.aud.length > 1)
    return done(new Error('mulitple audience in token is not allowed'));
  var payload_audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!hasCommonElem(options.audience, payload_audience))
    return done(new Error('jwt audience is invalid'));
  if (payload_audience.length > 1) {
    if (typeof payload.azp !== 'string' || payload.azp !== options.clientID)
      return done(new Error('jwt azp is invalid'));
  }


  // (4) expiration
  //   - check the existence and the format of payload.exp
  //   - validate unless options.ignoreExpiration is set true
  if (typeof payload.exp !== 'number')
    return done(new Error('invalid exp value in payload'));
  if (!options.ignoreExpiration) {
    if (Math.floor(Date.now() / 1000) >= payload.exp + options.clockSkew) {
      return done(new Error('jwt is expired'));
    }
  }

  // (5) nbf
  //   - check if it exists
  if (payload.nbf) {
    if (typeof payload.nbf !== 'number')
      return done(new Error('nbf value in payload is not a number'));
    if (payload.nbf >= payload.exp)
      return done(new Error('nbf value in payload is not before the exp value'));
    if (payload.nbf >= Math.floor(Date.now() / 1000) + options.clockSkew)
      return done(new Error('jwt is not active'));
  }

  /*********************************************************************
   * return the payload content
   ********************************************************************/

  return done(null, payload);
};

/* Generate client assertion
 *
 * @params {String} clientID
 * @params {String} token_endpoint
 * @params {String} privatePEMKey
 * @params {String} thumbprint
 * @params {Function} callback
 */
exports.generateClientAssertion = function(clientID, token_endpoint, privatePEMKey, thumbprint, callback) { 
  var header = { 'x5t': thumbprint, 'alg': 'RS256', 'typ': 'JWT' };
  var payload = {
    sub: clientID,
    iss: clientID,
    jti: Date.now() + aadutils.uid(16),
    nbf: Math.floor(Date.now()/1000),
    exp: Math.floor(Date.now()/1000) + CONSTANTS.CLIENT_ASSERTION_JWT_LIFETIME,
    aud: token_endpoint,
  };

  var clientAssertion;
  var exception = null;

  try {
    clientAssertion = jws.sign({
      header: header, 
      payload: payload, 
      privateKey: privatePEMKey
    }); 
  } catch (ex) {
    exception = ex;
  }

  callback(exception, clientAssertion); 
};

