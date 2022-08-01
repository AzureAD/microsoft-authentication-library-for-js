/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorityFactory, AuthorityOptions, INetworkModule, Logger } from "@azure/msal-common";
import { ValidationConfigurationError } from "../error/ValidationConfigurationError";
import { TokenValidationConfiguration } from "./Configuration";
import { Constants } from "../utils/Constants";
import { NodeCacheManager } from "../cache/NodeCacheManager";

export class OpenIdConfigProvider {
    protected config: TokenValidationConfiguration;
    protected networkInterface: INetworkModule;
    protected storage: NodeCacheManager;
    protected logger: Logger;

    constructor(config: TokenValidationConfiguration, networkInterface: INetworkModule, storage: NodeCacheManager, logger: Logger) {
        this.config = config;
        this.networkInterface = networkInterface;
        this.storage = storage;
        this.logger = logger;
    }

    /**
     * Function to fetch JWKS uri from metadata endpoint.
     *
     * @returns {Promise<string>} A promise that is fulfilled when this function has completed. Returns the jwks_uri string.
     */
    async fetchJwksUriFromEndpoint(): Promise<string> {
        this.logger.trace("OpenIdConfigProvider.fetchJwksUriFromEndpoint called");

        const authorityOptions: AuthorityOptions = {
            protocolMode: this.config.auth.protocolMode,
            knownAuthorities: this.config.auth.knownAuthorities,
            cloudDiscoveryMetadata: Constants.EMPTY_STRING,
            authorityMetadata: Constants.EMPTY_STRING
        };

        const authority = await AuthorityFactory.createDiscoveredInstance(this.config.auth.authority, this.networkInterface, this.storage, authorityOptions);

        if (!authority.jwksUri) {
            throw ValidationConfigurationError.createInvalidMetadataError();
        }
        return authority.jwksUri;
    }
}
