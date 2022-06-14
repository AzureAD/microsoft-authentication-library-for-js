/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

"use strict";

const UrlValidator = require("valid-url");

const types = {};

function Validator(config) {
  this.config = config;
}

Validator.prototype.validate = function validate(options) {
  const opts = options || {};

  Object.keys(this.config).forEach((item) => {
    if (!Object.prototype.hasOwnProperty.call(this.config, item)) {
      throw new TypeError(`Missing value for ${item}`);
    }
    const type = this.config[item];
    if (!type) {
      return; // no need to validate
    }
    const checker = types[type];
    if (!checker) { // missing required checker
      throw new TypeError(`No handler to validate type ${type} for item ${item}`);
    }

    if (!checker.validate(opts[item])) {
      throw new TypeError(`Invalid value for ${item}.${checker.error}`);
    }
  });
};

Validator.isNonEmpty = "isNonEmpty";
types.isNonEmpty = {
  validate: (value) => {
    return value !== "" && value !== undefined && value !== null;
  },
  error: "The value cannot be empty",
};

Validator.isTypeLegal = "isTypeLegal";
types.isTypeLegal = {
  validate: (value) => {
    return value === "id_token" || value === "id_token code" || value === "code id_token" || value === "code";
  },
  error: "The responseType: must be either id_token, id_token code, code id_token or code.",
};

Validator.isModeLegal = "isModeLegal";
types.isModeLegal = {
  validate: (value) => {
    return value === "query" || value === "form_post";
  },
  error: "The responseMode: must be either query or form_post.",
};

Validator.isURL = "isURL";
types.isURL = {
  validate: (value) => {
    return UrlValidator.isHttpUri(value) || UrlValidator.isHttpsUri(value);
  },
  error: "The URL must be valid and be https:// or http://",
};

Validator.isHttpURL = "isHttpURL";
types.isHttpURL = {
  validate: (value) => {
    return UrlValidator.isHttpUri(value);
  },
  error: "The URL must be valid and be http://",
};

Validator.isHttpsURL = "isHttpsURL";
types.isHttpsURL = {
  validate: (value) => {
    return UrlValidator.isHttpsUri(value);
  },
  error: "The URL must be valid and be https://",
};

Validator.isHttpsURLIfExists = "isHttpsURLIfExists";
types.isHttpsURLIfExists = {
  validate: (value) => {
    if (value)
      return UrlValidator.isHttpsUri(value);
    else
      return true;
  },
  error: "The URL must be valid and be https://",
};

exports.Validator = Validator;
