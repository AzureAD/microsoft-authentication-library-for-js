/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientConfiguration } from "../config/ClientConfiguration";
import { BaseClient } from "./BaseClient";
import { Authority } from "../authority/Authority";
import { RequestParameterBuilder } from "../request/RequestParameterBuilder";
import { ScopeSet } from "../request/ScopeSet";
import { GrantType, AADServerParamKeys , CredentialType } from "../utils/Constants";
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

    public async acquireToken(request: OnBehalfOfRequest): Promise<AuthenticationResult> {
        this.scopeSet = new ScopeSet(request.scopes || []);

        if (request.skipCache) {
            return await this.executeTokenRequest(request, this.authority);
        }

        const cachedAuthenticationResult = this.getCachedAuthenticationResult(request);
        if (cachedAuthenticationResult !== null) {
            return cachedAuthenticationResult;
        } else {
            return await this.executeTokenRequest(request, this.authority);
        }
    }

    private async getCachedAuthenticationResult(request: OnBehalfOfRequest): Promise<AuthenticationResult | null> {
        const cachedAccessToken = this.readAccessTokenFromCache(request);
        if (!cachedAccessToken ||
            TimeUtils.isTokenExpired(cachedAccessToken.expiresOn, this.config.systemOptions.tokenRenewalOffsetSeconds)) {
            return null;
        }

        const cachedIdToken = this.readIdTokenFromCache(request);
        let idTokenObject: AuthToken = null;
        let cachedAccount: AccountEntity = null;
        if (cachedIdToken) {
            idTokenObject = new AuthToken(cachedIdToken.secret, this.config.cryptoInterface);
            const accountInfo: AccountInfo = {
                homeAccountId: cachedIdToken.homeAccountId,
                environment: cachedIdToken.environment,
                tenantId: cachedIdToken.realm,
                username: null
            };

            cachedAccount = this.readAccountFromCache(accountInfo);
        }

        return await ResponseHandler.generateAuthenticationResult(
            this.cryptoUtils,
            {
                account: cachedAccount,
                accessToken: cachedAccessToken,
                idToken: cachedIdToken,
                refreshToken: undefined,
                appMetadata: undefined,
            }, true, idTokenObject);
    }

    private readAccessTokenFromCache(request: OnBehalfOfRequest): AccessTokenEntity {
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

    private readIdTokenFromCache(request: OnBehalfOfRequest): IdTokenEntity {
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

    private readAccountFromCache(account: AccountInfo): AccountEntity {
        return this.cacheManager.readAccountFromCache(account);
    }

    private async executeTokenRequest(request: OnBehalfOfRequest, authority: Authority)
        : Promise<AuthenticationResult> {

        const requestBody = this.createTokenRequestBody(request);
        const headers: Record<string, string> = this.createDefaultTokenRequestHeaders();
        const thumbprint: RequestThumbprint = {
            clientId: this.config.authOptions.clientId,
            authority: request.authority,
            scopes: request.scopes
        };

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
            request.resourceRequestMethod,
            request.resourceRequestUri,
            null,
            null,
            request.scopes,
            request.oboAssertion
        );

        return tokenResponse;
    }

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
