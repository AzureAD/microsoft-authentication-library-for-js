/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const jestConfig = require("../../shared-configs/jest-config/jest.config.cjs");

jestConfig.testEnvironmentOptions.userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";

// Adding mock nestedAppAuth bridge
jestConfig.setupFilesAfterEnv.push("./test/utils/BridgeSetup.ts");

module.exports = jestConfig;
