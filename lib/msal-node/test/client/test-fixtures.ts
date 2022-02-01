import { ServerTelemetryManager, Authority, AuthorityFactory } from '@azure/msal-common';

import * as msalCommon from '@azure/msal-common';

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
    generateLastRequestHeaderValue: jest.fn().mockImplementation(() => "someFakeHeader"),
    cacheFailedRequest: jest.fn(),
    incrementCacheHits: jest.fn(),
    getLastRequests: jest.fn(),
    clearTelemetryCache: jest.fn(),
    getRegionDiscoveryFields: jest.fn(),
    updateRegionDiscoveryMetadata: jest.fn(),
    setCacheOutcome: jest.fn()
}

export const setupServerTelemetryManagerMock = () => {
    jest.spyOn(msalCommon, 'ServerTelemetryManager')
            .mockImplementation(() =>  mockServerTelemetryManager as unknown as ServerTelemetryManager)

    return mockServerTelemetryManager;
}

export const fakeAuthority: Authority = {
    regionDiscoveryMetadata: { region_used: undefined, region_source: undefined, region_outcome: undefined },
    resolveEndpointsAsync: () => {
        return new Promise<void>(resolve => {
            resolve();
        });
    },
    discoveryComplete: () => {
        return true;
    },
} as unknown as Authority;

export const setupAuthorityFactory_createDiscoveredInstance_mock = (authority = fakeAuthority) => {
    return jest.spyOn(AuthorityFactory, 'createDiscoveredInstance')
        .mockReturnValue(Promise.resolve(authority));
}