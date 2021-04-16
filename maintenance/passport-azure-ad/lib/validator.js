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

'use strict';

const UrlValidator = require('valid-url');

const types = {};

function Validator(config) {
  this.config = config;
}

Validator.prototype.validate = function validate(options) {
  const opts = options || {};

  Object.keys(this.config).forEach((item) => {
    if (!this.config.hasOwnProperty(item)) {
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

Validator.isNonEmpty = 'isNonEmpty';
types.isNonEmpty = {
  validate: (value) => {
    return value !== '' && value !== undefined && value !== null;
  },
  error: 'The value cannot be empty',
};

Validator.isTypeLegal = 'isTypeLegal';
types.isTypeLegal = {
  validate: (value) => {
    return value === 'id_token' || value === 'id_token code' || value === 'code id_token' || value === 'code';
  },
  error: 'The responseType: must be either id_token, id_token code, code id_token or code.',
};

Validator.isModeLegal = 'isModeLegal';
types.isModeLegal = {
  validate: (value) => {
    return value === 'query' || value === 'form_post';
  },
  error: 'The responseMode: must be either query or form_post.',
};

Validator.isURL = 'isURL';
types.isURL = {
  validate: (value) => {
    return UrlValidator.isHttpUri(value) || UrlValidator.isHttpsUri(value);
  },
  error: 'The URL must be valid and be https:// or http://',
};

Validator.isHttpURL = 'isHttpURL';
types.isHttpURL = {
  validate: (value) => {
    return UrlValidator.isHttpUri(value);
  },
  error: 'The URL must be valid and be http://',
};

Validator.isHttpsURL = 'isHttpsURL';
types.isHttpsURL = {
  validate: (value) => {
    return UrlValidator.isHttpsUri(value);
  },
  error: 'The URL must be valid and be https://',
};

Validator.isHttpsURLIfExists = 'isHttpsURLIfExists';
types.isHttpsURLIfExists = {
  validate: (value) => {
    if (value)
      return UrlValidator.isHttpsUri(value);
    else
      return true;
  },
  error: 'The URL must be valid and be https://',
};

exports.Validator = Validator;
