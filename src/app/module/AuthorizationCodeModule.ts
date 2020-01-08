/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// inheritance
import { AuthModule } from "./AuthModule";
// app
import { PublicClientSPAConfiguration, buildPublicClientSPAConfiguration } from "../config/PublicClientSPAConfiguration";
// request
import { AuthenticationParameters } from "../../request/AuthenticationParameters";
import { TokenExchangeParameters } from "../../request/TokenExchangeParameters";
// response
import { TokenResponse } from "../../response/TokenResponse";
import { ClientConfigurationError } from "../../error/ClientConfigurationError";
import { AuthorityFactory } from "../../auth/authority/AuthorityFactory";
import { ServerCodeRequestParameters } from "../../server/ServerCodeRequestParameters";
import { CodeResponse } from "../../response/CodeResponse";
import { UrlString } from "../../url/UrlString";
import { ServerAuthorizationCodeResponse, validateServerAuthorizationCodeResponse } from "../../server/ServerAuthorizationCodeResponse";
import { ClientAuthError, ClientAuthErrorMessage } from "../../error/ClientAuthError";
import { ProtocolUtils } from "../../utils/ProtocolUtils";
import { TemporaryCacheKeys, PersistentCacheKeys } from "../../utils/Constants";
import { AuthError } from "../../error/AuthError";
import { ServerTokenRequestParameters } from "../../server/ServerTokenRequestParameters";

/**
 * AuthorizationCodeModule class
 * 
 * Object instance which will construct requests to send to and handle responses from the Microsoft STS using the authorization code flow.
 * 
 */
export class AuthorizationCodeModule extends AuthModule {

    // Application config
    private clientConfig: PublicClientSPAConfiguration;

    constructor(configuration: PublicClientSPAConfiguration) {
        super({
            loggerOptions: configuration.loggerOptions,
            storageInterface: configuration.storageInterface,
            networkInterface: configuration.networkInterface,
            cryptoInterface: configuration.cryptoInterface
        });
        this.clientConfig = buildPublicClientSPAConfiguration(configuration);
        this.defaultAuthorityInstance = AuthorityFactory.createInstance(this.clientConfig.auth.authority || AuthorityFactory.DEFAULT_AUTHORITY, this.networkClient);
    }

    async createLoginUrl(request: AuthenticationParameters): Promise<string> {
        // Initialize authority or use default, and perform discovery endpoint check
        const acquireTokenAuthority = (request && request.authority) ? AuthorityFactory.createInstance(request.authority, this.networkClient) : this.defaultAuthorityInstance;
        try {
            await acquireTokenAuthority.resolveEndpointsAsync();
        } catch (e) {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
        }

        // Create and validate request parameters
        const requestParameters = new ServerCodeRequestParameters(
            acquireTokenAuthority,
            this.clientConfig.auth.clientId,
            request,
            this.getRedirectUri(),
            this.cryptoObj,
            true
        );

        // Check for SSO
        if (!requestParameters.isSSOParam(this.getAccount())) {
            // TODO: Check for ADAL SSO
        }

        // Update required cache entries for request
        this.cacheManager.updateCacheEntries(requestParameters, request.account);

        // Populate query parameters (sid/login_hint/domain_hint) and any other extraQueryParameters set by the developer
        requestParameters.populateQueryParams();

        const urlNavigate = await requestParameters.createNavigateUrl();

        // Cache token request
        const tokenRequest: TokenExchangeParameters = {
            scopes: requestParameters.scopes.getOriginalScopesAsArray(),
            resource: request.resource,
            codeVerifier: requestParameters.generatedPkce.verifier,
            extraQueryParameters: request.extraQueryParameters,
            authority: requestParameters.authorityInstance.canonicalAuthority,
            correlationId: requestParameters.correlationId,            
        };

        this.cacheStorage.setItem(TemporaryCacheKeys.REQUEST_PARAMS, this.cryptoObj.base64Encode(JSON.stringify(tokenRequest)));

        return urlNavigate;
    }

    async createAcquireTokenUrl(request: AuthenticationParameters): Promise<string> {
        throw new Error("Method not implemented.");
    }

