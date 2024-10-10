/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccessTokenEntity,
    ICrypto,
    IdTokenEntity,
    Logger,
    ScopeSet,
    Authority,
    AuthorityOptions,
    ExternalTokenResponse,
    AccountEntity,
    AuthToken,
    RefreshTokenEntity,
    CacheRecord,
    TokenClaims,
    CacheHelpers,
    buildAccountToCache,
} from "@azure/msal-common/browser";
import { BrowserConfiguration } from "../config/Configuration.js";
import { SilentRequest } from "../request/SilentRequest.js";
import { BrowserCacheManager } from "./BrowserCacheManager.js";
import { ITokenCache } from "./ITokenCache.js";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError.js";
import { AuthenticationResult } from "../response/AuthenticationResult.js";
import { base64Decode } from "../encode/Base64Decode.js";
import * as BrowserCrypto from "../crypto/BrowserCrypto.js";

export type LoadTokenOptions = {
    clientInfo?: string;
    expiresOn?: number;
    extendedExpiresOn?: number;
};

/**
 * Token cache manager
 */
export class TokenCache implements ITokenCache {
    // Flag to indicate if in browser environment
    public isBrowserEnvironment: boolean;
    // Input configuration by developer/user
    protected config: BrowserConfiguration;
    // Browser cache storage
    private storage: BrowserCacheManager;
    // Logger
    private logger: Logger;
    // Crypto class
    private cryptoObj: ICrypto;

    constructor(
        configuration: BrowserConfiguration,
        storage: BrowserCacheManager,
        logger: Logger,
        cryptoObj: ICrypto
    ) {
        this.isBrowserEnvironment = typeof window !== "undefined";
        this.config = configuration;
        this.storage = storage;
        this.logger = logger;
        this.cryptoObj = cryptoObj;
    }

    // Move getAllAccounts here and cache utility APIs

