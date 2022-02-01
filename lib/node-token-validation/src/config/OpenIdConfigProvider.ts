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
    protected openIdConfigurationEndpoint: string;
    protected logger: Logger;

    constructor(configuration: TokenValidationConfiguration, networkInterface: INetworkModule, logger: Logger) {
        this.authority = configuration.auth.authority;
        this.protocolMode = configuration.auth.protocolMode;
        this.networkInterface = networkInterface;
        this.logger = logger;
    }

    async getMetadata(): Promise<NetworkResponse<OpenIdConfigResponse>> {
        this.logger.trace("OpenIdConfigProvider.getMetadata called");

        await this.setOpenIdConfigurationEndpoint();
        this.logger.verbose(`OpenIdConfigProvider - openIdConfigurationEndpoint: ${this.openIdConfigurationEndpoint}`);
        const endpointMetadata = await this.networkInterface.sendGetRequestAsync<OpenIdConfigResponse>(this.openIdConfigurationEndpoint);

        if (OpenIdConfigProvider.isOpenIdConfigResponse(endpointMetadata.body)) {
            return endpointMetadata;
        } else {
            throw ValidationConfigurationError.createInvalidMetadataError();
        }
    }

    async fetchJwksUriFromEndpoint(): Promise<string> {
        this.logger.trace("OpenIdConfigProvider.fetchJwksUriFromEndpoint called");

        const endpointMetadata = await this.getMetadata();
        return endpointMetadata.body.jwks_uri;
    }

    async setOpenIdConfigurationEndpoint(): Promise<void> {
        if (this.protocolMode === ProtocolMode.AAD) {
            this.openIdConfigurationEndpoint = `${this.authority}v2.0/.well-known/openid-configuration`;
        }
        this.openIdConfigurationEndpoint = `${this.authority}.well-known/openid-configuration`;
    }

    static isOpenIdConfigResponse(response: object): boolean {
        return response.hasOwnProperty("jwks_uri");
    }
}
