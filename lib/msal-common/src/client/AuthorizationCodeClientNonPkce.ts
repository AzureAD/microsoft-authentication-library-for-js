import { AuthorizationCodeClient } from "./AuthorizationCodeClient";
import { ClientConfiguration } from "../config/ClientConfiguration";
import { ResponseHandler } from '../response/ResponseHandler';
import { ServerAuthorizationTokenResponse } from '../response/ServerAuthorizationTokenResponse';
import { AuthorizationCodeRequest } from '../request/AuthorizationCodeRequest';
import { StringUtils } from '../utils/StringUtils';
import { ClientAuthError } from '../error/ClientAuthError';
import { AuthenticationResult } from '../response/AuthenticationResult';
import { NetworkResponse } from '../network/NetworkManager';
import { RequestThumbprint } from '../network/RequestThumbprint';

export class AuthorizationCodeClientNonPkce extends AuthorizationCodeClient{
    constructor(configuration: ClientConfiguration) {
        super(configuration);
    }

    async acquireToken(request: AuthorizationCodeRequest, cachedNonce?: string, cachedState?: string): Promise<AuthenticationResult> {
        this.logger.info("in non-PKCE acquireToken call");
        if (!request || StringUtils.isEmpty(request.code)) {
            throw ClientAuthError.createTokenRequestCannotBeMadeError();
        }
        const response = await this.executeTokenRequestToAuthCodeExchangeServer(request);
        const responseHandler = new ResponseHandler(
            this.config.authOptions.clientId,
            this.cacheManager,
            this.cryptoUtils,
            this.logger,
            this.config.serializableCache,
            this.config.persistencePlugin
        );

        // Validate response. This function throws a server error if an error is returned by the server.
        responseHandler.validateTokenResponse(response.body);
        return await responseHandler.handleServerTokenResponse(response.body, this.authority, request.resourceRequestMethod, request.resourceRequestUri, cachedNonce, cachedState);
    }

    /**
     * Executes POST request to token endpoint
     * @param authority
     * @param request
     */
    private async executeTokenRequestToAuthCodeExchangeServer(request: AuthorizationCodeRequest): Promise<NetworkResponse<ServerAuthorizationTokenResponse>> {
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