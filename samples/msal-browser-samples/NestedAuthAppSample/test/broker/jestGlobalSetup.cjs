/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * Jest globalSetup for the opt-in platform-broker spec. Starts BOTH sample apps
 * (host + nested) over HTTPS from `.env` — the real app registrations that are
 * linked for brokering — and waits until each port is serving before the tests
 * launch branded Chrome. `server.js --https` orchestrates both apps and their
 * coordinated shutdown; we only add readiness polling on top.
 *
 * Server processes are torn down by `jestGlobalTeardown.cjs` (kill-by-port).
 */

const path = require("path");
const serverUtils = require("../../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");
const { HOST_APP_PORT, NESTED_APP_PORT } = require("../../sampleConfig.cjs");

const SERVER_READY_TIMEOUT_MS = 120000;

module.exports = async () => {
    // Clear anything left listening on the sample ports from a prior run.
    await serverUtils.killServer(HOST_APP_PORT);
    await serverUtils.killServer(NESTED_APP_PORT);

    const sampleRoot = path.join(__dirname, "..", "..");
    // `.env` (not `.env.e2e`) supplies the linked broker registrations; server.js
    // loads it via dotenv, so no env-cmd wrapper is needed here.
    serverUtils.startServer("node server.js --https", sampleRoot);

    const [hostUp, nestedUp] = await Promise.all([
        serverUtils.isServerUp(HOST_APP_PORT, SERVER_READY_TIMEOUT_MS),
        serverUtils.isServerUp(NESTED_APP_PORT, SERVER_READY_TIMEOUT_MS),
    ]);

    if (!hostUp || !nestedUp) {
        throw new Error(
            `NAA broker e2e: sample servers did not start within ` +
                `${SERVER_READY_TIMEOUT_MS}ms (host:${hostUp} nested:${nestedUp}). ` +
                `Ensure .env has valid VITE_HOST_CLIENT_ID / VITE_NESTED_CLIENT_ID / VITE_AUTHORITY.`
        );
    }
};
