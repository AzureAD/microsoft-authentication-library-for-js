/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, Logger, NetworkResponse, ProtocolMode } from "@azure/msal-common";
import { ValidationConfigurationError } from "../error/ValidationConfigurationError";
import { OpenIdConfigResponse } from "../response/OpenIdConfigResponse";
import { TokenValidationConfiguration } from "./Configuration";

export class OpenIdConfigProvider {
    protected authority: string;
    protected protocolMode: ProtocolMode;
    protected networkInterface: INetworkModule;
    protected logger: Logger;

    constructor(configuration: TokenValidationConfiguration, networkInterface: INetworkModule, logger: Logger) {
        this.authority = configuration.auth.authority;
        this.protocolMode = configuration.auth.protocolMode;
        this.networkInterface = networkInterface;
        this.logger = logger;
    }

    async fetchJwksUriFromEndpoint(): Promise<string> {
        this.logger.trace("OpenIdConfigProvider.fetchJwksUriFromEndpoint called");

        const endpointMetadata = await this.getMetadata();
        return endpointMetadata.body.jwks_uri;
    }

    async getMetadata(): Promise<NetworkResponse<OpenIdConfigResponse>> {
        this.logger.trace("OpenIdConfigProvider.getMetadata called");

        const endpoint = await this.getOpenIdConfigurationEndpoint();
        this.logger.verbose(`OpenIdConfigProvider - openIdConfigurationEndpoint: ${endpoint}`);
        const endpointMetadata = await this.networkInterface.sendGetRequestAsync<OpenIdConfigResponse>(endpoint);

        if (OpenIdConfigProvider.isOpenIdConfigResponse(endpointMetadata.body)) {
            return endpointMetadata;
        } else {
            throw ValidationConfigurationError.createInvalidMetadataError();
        }
    }

    async getOpenIdConfigurationEndpoint(): Promise<string> {
        const normalizedAuthority = this.authority.endsWith("/") ? this.authority : `${this.authority}/`;

        if (this.protocolMode === ProtocolMode.AAD) {
            return `${normalizedAuthority}v2.0/.well-known/openid-configuration`;
        } else {
            return `${normalizedAuthority}.well-known/openid-configuration`;
        }
    }

    static isOpenIdConfigResponse(response: object): boolean {
        return response.hasOwnProperty("jwks_uri");
    }
}
