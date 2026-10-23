/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "../../src/common/logger/Logger.js";
import { StubPerformanceClient } from "../../src/common/telemetry/performance/StubPerformanceClient.js";
import { ServerTelemetryManager } from "../../src/common/telemetry/server/ServerTelemetryManager.js";
import { ServerTelemetryRequest } from "../../src/common/telemetry/server/ServerTelemetryRequest.js";
import { MockStorageClass, mockCrypto } from "../client/ClientTestUtils.js";
import { TEST_CONFIG } from "../test_kit/StringConstants.js";

const apiId = 9999999;
const correlationId = "telemetry-correlation-id";
const cacheKey = `server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`;
const telemetryRequest: ServerTelemetryRequest = {
    apiId,
    correlationId,
    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
};

describe("ServerTelemetryManager", () => {
    const cacheManager = new MockStorageClass(
        TEST_CONFIG.MSAL_CLIENT_ID,
        mockCrypto,
        new Logger({}),
        new StubPerformanceClient()
    );

    afterEach(() => {
        cacheManager.store = {};
    });

    it.each([
        [{ errorCode: "foreign_error", subError: "" }, "foreign_error"],
        [
            { errorCode: "foreign_error", subError: "foreign_sub_error" },
            "foreign_sub_error",
        ],
    ])(
        "uses stable fields from an AuthError-like instance owned by another package",
        (properties, expectedError) => {
            const telemetryManager = new ServerTelemetryManager(
                telemetryRequest,
                cacheManager
            );
            const foreignAuthError = Object.assign(
                new Error("sensitive diagnostic message"),
                properties
            );

            telemetryManager.cacheFailedRequest(foreignAuthError);

            expect(cacheManager.getServerTelemetry(cacheKey)).toEqual({
                failedRequests: [apiId, correlationId],
                errors: [expectedError],
                cacheHits: 0,
            });
        }
    );

    it("stringifies errors without stable auth error fields", () => {
        const telemetryManager = new ServerTelemetryManager(
            telemetryRequest,
            cacheManager
        );

        telemetryManager.cacheFailedRequest(new Error("ordinary error"));

        expect(cacheManager.getServerTelemetry(cacheKey)?.errors).toEqual([
            "Error: ordinary error",
        ]);
    });
});
