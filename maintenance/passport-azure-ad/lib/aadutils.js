/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

"use strict";

const base64url = require("base64url");
const crypto = require("crypto");
const util = require("util");

exports.getLibraryProduct = () => { return "passport-azure-ad" };
exports.getLibraryVersionParameterName = () => { return "x-client-Ver" };
exports.getLibraryProductParameterName = () => { return "x-client-SKU" };
exports.getLibraryVersion = () => {
  return "4.3.2";
};

exports.getElement = (parentElement, elementName) => {
  if (parentElement[`saml:${elementName}`]) {
    return parentElement[`saml:${elementName}`];
  } else if (parentElement[`samlp:${elementName}`]) {
    return parentElement[`samlp:${elementName}`];
  } else if (parentElement[`wsa:${elementName}`]) {
    return parentElement[`wsa:${elementName}`];
  }
  return parentElement[elementName];
};

exports.getFirstElement = (parentElement, elementName) => {
  const element = exports.getElement(parentElement, elementName);
  return Array.isArray(element) ? element[0] : element;
};

/**
 * Reconstructs the original URL of the request.
 *
 * This function builds a URL that corresponds the original URL requested by the
 * client, including the protocol (http or https) and host.
 *
 * If the request passed through any proxies that terminate SSL, the
 * `X-Forwarded-Proto` header is used to detect if the request was encrypted to
 * the proxy.
 *
 * @return {String}
 * @api private
 */
exports.originalURL = (req) => {
  const headers = req.headers;
  const protocol = (req.connection.encrypted || req.headers["x-forwarded-proto"] === "https") ? "https" : "http";
  const host = headers.host;
  const path = req.url || "";
  return `${protocol}://${host}${path}`;
};

/**
 * Merge object b with object a.
 *
 *     var a = { something: 'bar' }
 *       , b = { bar: 'baz' };
 *
 *     utils.merge(a, b);
 *     // => { something: 'bar', bar: 'baz' }
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object}
 * @api private
 */

exports.merge = (a, b) => {
  return util._extend(a, b); // eslint-disable-line no-underscore-dangle
};

/**
 * Return a unique identifier with the given `len`.
 *
 *     utils.uid(10);
 *     // => "FDaS435D2z"
 *
 * CREDIT: Connect -- utils.uid
 *         https://github.com/senchalabs/connect/blob/2.7.2/lib/utils.js
 *
 * @param {Number} len
 * @return {String}
 * @api private
 */

exports.uid = (len) => {
  const bytes = crypto.randomBytes(Math.ceil(len * 3 / 4));
  return base64url.encode(bytes).slice(0,len);
};

function prepadSigned(hexStr) {
  const msb = hexStr[0];
  if (msb < "0" || msb > "7") {
    return `00${hexStr}`;
  }
  return hexStr;
}

function toHex(number) {
  const nstr = number.toString(16);
  if (nstr.length % 2) {
    return `0${nstr}`;
  }
  return nstr;
}

/*
 * encode ASN.1 DER length field
 * if <=127, short form
 * if >=128, long form
 */
function encodeLengthHex(n) {
  if (n <= 127) {
    return toHex(n);
  }
  const nHex = toHex(n);
  const lengthOfLengthByte = 128 + nHex.length / 2; // 0x80+numbytes
  return toHex(lengthOfLengthByte) + nHex;
}

// http://stackoverflow.com/questions/18835132/xml-to-pem-in-node-js
exports.rsaPublicKeyPem = (modulusB64, exponentB64) => {
  const modulus = new Buffer(modulusB64, "base64"); // eslint-disable-line security/detect-new-buffer -- Legacy code, Buffer needed
  const exponent = new Buffer(exponentB64, "base64"); // eslint-disable-line security/detect-new-buffer -- Legacy code, Buffer needed

  const modulusHex = prepadSigned(modulus.toString("hex"));
  const exponentHex = prepadSigned(exponent.toString("hex"));

  const modlen = modulusHex.length / 2;
  const explen = exponentHex.length / 2;

  const encodedModlen = encodeLengthHex(modlen);
  const encodedExplen = encodeLengthHex(explen);
  const encodedPubkey = `30${encodeLengthHex(
          modlen +
          explen +
          encodedModlen.length / 2 +
          encodedExplen.length / 2 + 2
        )}02${encodedModlen}${modulusHex}02${encodedExplen}${exponentHex}`;

  const derB64 = new Buffer(encodedPubkey, "hex").toString("base64"); // eslint-disable-line security/detect-new-buffer -- Legacy code, Buffer needed

  const pem = `-----BEGIN RSA PUBLIC KEY-----\n${derB64.match(/.{1,64}/g).join("\n")}\n-----END RSA PUBLIC KEY-----\n`;

  return pem;
};

/*
 * used for c_hash and at_hash validation
 * case (1): content = access_token, hashProvided = at_hash
 * case (2): content = code, hashProvided = c_hash
 */
exports.checkHashValueRS256 = (content, hashProvided) => {
  if (!content)
    return false;

  // step 1. hash the content
  const digest = crypto.createHash("sha256").update(content, "ascii").digest();

  // step2. take the first half of the digest, and save it in a buffer
  const buffer = new Buffer(digest.length/2); // eslint-disable-line security/detect-new-buffer -- Legacy code, Buffer needed
  for (let i = 0; i < buffer.length; i++)
    buffer[i] = digest[i];

  // step 3. base64url encode the buffer to get the hash
  const hashComputed = base64url(buffer);

  return (hashProvided === hashComputed);
};

