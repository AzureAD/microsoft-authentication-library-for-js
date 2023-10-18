/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const jestConfig = require("../../shared-configs/jest-config/jest.config.cjs");

// Adding mock nestedAppAuth bridge
jestConfig.setupFilesAfterEnv.push("./test/utils/BridgeSetup.ts");

module.exports = jestConfig;
