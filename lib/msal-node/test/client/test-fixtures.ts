/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ServerTelemetryManager,
    Authority,
    AuthorityFactory,
} from "../../src/msal-common";

import * as msalCommon from "../../src/msal-common";
import { TEST_CONSTANTS } from "../utils/TestConstants";

// @ts-ignore
const mockServerTelemetryManager: ServerTelemetryManager = {
    // @ts-ignore
    cacheManager: undefined,
    // @ts-ignore
    apiId: undefined,
    // @ts-ignore
    correlationId: undefined,
    // @ts-ignore
    telemetryCacheKey: undefined,
    // @ts-ignore
    wrapperSKU: undefined,
    // @ts-ignore
    wrapperVer: undefined,
    regionUsed: undefined,
    regionSource: undefined,
    regionOutcome: undefined,
    // @ts-ignore
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

export const fakeAuthority: Authority = {
    regionDiscoveryMetadata: {
        region_used: undefined,
        region_source: undefined,
        region_outcome: undefined,
    },
    resolveEndpointsAsync: () => {
        return new Promise<void>((resolve) => {
            resolve();
        });
    },
    discoveryComplete: () => {
        return true;
    },
    getPreferredCache: () => {
        return TEST_CONSTANTS.PREFERRED_CACHE;
    }
} as unknown as Authority;

export const setupAuthorityFactory_createDiscoveredInstance_mock = (
    authority = fakeAuthority
): jest.SpyInstance => {
    return jest
        .spyOn(AuthorityFactory, "createDiscoveredInstance")
        .mockReturnValue(Promise.resolve(authority));
};
