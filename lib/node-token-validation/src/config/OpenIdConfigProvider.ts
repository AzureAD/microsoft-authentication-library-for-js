import { INetworkModule, Logger, NetworkResponse } from "@azure/msal-common";
import { ValidationConfigurationError } from "../error/ValidationConfigurationError";
import { OpenIdConfigResponse } from "../response/OpenIdConfigResponse";

export class OpenIdConfigProvider {
    protected authority: string;
    protected networkInterface: INetworkModule;
    protected openIdConfigurationEndpoint: string;
    protected logger: Logger;

    constructor(authority: string, networkInterface: INetworkModule, logger: Logger) {
        this.authority = authority;
        this.networkInterface = networkInterface;
        this.logger = logger
    }

    async getMetadata(): Promise<NetworkResponse<OpenIdConfigResponse>> {
        this.logger.verbose("getMetadata called");

        try {
            await this.setOpenIdConfigurationEndpoint();
            this.logger.verbose(`openIdConfigurationEndpoint: ${this.openIdConfigurationEndpoint}`);
            const endpointMetadata = await this.networkInterface.sendGetRequestAsync<OpenIdConfigResponse>(this.openIdConfigurationEndpoint);

            if (OpenIdConfigProvider.isOpenIdConfigResponse(endpointMetadata.body)) {
                return endpointMetadata;
            } else {
                throw ValidationConfigurationError.createInvalidMetadataError();
            }
        } catch (e) {
            throw e;
        }
    }

    async fetchJwksUriFromEndpoint(): Promise<string> {
        this.logger.verbose("fetchJwksUriFromEndpoint called");

        try {
            const endpointMetadata = await this.getMetadata();
            return endpointMetadata.body.jwks_uri;
        } catch (e) {
            throw e;
        }
    }

    async setOpenIdConfigurationEndpoint(): Promise<void> {
        this.openIdConfigurationEndpoint = `${this.authority}v2.0/.well-known/openid-configuration`; // v2.0 or just well-known? Protocol mode?
    }

    static isOpenIdConfigResponse(response: object): boolean {
        return response.hasOwnProperty("jwks_uri");
    };
}
