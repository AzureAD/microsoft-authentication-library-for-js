/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const jestConfig = require("../../shared-configs/jest-config/jest.config.cjs");

jestConfig.testEnvironment = "jsdom";

module.exports = jestConfig;
