/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerTelemetryManager } from "@azure/msal-common";

import * as msalCommon from "@azure/msal-common";

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
    jest.spyOn(msalCommon, "ServerTelemetryManager").mockImplementation(
        () => mockServerTelemetryManager as unknown as ServerTelemetryManager
    );

    return mockServerTelemetryManager;
};