    /**
     * API to load tokens to msal-browser cache.
     * @param request
     * @param response
     * @param options
     * @returns `AuthenticationResult` for the response that was loaded.
     */
    loadExternalTokens(
        request: SilentRequest,
        response: ExternalTokenResponse,
        options: LoadTokenOptions
    ): AuthenticationResult {
        if (!this.isBrowserEnvironment) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.nonBrowserEnvironment
            );
        }

        const idTokenClaims = response.id_token
            ? AuthToken.extractTokenClaims(response.id_token, base64Decode)
            : undefined;

        const authorityOptions: AuthorityOptions = {
            protocolMode: this.config.auth.protocolMode,
            knownAuthorities: this.config.auth.knownAuthorities,
            cloudDiscoveryMetadata: this.config.auth.cloudDiscoveryMetadata,
            authorityMetadata: this.config.auth.authorityMetadata,
            skipAuthorityMetadataCache:
                this.config.auth.skipAuthorityMetadataCache,
        };
        const authority = request.authority
            ? new Authority(
                  Authority.generateAuthority(
                      request.authority,
                      request.azureCloudOptions
                  ),
                  this.config.system.networkClient,
                  this.storage,
                  authorityOptions,
                  this.logger,
                  request.correlationId || BrowserCrypto.createNewGuid()
              )
            : undefined;

        const cacheRecordAccount: AccountEntity = this.loadAccount(
            request,
            options.clientInfo || response.client_info || "",
            idTokenClaims,
            authority
        );

        const idToken = this.loadIdToken(
            response,
            cacheRecordAccount.homeAccountId,
            cacheRecordAccount.environment,
            cacheRecordAccount.realm
        );

        const accessToken = this.loadAccessToken(
            request,
            response,
            cacheRecordAccount.homeAccountId,
            cacheRecordAccount.environment,
            cacheRecordAccount.realm,
            options
        );

        const refreshToken = this.loadRefreshToken(
            response,
            cacheRecordAccount.homeAccountId,
            cacheRecordAccount.environment
        );

        return this.generateAuthenticationResult(
            request,
            {
                account: cacheRecordAccount,
                idToken,
                accessToken,
                refreshToken,
            },
            idTokenClaims,
            authority
        );
    }

    /**
     * Helper function to load account to msal-browser cache
     * @param idToken
     * @param environment
     * @param clientInfo
     * @param authorityType
     * @param requestHomeAccountId
     * @returns `AccountEntity`
     */
    private loadAccount(
        request: SilentRequest,
        clientInfo: string,
        idTokenClaims?: TokenClaims,
        authority?: Authority
    ): AccountEntity {
        this.logger.verbose("TokenCache - loading account");

        if (request.account) {
            const accountEntity = AccountEntity.createFromAccountInfo(
                request.account
            );
            this.storage.setAccount(accountEntity);
            return accountEntity;
        } else if (!authority || (!clientInfo && !idTokenClaims)) {
            this.logger.error(
                "TokenCache - if an account is not provided on the request, authority and either clientInfo or idToken must be provided instead."
            );
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.unableToLoadToken
            );
        }

        const homeAccountId = AccountEntity.generateHomeAccountId(
            clientInfo,
            authority.authorityType,
            this.logger,
            this.cryptoObj,
            idTokenClaims
        );

        const claimsTenantId = idTokenClaims?.tid;

        const cachedAccount = buildAccountToCache(
            this.storage,
            authority,
            homeAccountId,
            base64Decode,
            idTokenClaims,
            clientInfo,
            authority.hostnameAndPort,
            claimsTenantId,
            undefined, // authCodePayload
            undefined, // nativeAccountId
            this.logger
        );

        this.storage.setAccount(cachedAccount);
        return cachedAccount;
    }

    /**
     * Helper function to load id tokens to msal-browser cache
     * @param idToken
     * @param homeAccountId
     * @param environment
     * @param tenantId
     * @returns `IdTokenEntity`
     */
    private loadIdToken(
        response: ExternalTokenResponse,
        homeAccountId: string,
        environment: string,
        tenantId: string
    ): IdTokenEntity | null {
        if (!response.id_token) {
            this.logger.verbose("TokenCache - no id token found in response");
            return null;
        }

        this.logger.verbose("TokenCache - loading id token");
        const idTokenEntity = CacheHelpers.createIdTokenEntity(
            homeAccountId,
            environment,
            response.id_token,
            this.config.auth.clientId,
            tenantId
        );

        this.storage.setIdTokenCredential(idTokenEntity);
        return idTokenEntity;
    }

    /**
     * Helper function to load access tokens to msal-browser cache
     * @param request
     * @param response
     * @param homeAccountId
     * @param environment
     * @param tenantId
     * @returns `AccessTokenEntity`
     */
    private loadAccessToken(
        request: SilentRequest,
        response: ExternalTokenResponse,
        homeAccountId: string,
        environment: string,
        tenantId: string,
        options: LoadTokenOptions
    ): AccessTokenEntity | null {
        if (!response.access_token) {
            this.logger.verbose(
                "TokenCache - no access token found in response"
            );
            return null;
        } else if (!response.expires_in) {
            this.logger.error(
                "TokenCache - no expiration set on the access token. Cannot add it to the cache."
            );
            return null;
        } else if (
            !response.scope &&
            (!request.scopes || !request.scopes.length)
        ) {
            this.logger.error(
                "TokenCache - scopes not specified in the request or response. Cannot add token to the cache."
            );
            return null;
        }

        this.logger.verbose("TokenCache - loading access token");

        const scopes = response.scope
            ? ScopeSet.fromString(response.scope)
            : new ScopeSet(request.scopes);
        const expiresOn =
            options.expiresOn ||
            response.expires_in + new Date().getTime() / 1000;

        const extendedExpiresOn =
            options.extendedExpiresOn ||
            (response.ext_expires_in || response.expires_in) +
                new Date().getTime() / 1000;

        const accessTokenEntity = CacheHelpers.createAccessTokenEntity(
            homeAccountId,
            environment,
            response.access_token,
            this.config.auth.clientId,
            tenantId,
            scopes.printScopes(),
            expiresOn,
            extendedExpiresOn,
            base64Decode
        );

        this.storage.setAccessTokenCredential(accessTokenEntity);
        return accessTokenEntity;
    }

    /**
     * Helper function to load refresh tokens to msal-browser cache
     * @param request
     * @param response
     * @param homeAccountId
     * @param environment
     * @returns `RefreshTokenEntity`
     */
    private loadRefreshToken(
        response: ExternalTokenResponse,
        homeAccountId: string,
        environment: string
    ): RefreshTokenEntity | null {
        if (!response.refresh_token) {
            this.logger.verbose(
                "TokenCache - no refresh token found in response"
            );
            return null;
        }

        this.logger.verbose("TokenCache - loading refresh token");
        const refreshTokenEntity = CacheHelpers.createRefreshTokenEntity(
            homeAccountId,
            environment,
            response.refresh_token,
            this.config.auth.clientId,
            response.foci,
            undefined, // userAssertionHash
            response.refresh_token_expires_in
        );

        this.storage.setRefreshTokenCredential(refreshTokenEntity);
        return refreshTokenEntity;
    }

    /**
     * Helper function to generate an `AuthenticationResult` for the result.
     * @param request
     * @param idTokenObj
     * @param cacheRecord
     * @param authority
     * @returns `AuthenticationResult`
     */
    private generateAuthenticationResult(
        request: SilentRequest,
        cacheRecord: CacheRecord & { account: AccountEntity },
        idTokenClaims?: TokenClaims,
        authority?: Authority
    ): AuthenticationResult {
        let accessToken: string = "";
        let responseScopes: Array<string> = [];
        let expiresOn: Date | null = null;
        let extExpiresOn: Date | undefined;

        if (cacheRecord?.accessToken) {
            accessToken = cacheRecord.accessToken.secret;
            responseScopes = ScopeSet.fromString(
                cacheRecord.accessToken.target
            ).asArray();
            expiresOn = new Date(
                Number(cacheRecord.accessToken.expiresOn) * 1000
            );
            extExpiresOn = new Date(
                Number(cacheRecord.accessToken.extendedExpiresOn) * 1000
            );
        }

        const accountEntity = cacheRecord.account;

        return {
            authority: authority ? authority.canonicalAuthority : "",
            uniqueId: cacheRecord.account.localAccountId,
            tenantId: cacheRecord.account.realm,
            scopes: responseScopes,
            account: accountEntity.getAccountInfo(),
            idToken: cacheRecord.idToken?.secret || "",
            idTokenClaims: idTokenClaims || {},
            accessToken: accessToken,
            fromCache: true,
            expiresOn: expiresOn,
            correlationId: request.correlationId || "",
            requestId: "",
            extExpiresOn: extExpiresOn,
            familyId: cacheRecord.refreshToken?.familyId || "",
            tokenType: cacheRecord?.accessToken?.tokenType || "",
            state: request.state || "",
            cloudGraphHostName: accountEntity.cloudGraphHostName || "",
            msGraphHost: accountEntity.msGraphHost || "",
            fromNativeBroker: false,
        };
    }
}
