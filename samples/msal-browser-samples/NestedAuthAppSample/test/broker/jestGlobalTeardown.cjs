/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// Jest globalTeardown: stops the sample servers started in globalSetup.

const serverUtils = require("../../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");
const { HOST_APP_PORT, NESTED_APP_PORT } = require("../../sampleConfig.cjs");

module.exports = async () => {
    await serverUtils.killServer(HOST_APP_PORT);
    await serverUtils.killServer(NESTED_APP_PORT);
};
