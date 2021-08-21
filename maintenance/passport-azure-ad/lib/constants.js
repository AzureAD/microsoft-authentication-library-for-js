/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

"use strict";

// constants that are not strategy specific

const CONSTANTS = {};

CONSTANTS.POLICY_REGEX = /^b2c_1a?_[0-9a-z._-]+$/i;    // policy is case insensitive

CONSTANTS.CLOCK_SKEW = 300; // 5 minutes

CONSTANTS.CLIENT_ASSERTION_JWT_LIFETIME = 600; // 10 minutes
CONSTANTS.CLIENT_ASSERTION_TYPE = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";

module.exports = CONSTANTS;
