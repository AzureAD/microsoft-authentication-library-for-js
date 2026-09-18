/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerTelemetryManager } from "../../src/common/telemetry/server/ServerTelemetryManager.js";

// @ts-ignore
const mockServerTelemetryManager: ServerTelemetryManager = {
    cacheManager: undefined,
    apiId: undefined,
    correlationId: undefined,
    telemetryCacheKey: undefined,
    wrapperSKU: undefined,
    wrapperVer: undefined,
    regionUsed: undefined,
    regionSource: undefined,
    regionOutcome: undefined,
    cacheOutcome: undefined,
    generateCurrentRequestHeaderValue: jest.fn(),
    generateLastRequestHeaderValue: jest
        .fn()
        .mockImplementation(() => "someFakeHeader"),
    cacheFailedRequest: jest.fn(),
    incrementCacheHits: jest.fn(),
    getLastRequests: jest.fn(),
    clearTelemetryCache: jest.fn(),
    getRegionDiscoveryFields: jest.fn(),
    updateRegionDiscoveryMetadata: jest.fn(),
    setCacheOutcome: jest.fn(),
};

export const setupServerTelemetryManagerMock = () => {
    jest.doMock(
        "../../src/common/telemetry/server/ServerTelemetryManager.js",
        () => ({
            ServerTelemetryManager: jest
                .fn()
                .mockImplementation(
                    () =>
                        mockServerTelemetryManager as unknown as ServerTelemetryManager
                ),
        })
    );

    return mockServerTelemetryManager;
};
