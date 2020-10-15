import { ClientConfiguration } from "../config/ClientConfiguration";
import { NetworkResponse } from '../network/NetworkManager';
import { RequestThumbprint } from '../network/RequestThumbprint';
import { RefreshTokenRequest } from '../request/RefreshTokenRequest';
import { AuthenticationResult } from '../response/AuthenticationResult';
import { ResponseHandler } from '../response/ResponseHandler';
import { ServerAuthorizationTokenResponse } from '../response/ServerAuthorizationTokenResponse';
import { RefreshTokenClient } from './RefreshTokenClient';

export class RefreshTokenClientNonPkce extends RefreshTokenClient{
    constructor(configuration: ClientConfiguration) {
        super(configuration);
    }

    public async acquireToken(request: RefreshTokenRequest): Promise<AuthenticationResult> {
        const response = await this.executeTokenRequestToAuthCodeExchangeServer(request);

        const responseHandler = new ResponseHandler(
            this.config.authOptions.clientId,
            this.cacheManager,
            this.cryptoUtils,
            this.logger,
            this.config.serializableCache,
            this.config.persistencePlugin
        );

        responseHandler.validateTokenResponse(response.body);
        return responseHandler.handleServerTokenResponse(
            response.body,
            this.authority,
            request.resourceRequestMethod,
            request.resourceRequestUri,
            null,
            null,
            null,
            null,
            true
        );
    }

    /**
     * Executes POST request to token endpoint
     * @param authority
     * @param request
     */
    private async executeTokenRequestToAuthCodeExchangeServer(request: RefreshTokenRequest): Promise<NetworkResponse<ServerAuthorizationTokenResponse>> {
        const thumbprint: RequestThumbprint = {
            clientId: this.config.authOptions.clientId,
            authority: this.config.authOptions.nonPkceAuthCodeExchangeEndpoint,
            scopes: request.scopes
        };
        
        const headers: Record<string, string> = this.createDefaultTokenRequestHeaders();
        const requestBody = await this.createTokenRequestBody(request);
        return this.executePostToTokenEndpoint(this.config.authOptions.nonPkceAuthCodeExchangeEndpoint, requestBody, headers, thumbprint);
    }
}