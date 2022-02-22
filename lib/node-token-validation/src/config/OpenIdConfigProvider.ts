/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, Logger, NetworkResponse, ProtocolMode } from "@azure/msal-common";
import { ValidationConfigurationError } from "../error/ValidationConfigurationError";
import { OpenIdConfigResponse } from "../response/OpenIdConfigResponse";
import { TokenValidationConfiguration } from "./Configuration";

export class OpenIdConfigProvider {
    protected configuration: TokenValidationConfiguration;
    protected networkInterface: INetworkModule;
    protected logger: Logger;

    constructor(configuration: TokenValidationConfiguration, networkInterface: INetworkModule, logger: Logger) {
        this.configuration = configuration;
        this.networkInterface = networkInterface;
        this.logger = logger;
    }

    /**
     * Function to fetch JWKS uri from metadata endpoint.
     * @returns - A promise that is fulfilled when this function has completed. Returns the jwks_uri string.
     */
    async fetchJwksUriFromEndpoint(): Promise<string> {
        this.logger.trace("OpenIdConfigProvider.fetchJwksUriFromEndpoint called");

        const endpointMetadata = await this.getMetadata();
        return endpointMetadata.body.jwks_uri;
    }

    /**
     * Function to fetch metadata from OpenId endpoint.
     * @returns - Endpoint metadata
     */
    async getMetadata(): Promise<NetworkResponse<OpenIdConfigResponse>> {
        this.logger.trace("OpenIdConfigProvider.getMetadata called");

        const endpoint = await this.getOpenIdConfigurationEndpoint(this.configuration.auth.authority, this.configuration.auth.protocolMode);
        this.logger.verbose(`OpenIdConfigProvider - openIdConfigurationEndpoint: ${endpoint}`);
        const endpointMetadata = await this.networkInterface.sendGetRequestAsync<OpenIdConfigResponse>(endpoint);

        if (OpenIdConfigProvider.isOpenIdConfigResponse(endpointMetadata.body)) {
            return endpointMetadata;
        } else {
            throw ValidationConfigurationError.createInvalidMetadataError();
        }
    }

    /**
     * Function to get OpenIdConfiguration endpoint, depending on protocol mode set in configuration.
     * @param authority 
     * @param protocolMode 
     * @returns 
     */
    async getOpenIdConfigurationEndpoint(authority: string, protocolMode: ProtocolMode): Promise<string> {
        const normalizedAuthority = authority.endsWith("/") ? authority : `${authority}/`;

        if (protocolMode === ProtocolMode.AAD) {
            return `${normalizedAuthority}v2.0/.well-known/openid-configuration`;
        } else {
            return `${normalizedAuthority}.well-known/openid-configuration`;
        }
    }

    /**
     * Function to check if response object contains jwks_uri property
     * @param response 
     * @returns 
     */
    static isOpenIdConfigResponse(response: object): boolean {
        return response.hasOwnProperty("jwks_uri");
    }
}
