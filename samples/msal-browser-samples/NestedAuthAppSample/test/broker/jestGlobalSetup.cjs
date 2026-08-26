/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// Jest globalSetup: starts the host + nested sample apps over HTTPS and waits
// for both ports before the tests run.

const path = require("path");
const serverUtils = require("../../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");
const { HOST_APP_PORT, NESTED_APP_PORT } = require("../../sampleConfig.cjs");

const SERVER_READY_TIMEOUT_MS = 120000;

module.exports = async () => {
    await serverUtils.killServer(HOST_APP_PORT);
    await serverUtils.killServer(NESTED_APP_PORT);

    const sampleRoot = path.join(__dirname, "..", "..");
    serverUtils.startServer("node server.js --https", sampleRoot);

    const [hostUp, nestedUp] = await Promise.all([
        serverUtils.isServerUp(HOST_APP_PORT, SERVER_READY_TIMEOUT_MS),
        serverUtils.isServerUp(NESTED_APP_PORT, SERVER_READY_TIMEOUT_MS),
    ]);

    if (!hostUp || !nestedUp) {
        throw new Error(
            `NAA broker e2e: sample servers did not start within ` +
                `${SERVER_READY_TIMEOUT_MS}ms (host:${hostUp} nested:${nestedUp}).`
        );
    }
};
