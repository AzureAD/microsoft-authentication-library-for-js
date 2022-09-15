/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientConfiguration } from "../config/ClientConfiguration";
import { BaseClient } from "./BaseClient";
import { Authority } from "../authority/Authority";
import { RequestParameterBuilder } from "../request/RequestParameterBuilder";
import { ScopeSet } from "../request/ScopeSet";
import { GrantType, AADServerParamKeys , CredentialType, Constants, CacheOutcome, AuthenticationScheme } from "../utils/Constants";
import { ResponseHandler } from "../response/ResponseHandler";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { CommonOnBehalfOfRequest } from "../request/CommonOnBehalfOfRequest";
import { TimeUtils } from "../utils/TimeUtils";
import { CredentialFilter, CredentialCache } from "../cache/utils/CacheTypes";
import { AccessTokenEntity } from "../cache/entities/AccessTokenEntity";
import { IdTokenEntity } from "../cache/entities/IdTokenEntity";
import { AccountEntity } from "../cache/entities/AccountEntity";
import { AuthToken } from "../account/AuthToken";
import { ClientAuthError } from "../error/ClientAuthError";
import { RequestThumbprint } from "../network/RequestThumbprint";
import { AccountInfo } from "../account/AccountInfo";

/**
 * On-Behalf-Of client
 */
export class OnBehalfOfClient extends BaseClient {

    private scopeSet: ScopeSet;
    private userAssertionHash: string;

    constructor(configuration: ClientConfiguration) {
        super(configuration);
    }

    /**
     * Public API to acquire tokens with on behalf of flow
     * @param request
     */
    public async acquireToken(request: CommonOnBehalfOfRequest): Promise<AuthenticationResult | null> {
        this.scopeSet = new ScopeSet(request.scopes || []);

        // generate the user_assertion_hash for OBOAssertion
        this.userAssertionHash = await this.cryptoUtils.hashString(request.oboAssertion);

        if (request.skipCache) {
            return await this.executeTokenRequest(request, this.authority, this.userAssertionHash);
        }

        try {
            return await this.getCachedAuthenticationResult(request);
        } catch (e) {
            // Any failure falls back to interactive request, once we implement distributed cache, we plan to handle `createRefreshRequiredError` to refresh using the RT
            return await this.executeTokenRequest(request, this.authority, this.userAssertionHash);
        }
    }

    /**
     * look up cache for tokens
     * Find idtoken in the cache
     * Find accessToken based on user assertion and account info in the cache
     * Please note we are not yet supported OBO tokens refreshed with long lived RT. User will have to send a new assertion if the current access token expires
     * This is to prevent security issues when the assertion changes over time, however, longlived RT helps retaining the session
     * @param request
     */
    private async getCachedAuthenticationResult(request: CommonOnBehalfOfRequest): Promise<AuthenticationResult | null> {

        // look in the cache for the access_token which matches the incoming_assertion
        const cachedAccessToken = this.readAccessTokenFromCacheForOBO(this.config.authOptions.clientId, request);
        if (!cachedAccessToken) {
            // Must refresh due to non-existent access_token.
            this.serverTelemetryManager?.setCacheOutcome(CacheOutcome.NO_CACHED_ACCESS_TOKEN);
            this.logger.info("SilentFlowClient:acquireCachedToken - No access token found in cache for the given properties.");
            throw ClientAuthError.createRefreshRequiredError();
        } else if (TimeUtils.isTokenExpired(cachedAccessToken.expiresOn, this.config.systemOptions.tokenRenewalOffsetSeconds)) {
            // Access token expired, will need to renewed
            this.serverTelemetryManager?.setCacheOutcome(CacheOutcome.CACHED_ACCESS_TOKEN_EXPIRED);
            this.logger.info(`OnbehalfofFlow:getCachedAuthenticationResult - Cached access token is expired or will expire within ${this.config.systemOptions.tokenRenewalOffsetSeconds} seconds.`);
            throw ClientAuthError.createRefreshRequiredError();
        }

        // fetch the idToken from cache
        const cachedIdToken = this.readIdTokenFromCacheForOBO(request, cachedAccessToken.homeAccountId);
        let idTokenObject: AuthToken | undefined;
        let cachedAccount: AccountEntity | null = null;
        if (cachedIdToken) {
            idTokenObject = new AuthToken(cachedIdToken.secret, this.config.cryptoInterface);
            const localAccountId = idTokenObject.claims.oid ? idTokenObject.claims.oid : idTokenObject.claims.sub;
            const accountInfo: AccountInfo = {
                homeAccountId: cachedIdToken.homeAccountId,
                environment: cachedIdToken.environment,
                tenantId: cachedIdToken.realm,
                username: Constants.EMPTY_STRING,
                localAccountId: localAccountId || Constants.EMPTY_STRING
            };

            cachedAccount = this.cacheManager.readAccountFromCache(accountInfo);
        }

        // increment telemetry cache hit counter
        if (this.config.serverTelemetryManager) {
            this.config.serverTelemetryManager.incrementCacheHits();
        }

        return await ResponseHandler.generateAuthenticationResult(
            this.cryptoUtils,
            this.authority,
            {
                account: cachedAccount,
                accessToken: cachedAccessToken,
                idToken: cachedIdToken,
                refreshToken: null,
                appMetadata: null
            },
            true,
            request,
            idTokenObject);
    }

