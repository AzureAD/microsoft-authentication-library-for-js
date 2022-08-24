/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { buildConfiguration } from "../../src/config/Configuration";
import { OpenIdConfigProvider } from "../../src/config/OpenIdConfigProvider";
import { DEFAULT_CRYPTO_IMPLEMENTATION, TEST_CONSTANTS } from "../utils/TestConstants";
import { Authority, AuthorityFactory, Logger } from "@azure/msal-common";
import { ValidationConfigurationError, ValidationConfigurationErrorMessage } from "../../src/error/ValidationConfigurationError";
import { NodeCacheManager } from "../../src/cache/NodeCacheManager";
import "regenerator-runtime";

describe("OpenIdConfigProvider", () => {
    const config = buildConfiguration({
        auth: {
            authority: TEST_CONSTANTS.DEFAULT_AUTHORITY
        }
    });
    const logger = new Logger(config.system.loggerOptions);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("constructor", () => {
        it("exports a class", () => {
            const cache = new NodeCacheManager(logger, TEST_CONSTANTS.CLIENT_ID, DEFAULT_CRYPTO_IMPLEMENTATION);
            const provider = new OpenIdConfigProvider(config, config.system.networkClient, cache, logger);
            expect(provider).toBeInstanceOf(OpenIdConfigProvider);
        });
    });

    describe("fetchJwksUriFromEndpoint", () => {

        it("returns jwks_uri", async () => {
            const cache = new NodeCacheManager(logger, TEST_CONSTANTS.CLIENT_ID, DEFAULT_CRYPTO_IMPLEMENTATION);
            const provider = new OpenIdConfigProvider(config, config.system.networkClient, cache,logger);

            const mockAuthority = {
                regionDiscoveryMetadata: { region_used: undefined, region_source: undefined, region_outcome: undefined },
                resolveEndpointsAsync: () => {
                    return new Promise<void>(resolve => {
                        resolve();
                    });
                },
                discoveryComplete: () => {
                    return true;
                },
                jwksUri: TEST_CONSTANTS.DEFAULT_JWKS_URI_OIDC
            } as unknown as Authority;

            const mockDiscoveredInstance = jest.spyOn(AuthorityFactory, "createDiscoveredInstance").mockReturnValue(Promise.resolve(mockAuthority));
    
            const response = await provider.fetchJwksUriFromEndpoint();
    
            expect(mockDiscoveredInstance).toHaveBeenCalledTimes(1);
            expect(response).toEqual(TEST_CONSTANTS.DEFAULT_JWKS_URI_OIDC);
        });
    
        it("throws error if openIdResponse does not contain jwks_uri", async () => {
            const cache = new NodeCacheManager(logger, TEST_CONSTANTS.CLIENT_ID, DEFAULT_CRYPTO_IMPLEMENTATION);
            const provider = new OpenIdConfigProvider(config, config.system.networkClient, cache, logger);

            const mockAuthority = {
                regionDiscoveryMetadata: { region_used: undefined, region_source: undefined, region_outcome: undefined },
                resolveEndpointsAsync: () => {
                    return new Promise<void>(resolve => {
                        resolve();
                    });
                },
                discoveryComplete: () => {
                    return true;
                }
            } as unknown as Authority;

            const mockDiscoveredInstance = jest.spyOn(AuthorityFactory, "createDiscoveredInstance").mockReturnValue(Promise.resolve(mockAuthority));
    
            await provider.fetchJwksUriFromEndpoint()
                .catch((e) => {
                    expect(mockDiscoveredInstance).toHaveBeenCalledTimes(1);
                    expect(e).toBeInstanceOf(ValidationConfigurationError);
                    expect(e.errorCode).toContain(ValidationConfigurationErrorMessage.invalidMetadata.code);
                    expect(e.errorMessage).toContain(ValidationConfigurationErrorMessage.invalidMetadata.desc);
                });
        });

    });

});
