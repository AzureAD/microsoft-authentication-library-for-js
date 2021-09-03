/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

"use strict";

const bunyan = require("bunyan");

function getLogger(name) {
  const log = bunyan.createLogger({
    name,
    streams: [{
      stream: process.stderr,
      level: "error",
      name: "error",
    }, {
      stream: process.stdout,
      level: "warn",
      name: "console",
    }],
  });
  return log;
}

exports.getLogger = getLogger;
