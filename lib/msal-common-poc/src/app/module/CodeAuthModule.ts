/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// app
import { MsalConfiguration } from "../MsalConfiguration";
// authority
import { AuthorityFactory } from "../../auth/authority/AuthorityFactory";
// request
import { AuthenticationParameters } from "../../request/AuthenticationParameters";
import { AuthCodeServerRequestParameters } from "../../request/server_request/AuthCodeServerRequestParameters";
// response
import { AuthResponse } from "../../response/AuthResponse";
// utils
import { CacheUtils } from "../../utils/CacheUtils";
import { AuthModule } from "./AuthModule";
import { TemporaryCacheKeys } from "../../utils/Constants";
import { TokenExchangeParameters } from "../../request/TokenExchangeParameters";
import { ClientAuthError, ClientAuthErrorMessage } from "../../error/ClientAuthError";
import { ClientConfigurationError } from "../../error/ClientConfigurationError";
import { AuthError } from "../../error/AuthError";
import { ACTokenExchangeServerRequestParameters } from "../../request/server_request/ACTokenExchangeServerRequestParameters";
import { StringUtils } from "../../utils/StringUtils";
import { TokenResponse } from "../../response/TokenResponse";
import { TimeUtils } from "../../utils/TimeUtils";

/**
 * @hidden
 * @ignore
 * Data type to hold information about state returned from the server
 */
export type ResponseStateInfo = {
    state: string;
    stateMatch: boolean;
};

/**
 * CodeAuthModule class
 * 
 * Object instance which will construct requests to send to and handle responses from the Microsoft STS using the authorization code flow.
 * 
 */
export class CodeAuthModule extends AuthModule {

    constructor(configuration: MsalConfiguration) {
        super(configuration);
    }

    async createLoginUrl(request: AuthenticationParameters): Promise<string> {
        // Initialize authority or use default, and perform discovery endpoint check
        let acquireTokenAuthority = (request && request.authority) ? AuthorityFactory.createInstance(request.authority, this.networkClient) : this.defaultAuthorityInstance;
        acquireTokenAuthority = await acquireTokenAuthority.resolveEndpointsAsync();

        // Set the account object to the current session
        request.account = this.getAccount();

        // Create and validate request parameters
        const requestParameters = new AuthCodeServerRequestParameters(
            acquireTokenAuthority,
            this.config.auth.clientId,
            request,
            true,
            false,
            this.getAccount(),
            this.getRedirectUri(),
            this.crypto
        );

        requestParameters.appendExtraScopes();

        if (!requestParameters.isSSOParam(request.account)) {
            // TODO: Add ADAL Token SSO
        }

        // if the user sets the login start page - angular only??
        const loginStartPage = window.location.href;

        // Update entries for start of request event
        CacheUtils.updateCacheEntries(this.cacheStorage, requestParameters, request.account, loginStartPage);

        // populate query parameters (sid/login_hint/domain_hint) and any other extraQueryParameters set by the developer
        requestParameters.populateQueryParams();

        const urlNavigate = await requestParameters.createNavigateUrl();

        const tokenRequest: TokenExchangeParameters = {
            scopes: requestParameters.scopes.asArray(),
            extraQueryParameters: requestParameters.request.extraQueryParameters,
            authority: requestParameters.authorityInstance.canonicalAuthority,
            state: request.state,
            correlationId: requestParameters.correlationId,
            codeVerifier: requestParameters.pkceCodes.verifier
        };

        // Cache request params for token exchange
        this.cacheStorage.setItem(TemporaryCacheKeys.REQUEST_PARAMS, JSON.stringify(tokenRequest));

        // Construct and return navigation url
        return urlNavigate;
    }

    async createAcquireTokenUrl(request: AuthenticationParameters): Promise<string> {
        throw new Error("Method not implemented.");
    }

    async acquireToken(tokenRequest: TokenExchangeParameters): Promise<AuthResponse> {
        // Get request from cache
        const request: TokenExchangeParameters = this.generateRequestParamsFromCache(tokenRequest, this.cacheStorage.getItem(TemporaryCacheKeys.REQUEST_PARAMS));
        
        // Initialize authority or use default, and perform discovery endpoint check
        let acquireTokenAuthority = (request && request.authority) ? AuthorityFactory.createInstance(request.authority, this.networkClient) : this.defaultAuthorityInstance;
        acquireTokenAuthority = await acquireTokenAuthority.resolveEndpointsAsync();
        let tokenEndpoint: string;
        try {
            tokenEndpoint = acquireTokenAuthority.tokenEndpoint;
        } catch (err) {
            const authErr: AuthError = err;
            if (authErr.errorCode === ClientAuthErrorMessage.endpointDiscoveryIncomplete.code) {
                acquireTokenAuthority = await acquireTokenAuthority.resolveEndpointsAsync();
                tokenEndpoint = acquireTokenAuthority.tokenEndpoint;
            } else {
                throw authErr;
            }
        }

        const tokenExchangeParams = new ACTokenExchangeServerRequestParameters(
            acquireTokenAuthority,
            this.config.auth.clientId,
            this.config.auth.clientSecret,
            request,
            true,
            false,
            this.getAccount(),
            this.getRedirectUri(),
            this.crypto
        );
        
        const headers = new Headers();
        headers.append("Content-type", "application/x-www-form-urlencoded");
        
        const requestBody = await tokenExchangeParams.createRequestBody();
        const acquiredTokenResponse = await this.networkClient.sendRequestAsync(tokenEndpoint, {
            method: "POST",
            headers,
            credentials: "include",
            body: requestBody
        }, true);

        const response: TokenResponse = {
            uniqueId: "",
            tenantId: "",
            tokenType: acquiredTokenResponse.token_type,
            idToken: acquiredTokenResponse.id_token,
            idTokenClaims: null,
            accessToken: acquiredTokenResponse.access_token,
            refreshToken: acquiredTokenResponse.refresh_token,
            scopes: acquiredTokenResponse.scope,
            expiresOn: TimeUtils.now() + acquiredTokenResponse.expires_in,
            account: this.getAccount(),
            state: this.parseResponseState(tokenExchangeParams.state)
        };

        return response;
    }

    private parseResponseState(state: string) {
        if (state) {
            const splitIndex = state.indexOf("|");
            if (splitIndex > -1 && splitIndex + 1 < state.length) {
                return state.substring(splitIndex + 1);
            }
        }
        return state;
    }

    private generateRequestParamsFromCache(tokenRequest: TokenExchangeParameters, stringifiedReqParams: string): TokenExchangeParameters {
        const cachedRequestParams: TokenExchangeParameters = JSON.parse(stringifiedReqParams);
        const completeRequest = { ...cachedRequestParams, code: tokenRequest.code };
        if (!completeRequest || !completeRequest.code) {
            throw ClientConfigurationError.createAuthCodeRequestError(JSON.stringify(tokenRequest));
        }
        return completeRequest;
    }
}
