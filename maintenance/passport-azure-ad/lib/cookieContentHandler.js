/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

"use restrict";

const crypto = require("crypto");
const createBuffer = require("./jwe").createBuffer;
const sameSiteNotAllowed = require("./aadutils").sameSiteNotAllowed;

/*
 * the handler for state/nonce/policy
 * @maxAmount          - the max amount of {state: x, nonce: x, policy: x} tuples you want to save in cookie
 * @maxAge            - when a tuple in session expires in seconds
 * @cookieEncryptionKeys
 *                    - keys used to encrypt and decrypt cookie
 * @domain            - sets the cookie's domain
 */
function CookieContentHandler(maxAmount, maxAge, cookieEncryptionKeys, domain, cookieSameSite) {
  if (!maxAge || (typeof maxAge !== "number" || maxAge <= 0))
    throw new Error("CookieContentHandler: maxAge must be a positive number");
  this.maxAge = maxAge;  // seconds

  if (!maxAmount || (typeof maxAmount !== "number" || maxAmount <= 0 || maxAmount % 1 !== 0))
    throw new Error("CookieContentHandler: maxAmount must be a positive integer");
  this.maxAmount = maxAmount;

  if (!cookieEncryptionKeys || !Array.isArray(cookieEncryptionKeys) || cookieEncryptionKeys.length === 0)
    throw new Error("CookieContentHandler: cookieEncryptionKeys must be a non-emptry array");

  if (typeof cookieSameSite !== "boolean") {
    throw new Error("CookieContentHandler: cookieSameSite must be a boolean");
  }
  this.cookieSameSite = cookieSameSite

  for (let i = 0; i < cookieEncryptionKeys.length; i++) {
    const item = cookieEncryptionKeys[i];
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
    throw new Error("Cookie is not found in request. Did you forget to use cookie parsing middleware such as cookie-parser?");

  const cookieEncryptionKeys = this.cookieEncryptionKeys;

  let tuple = null;

  // try every key and every cookie
  for (let i = 0; i < cookieEncryptionKeys.length; i++) {
    const item = cookieEncryptionKeys[i];
    const key = createBuffer(item.key);
    const iv = createBuffer(item.iv);

    for (const cookie in req.cookies) {
      if (Object.prototype.hasOwnProperty.call(req.cookies, cookie) && cookie.startsWith("passport-aad.")) {
        const encrypted = cookie.substring(13);

        try {
          const decrypted = decryptCookie(encrypted, key, iv);
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
  const cookies = [];

  // collect the related cookies
  for (const cookie in req.cookies) {
    if (Object.prototype.hasOwnProperty.call(req.cookies, cookie) && cookie.startsWith("passport-aad."))
      cookies.push(cookie);
  }

  // only keep the most recent maxAmount-1 many cookies
  if (cookies.length > this.maxAmount - 1) {
    cookies.sort();

    const numberToRemove = cookies.length - (this.maxAmount - 1);

    for (let i = 0; i < numberToRemove; i++) {
      res.clearCookie(cookies[0]);
      cookies.shift();
    }
  }

  // add the new cookie

  const tupleString = JSON.stringify(tupleToAdd);

  const item = this.cookieEncryptionKeys[0];
  const key = createBuffer(item.key);
  const iv = createBuffer(item.iv);

  const encrypted = encryptCookie(tupleString, key, iv);

  const options = { maxAge: this.maxAge * 1000, httpOnly: true }
  if (this.domain) {
    options.domain = this.domain;
  }

  if (this.cookieSameSite && !sameSiteNotAllowed(req.get("User-Agent"))) {
    options.sameSite = "none";
    options.secure = true;
  }

  res.cookie("passport-aad." + Date.now() + "." + encrypted, 0, options);
};

const encryptCookie = function(content, key, iv) {
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(content, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return encrypted + "." + authTag;
};

const decryptCookie = function(encrypted, key, iv) {
  const parts = encrypted.split(".");
  if (parts.length !== 3)
    throw new Error("invalid cookie");

  // the first part is timestamp, ignore it
  const content = createBuffer(parts[1], "hex");
  const authTag = createBuffer(parts[2], "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(content, "hex", "utf8");
  decrypted +=  decipher.final("utf8");

  return decrypted;
};

exports.CookieContentHandler = CookieContentHandler;