    async acquireToken(request: TokenExchangeParameters, codeResponse: CodeResponse): Promise<TokenResponse> {
        if (!codeResponse || !codeResponse.code) {
            throw ClientAuthError.createAuthCodeNullOrEmptyError();
        }

        const tokenRequest: TokenExchangeParameters = request || this.getCachedRequest();

        const acquireTokenAuthority = (request && request.authority) ? AuthorityFactory.createInstance(request.authority, this.networkClient) : this.defaultAuthorityInstance;

        if (!acquireTokenAuthority.discoveryComplete()) {
            try {
                await acquireTokenAuthority.resolveEndpointsAsync();
            } catch (e) {
                throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
            }
        }
        const { tokenEndpoint } = acquireTokenAuthority;

        const tokenReqParams = new ServerTokenRequestParameters(
            this.clientConfig.auth.clientId,
            tokenRequest,
            codeResponse,
            this.getRedirectUri(),
            this.cryptoObj
        );

        const acquiredTokenResponse = this.networkClient.sendPostRequestAsync(
            tokenEndpoint,
            {
                body: tokenReqParams.createRequestBody(),
                headers: tokenReqParams.createRequestHeaders()
            }
        );

        return null;
    }

    // #region Response Handling

    public handleFragmentResponse(hashFragment: string): CodeResponse {
        // Deserialize and validate hash fragment response parameters
        const hashUrlString = new UrlString(hashFragment);
        const hashParams = hashUrlString.getDeserializedHash<ServerAuthorizationCodeResponse>();
        try {
            validateServerAuthorizationCodeResponse(hashParams, this.cacheStorage.getItem(TemporaryCacheKeys.REQUEST_STATE), this.cryptoObj);
        } catch(e) {
            this.cacheManager.resetTempCacheItems(hashParams && hashParams.state);
            throw e;
        }

        // Cache client info
        this.cacheStorage.setItem(PersistentCacheKeys.CLIENT_INFO, hashParams.client_info);

        // Create response object
        const response: CodeResponse = {
            code: hashParams.code,
            userRequestState: ProtocolUtils.getUserRequestState(hashParams.state)
        };

        return response;
    }

    // #endregion

    // #region Helpers

    private getCachedRequest(): TokenExchangeParameters {
        try {
            const encodedTokenRequest = this.cacheStorage.getItem(TemporaryCacheKeys.REQUEST_PARAMS);
            const parsedRequest = JSON.parse(this.cryptoObj.base64Decode(encodedTokenRequest)) as TokenExchangeParameters;
            this.cacheStorage.removeItem(TemporaryCacheKeys.REQUEST_PARAMS);
            return parsedRequest;
        } catch (err) {
            throw ClientAuthError.createTokenRequestCacheError(err);
        }
    }
    
    // #endregion

    // #region Getters and setters

    /**
     *
     * Use to get the redirect uri configured in MSAL or null.
     * Evaluates redirectUri if its a function, otherwise simply returns its value.
     * @returns {string} redirect URL
     *
     */
    public getRedirectUri(): string {
        if (this.clientConfig.auth.redirectUri) {
            if (typeof this.clientConfig.auth.redirectUri === "function") {
                return this.clientConfig.auth.redirectUri();
            }
            return this.clientConfig.auth.redirectUri;
        } else {
            throw ClientConfigurationError.createRedirectUriEmptyError();
        }
    }

    /**
     * Use to get the post logout redirect uri configured in MSAL or null.
     * Evaluates postLogoutredirectUri if its a function, otherwise simply returns its value.
     *
     * @returns {string} post logout redirect URL
     */
    public getPostLogoutRedirectUri(): string {
        if (this.clientConfig.auth.postLogoutRedirectUri) {
            if (typeof this.clientConfig.auth.postLogoutRedirectUri === "function") {
                return this.clientConfig.auth.postLogoutRedirectUri();
            }
            return this.clientConfig.auth.postLogoutRedirectUri;
        } else {
            throw ClientConfigurationError.createPostLogoutRedirectUriEmptyError();
        }
    }

    // #endregion
}
