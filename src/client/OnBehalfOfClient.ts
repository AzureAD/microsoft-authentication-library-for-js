/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientConfiguration } from "../config/ClientConfiguration";
import { BaseClient } from "./BaseClient";
import { Authority } from "../authority/Authority";
import { RequestParameterBuilder } from "../request/RequestParameterBuilder";
import { ScopeSet } from "../request/ScopeSet";
import { GrantType, AADServerParamKeys , CredentialType, Constants } from "../utils/Constants";
import { ResponseHandler } from "../response/ResponseHandler";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { OnBehalfOfRequest } from "../request/OnBehalfOfRequest";
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

    constructor(configuration: ClientConfiguration) {
        super(configuration);
    }

    /**
     * Public API to acquire tokens with on behalf of flow
     * @param request
     */
    public async acquireToken(request: OnBehalfOfRequest): Promise<AuthenticationResult | null> {
        this.scopeSet = new ScopeSet(request.scopes || []);

        if (request.skipCache) {
            return await this.executeTokenRequest(request, this.authority);
        }

        const cachedAuthenticationResult = await this.getCachedAuthenticationResult(request);
        if (cachedAuthenticationResult) {
            return cachedAuthenticationResult;
        } else {
            return await this.executeTokenRequest(request, this.authority);
        }
    }

    /**
     * look up cache for tokens
     * @param request
     */
    private async getCachedAuthenticationResult(request: OnBehalfOfRequest): Promise<AuthenticationResult | null> {
        const cachedAccessToken = this.readAccessTokenFromCache(request);
        if (!cachedAccessToken ||
            TimeUtils.isTokenExpired(cachedAccessToken.expiresOn, this.config.systemOptions.tokenRenewalOffsetSeconds)) {
            return null;
        }

        const cachedIdToken = this.readIdTokenFromCache(request);
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
                localAccountId: localAccountId || ""
            };

            cachedAccount = this.readAccountFromCache(accountInfo);
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
            }, true, idTokenObject);
    }

    /**
     * read access token from cache TODO: CacheManager API should be used here
     * @param request
     */
    private readAccessTokenFromCache(request: OnBehalfOfRequest): AccessTokenEntity | null {
        const accessTokenFilter: CredentialFilter = {
            environment: this.authority.canonicalAuthorityUrlComponents.HostNameAndPort,
            credentialType: CredentialType.ACCESS_TOKEN,
            clientId: this.config.authOptions.clientId,
            realm: this.authority.tenant,
            target: this.scopeSet.printScopesLowerCase(),
            oboAssertion: request.oboAssertion
        };

        const credentialCache: CredentialCache = this.cacheManager.getCredentialsFilteredBy(accessTokenFilter);
        const accessTokens = Object.keys(credentialCache.accessTokens).map(key => credentialCache.accessTokens[key]);

        const numAccessTokens = accessTokens.length;
        if (numAccessTokens < 1) {
            return null;
        } else if (numAccessTokens > 1) {
            throw ClientAuthError.createMultipleMatchingTokensInCacheError();
        }
        return accessTokens[0] as AccessTokenEntity;
    }

    /**
     * read idtoken from cache TODO: CacheManager API should be used here instead
     * @param request
     */
    private readIdTokenFromCache(request: OnBehalfOfRequest): IdTokenEntity | null {
        const idTokenFilter: CredentialFilter = {
            environment: this.authority.canonicalAuthorityUrlComponents.HostNameAndPort,
            credentialType: CredentialType.ID_TOKEN,
            clientId: this.config.authOptions.clientId,
            realm: this.authority.tenant,
            oboAssertion: request.oboAssertion
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
     * read account from cache, TODO: CacheManager API should be used here instead
     * @param account
     */
    private readAccountFromCache(account: AccountInfo): AccountEntity | null {
        return this.cacheManager.readAccountFromCache(account);
    }

    /**
     * Make a network call to the server requesting credentials
     * @param request
     * @param authority
     */
    private async executeTokenRequest(request: OnBehalfOfRequest, authority: Authority)
        : Promise<AuthenticationResult | null> {

        const requestBody = this.createTokenRequestBody(request);
        const headers: Record<string, string> = this.createDefaultTokenRequestHeaders();
        const thumbprint: RequestThumbprint = {
            clientId: this.config.authOptions.clientId,
            authority: request.authority,
            scopes: request.scopes
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
            request.resourceRequestMethod,
            request.resourceRequestUri,
            undefined,
            request.scopes,
            request.oboAssertion
        );

        return tokenResponse;
    }

    /**
     * generate a server request in accepable format
     * @param request
     */
    private createTokenRequestBody(request: OnBehalfOfRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        parameterBuilder.addScopes(request.scopes);

        parameterBuilder.addGrantType(GrantType.JWT_BEARER);

        parameterBuilder.addClientInfo();

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