/*
 * This function is used for handling the tuples containing nonce/state/policy/timeStamp in session
 * remove the additional tuples from array starting from the oldest ones
 * remove expired tuples in array
 */
exports.processArray = function(array, maxAmount, maxAge) {
  // remove the additional tuples, start from the oldest ones
  if (array.length > maxAmount)
    array.splice(0, array.length - maxAmount);

  // count the number of those already expired
  let count = 0;
  for (let i = 0; i < array.length; i++) {
    const tuple = array[i];
    if (tuple.timeStamp + maxAge * 1000 <= Date.now())
      count++;
    else
      break;
  }

  // remove the expired ones
  if (count > 0)
    array.splice(0, count);
};

/*
 * This function is used to find the tuple matching the given state, remove the tuple
 * from the array and return the tuple
 * @array        - array of {state: x, nonce: x, policy: x, timeStamp: x} tuples
 * @state        - the tuple which matches the given state
 */
exports.findAndDeleteTupleByState = (array, state) => {
  if (!array)
    return null;

  for (let i = 0; i < array.length; i++) {
    const tuple = array[i];
    if (tuple["state"] === state) {
      // remove the tuple from the array
      array.splice(i, 1);
      return tuple;
    }
  }

  return null;
};

// copy the fields from source to dest
exports.copyObjectFields = (source, dest, fields) => {
  if (!source || !dest || !fields || !Array.isArray(fields))
    return;

  for (let i = 0; i < fields.length; i++)
    dest[fields[i]] = source[fields[i]];
};

exports.getErrorMessage = (err) => {
  if (typeof err === "string")
    return err;
  if (err instanceof Error)
    return err.message;

  // if not string or Error, we try to stringify it
  let str;
  try {
    str = JSON.stringify(err);
  } catch (ex) {
    return err;
  }
  return str;
};

exports.concatUrl = (url, rest) => {
  let validRest;
  if (typeof rest === "string" || rest instanceof String) {
    validRest = [rest];
  } else {
    validRest = rest;
  }

  if (!url) {
    return `?${validRest.join("&")}`;
  }

  const hasParam = url.indexOf("?") !== -1;
  return validRest ? url.concat(hasParam ? "&" : "?").concat(validRest.join("&")) : url;
};

/*
 * This is a list maintained by the AAD server team.
 * In general, a change like this (adding a new cookie attribute)
 * should be backward compatible as RFC 6265 specifies that browsers should
 * ignore unknown cookie attributes. However, for the specific case of the
 * SameSite attribute, some browsers incorrectly implemented the attribute or
 * implemented an earlier draft which had contradictory behavior.
 * For these browsers which attempted to support SameSite,
 * but have bugs in their support, we want to omit the SameSite=None attribute.
 * See Chromium official guidance here:  https://www.chromium.org/updates/same-site/incompatible-clients
 */
exports.sameSiteNotAllowed = userAgent => {
  /*
   * Cover all iOS based browsers here. This includes:
   * - Safari on iOS 12 for iPhone, iPod Touch, iPad
   * - WkWebview on iOS 12 for iPhone, iPod Touch, iPad
   * - Chrome on iOS 12 for iPhone, iPod Touch, iPad
   * All of which are broken by SameSite=None, because they use the iOS networking stack
   */
  if (userAgent.includes("CPU iPhone OS 12") || userAgent.includes("iPad; CPU OS 12")) {
    return true;
  }

  /*
   * Cover Mac OS X based browsers that use the Mac OS networking stack. This includes:
   * - Safari on Mac OS X
   * - Internal browser on Mac OS X
   * This does not include:
   * - Chrome on Mac OS X
   * - Chromium on Mac OS X
   * Because they do not use the Mac OS networking stack.
   */
  if (userAgent.includes("Macintosh; Intel Mac OS X 10_14") && !userAgent.includes("Chrome/") && !userAgent.includes("Chromium")) {
    return true;
  }

  /*
   * Cover Chrome 50-69, because some versions are broken by SameSite=None, and none in this range require it.
   * Note: this covers some pre-Chromium Edge versions, but pre-Chromim Edge does not require SameSite=None, so this is fine.
   * Note: this regex applies to Windows, Mac OS X, and Linux, deliberately.
   */
  if (userAgent.includes("Chrome/5") || userAgent.includes("Chrome/6")) {
    return true;
  }

  /*
   * Unreal Engine runs Chromium 59, but does not advertise as Chrome until 4.23. Treat versions of Unreal
   * that don't specify their Chrome version as lacking support for SameSite=None.
   */
  if (userAgent.includes("UnrealEngine") && !userAgent.includes("Chrome")) {
    return true;
  }

  /*
   * UCBrowser < 12.13.2 ignores Set-Cookie headers with SameSite=None.
   * NB: this rule isn't complete - you need regex to make a complete rule.
   * See: https://www.chromium.org/updates/same-site/incompatible-clients
   */
  if (userAgent.includes("UCBrowser/12") || userAgent.includes("UCBrowser/11")) {
    return true;
  }

  return false;
};
