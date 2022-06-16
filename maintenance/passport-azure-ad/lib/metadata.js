/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

"use strict";

const https = require("https");
const aadutils = require("./aadutils");
const HttpsProxyAgent = require("https-proxy-agent");
const Log = require("./logging").getLogger;

const log = new Log("AzureAD: Metadata Parser");

function Metadata(url, authtype, options) {
  if (!url) {
    throw new Error("Metadata: url is a required argument");
  }
  if (!authtype || authtype !== "oidc") {
    throw new Error("Invalid authtype. authtype must be 'oidc'");
  }

  // if logging level specified, switch to it.
  if (options.loggingLevel) { log.levels("console", options.loggingLevel); }

  this.url = url;
  this.metadata = null;
  this.authtype = authtype;
  this.loggingNoPII = options.loggingNoPII;
  if (options.proxy) {
    // if user has specified proxy settings instantiate agent
    this.httpsProxyAgent = new HttpsProxyAgent(options.proxy);
  }
}

Object.defineProperty(Metadata, "url", {
  get: function getUrl() {
    return this.url;
  },
});

Object.defineProperty(Metadata, "oidc", {
  get: function getOidc() {
    return this.oidc;
  },
});

Object.defineProperty(Metadata, "metadata", {
  get: function getMetadata() {
    return this.metadata;
  },
});

Object.defineProperty(Metadata, "httpsProxyAgent", {
  get: function getHttpsProxyAgent() {
    return this.httpsProxyAgent;
  }
});

Metadata.prototype.updateOidcMetadata = function updateOidcMetadata(doc, callback) {
  log.info("Request to update the Open ID Connect Metadata");

  const self = this;

  const oidc = {};
  oidc.algorithms = doc.id_token_signing_alg_values_supported;
  oidc.authorization_endpoint = doc.authorization_endpoint;
  oidc.end_session_endpoint = doc.end_session_endpoint;
  oidc.issuer = doc.issuer;
  oidc.token_endpoint = doc.token_endpoint;
  oidc.userinfo_endpoint = doc.userinfo_endpoint;
  self.oidc = oidc;

  const jwksUri = doc.jwks_uri;

  if (!self.loggingNoPII) {
    log.info("Algorithm retrieved was: ", self.oidc.algorithms);
    log.info("Issuer we are using is: ", self.oidc.issuer);
    log.info("Key Endpoint we will use is: ", jwksUri);
    log.info("Authentication endpoint we will use is: ", self.oidc.authorization_endpoint);
    log.info("Token endpoint we will use is: ", self.oidc.token_endpoint);
    log.info("User info endpoint we will use is: ", self.oidc.userinfo_endpoint);
    log.info("The logout endpoint we will use is: ", self.oidc.end_session_endpoint);
  }

  // fetch the signing keys
  https.get(jwksUri, { agent: self.httpsProxyAgent }, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      // use json parser for oidc authType
      log.info("Parsing JSON retreived from the endpoint");
      self.oidc.keys = JSON.parse(data).keys;
      callback();
    })

    if (res.statusCode !== 200) {
      callback(new Error(`Error: ${res.statusCode} Cannot get AAD Signing Keys`));
    }

  }).on("error", (error) => {
      callback(error);
  }).end();
};

Metadata.prototype.generateOidcPEM = function generateOidcPEM(kid) {
  const self = this;
  const keys = this && this.oidc && Array.isArray(this.oidc.keys) ? this.oidc.keys : null;
  let pubKey = null;
  let foundKey = false;

  if (!kid) {
    throw new Error("kid is missing");
  }

  if (!keys) {
    throw new Error("keys is missing");
  }

  keys.some((key) => {
    if (self.loggingNoPII)
      log.info("working on key");
    else
      log.info("working on key:", key);

    // are we working on the right key?
    if (key.kid !== kid) {
      return false;
    }

    // check for `modulus` to be present
    if (!key.n) {
      if (self.loggingNoPII)
        log.warn("modulus is empty; corrupt key");
      else
        log.warn("modulus is empty; corrupt key", key);
      return false;
    }

    // check for `exponent` to be present
    if (!key.e) {
      if (self.loggingNoPII)
        log.warn("exponent is empty; corrupt key");
      else
        log.warn("exponent is empty; corrupt key", key);
      return false;
    }

    // generate PEM from `modulus` and `exponent`
    pubKey = aadutils.rsaPublicKeyPem(key.n, key.e);
    foundKey = true;

    return pubKey;
  });

  if (!foundKey) {
    if (self.loggingNoPII)
      throw new Error("a key with the specific kid cannot be found");
    else
      throw new Error("a key with kid %s cannot be found", kid);
  }

  if (!pubKey) {
    if (self.loggingNoPII)
      throw new Error("generating public key pem failed");
    else
      throw new Error("generating public key pem failed for kid: %s", kid);
  }

  return pubKey;
};

Metadata.prototype.fetch = function fetch(callback) {
  const self = this;
  
  https.request(self.url, { agent: self.httpsProxyAgent } , (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      if (res.statusCode === 200) {
        // use json parser for oidc authType
        log.info("Parsing JSON retreived from the endpoint");
        self.metadata = JSON.parse(data);
        return self.updateOidcMetadata(self.metadata, callback);
      }
    })

    if (res.statusCode !== 200) {
      if (self.loggingNoPII) {
        log.error("cannot get AAD Federation metadata from endpoint you specified");
        callback(new Error("Cannot get AAD Federation metadata"));
      } else {
        log.error("Cannot get AAD Federation metadata from endpoint you specified", self.url);
        callback(new Error(`Error: ${res.statusCode} Cannot get AAD Federation metadata
          from ${self.url}`));
      } 
    }
  }).on("error", (error) => {
    callback(error);
  }).end();
};

exports.Metadata = Metadata;