    /**
     * read idtoken from cache, this is a specific implementation for OBO as the requirements differ from a generic lookup in the cacheManager
     * Certain use cases of OBO flow do not expect an idToken in the cache/or from the service
     * @param request
     */
    private readIdTokenFromCacheForOBO(request: CommonOnBehalfOfRequest, atHomeAccountId: string): IdTokenEntity | null {

        const idTokenFilter: CredentialFilter = {
            homeAccountId: atHomeAccountId,
            environment: this.authority.canonicalAuthorityUrlComponents.HostNameAndPort,
            credentialType: CredentialType.ID_TOKEN,
            clientId: this.config.authOptions.clientId,
            realm: this.authority.tenant
        };

        const credentialCache: CredentialCache = this.cacheManager.getCredentialsFilteredBy(idTokenFilter);
        const idTokens = Object.keys(credentialCache.idTokens).map(key => credentialCache.idTokens[key]);
        // When acquiring a token on behalf of an application, there might not be an id token in the cache
        if (idTokens.length < 1) {
            return null;
        }
        return idTokens[0] as IdTokenEntity;
    }

    /**
     * Fetches the cached access token based on incoming assertion
     * @param clientId
     * @param request
     * @param userAssertionHash
     */
    private readAccessTokenFromCacheForOBO(clientId: string, request: CommonOnBehalfOfRequest) {
        const authScheme = request.authenticationScheme || AuthenticationScheme.BEARER;
        /*
         * Distinguish between Bearer and PoP/SSH token cache types
         * Cast to lowercase to handle "bearer" from ADFS
         */
        const credentialType = (authScheme && authScheme.toLowerCase() !== AuthenticationScheme.BEARER.toLowerCase()) ? CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME : CredentialType.ACCESS_TOKEN;

        const accessTokenFilter: CredentialFilter = {
            credentialType: credentialType,
            clientId,
            target: this.scopeSet.printScopesLowerCase(),
            tokenType: authScheme,
            keyId: request.sshKid,
            requestedClaimsHash: request.requestedClaimsHash,
            userAssertionHash: this.userAssertionHash
        };

        const credentialCache: CredentialCache = this.cacheManager.getCredentialsFilteredBy(accessTokenFilter);

        const accessTokens = Object.keys(credentialCache.accessTokens).map((key) => credentialCache.accessTokens[key]);

        const numAccessTokens = accessTokens.length;
        if (numAccessTokens < 1) {
            return null;
        } else if (numAccessTokens > 1) {
            throw ClientAuthError.createMultipleMatchingTokensInCacheError();
        }

        return accessTokens[0] as AccessTokenEntity;
    }

    /**
     * Make a network call to the server requesting credentials
     * @param request
     * @param authority
     */
    private async executeTokenRequest(request: CommonOnBehalfOfRequest, authority: Authority, userAssertionHash: string)
        : Promise<AuthenticationResult | null> {

        const requestBody = this.createTokenRequestBody(request);
        const headers: Record<string, string> = this.createTokenRequestHeaders();
        const thumbprint: RequestThumbprint = {
            clientId: this.config.authOptions.clientId,
            authority: request.authority,
            scopes: request.scopes,
            claims: request.claims,
            authenticationScheme: request.authenticationScheme,
            resourceRequestMethod: request.resourceRequestMethod,
            resourceRequestUri: request.resourceRequestUri,
            shrClaims: request.shrClaims,
            sshKid: request.sshKid
        };

        const reqTimestamp = TimeUtils.nowSeconds();
        const response = await this.executePostToTokenEndpoint(authority.tokenEndpoint, requestBody, headers, thumbprint);

        const responseHandler = new ResponseHandler(
            this.config.authOptions.clientId,
            this.cacheManager,
            this.cryptoUtils,
            this.logger,
            this.config.serializableCache,
            this.config.persistencePlugin
        );

        responseHandler.validateTokenResponse(response.body);
        const tokenResponse = await responseHandler.handleServerTokenResponse(
            response.body,
            this.authority,
            reqTimestamp,
            request,
            undefined,
            userAssertionHash
        );

        return tokenResponse;
    }

    /**
     * generate a server request in accepable format
     * @param request
     */
    private createTokenRequestBody(request: CommonOnBehalfOfRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        parameterBuilder.addScopes(request.scopes);

        parameterBuilder.addGrantType(GrantType.JWT_BEARER);

        parameterBuilder.addClientInfo();

        parameterBuilder.addLibraryInfo(this.config.libraryInfo);
        parameterBuilder.addApplicationTelemetry(this.config.telemetry.application);
        parameterBuilder.addThrottling();

        if (this.serverTelemetryManager) {
            parameterBuilder.addServerTelemetry(this.serverTelemetryManager);
        }

        const correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
        parameterBuilder.addCorrelationId(correlationId);

        parameterBuilder.addRequestTokenUse(AADServerParamKeys.ON_BEHALF_OF);

        parameterBuilder.addOboAssertion(request.oboAssertion);

        if (this.config.clientCredentials.clientSecret) {
            parameterBuilder.addClientSecret(this.config.clientCredentials.clientSecret);
        }

        if (this.config.clientCredentials.clientAssertion) {
            const clientAssertion = this.config.clientCredentials.clientAssertion;
            parameterBuilder.addClientAssertion(clientAssertion.assertion);
            parameterBuilder.addClientAssertionType(clientAssertion.assertionType);
        }

        return parameterBuilder.createQueryString();
    }
}
