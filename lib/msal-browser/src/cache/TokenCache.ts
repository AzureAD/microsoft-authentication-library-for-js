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
} from "@azure/msal-common";
import { BrowserConfiguration } from "../config/Configuration";
import { SilentRequest } from "../request/SilentRequest";
import { BrowserCacheManager } from "./BrowserCacheManager";
import { ITokenCache } from "./ITokenCache";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { base64Decode } from "../encode/Base64Decode";
import * as BrowserCrypto from "../crypto/BrowserCrypto";

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
                BrowserAuthErrorCodes.unableToLoadToken
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
            idTokenClaims,
            authority,
            options.clientInfo || response.client_info
        );
        const cacheRecord: CacheRecord & { account: AccountEntity } = {
            account: cacheRecordAccount,
        };

        if (response.id_token) {
            const idToken = this.loadIdToken(
                response.id_token,
                cacheRecordAccount.homeAccountId,
                cacheRecordAccount.environment,
                cacheRecordAccount.realm
            );
            cacheRecord.idToken = idToken;
        }

        if (response.access_token) {
            const accessToken = this.loadAccessToken(
                request,
                response,
                cacheRecordAccount.homeAccountId,
                cacheRecordAccount.environment,
                cacheRecordAccount.realm,
                options
            );
            cacheRecord.accessToken = accessToken;
        }

        if (response.refresh_token) {
            const refreshToken = this.loadRefreshToken(
                response,
                cacheRecordAccount.homeAccountId,
                cacheRecordAccount.environment
            );
            cacheRecord.refreshToken = refreshToken;
        }

        return this.generateAuthenticationResult(
            request,
            cacheRecord,
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
        idTokenClaims?: TokenClaims,
        authority?: Authority,
        clientInfo?: string,
        requestHomeAccountId?: string
    ): AccountEntity {
        this.logger.verbose("TokenCache - loading account");

        if (request.account) {
            const accountEntity = AccountEntity.createFromAccountInfo(
                request.account
            );
            this.storage.setAccount(accountEntity);
            return accountEntity;
        } else if (!idTokenClaims || !authority) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.unableToLoadToken
            );
        }

        let homeAccountId;
        if (requestHomeAccountId) {
            homeAccountId = requestHomeAccountId;
        } else if (authority.authorityType !== undefined && clientInfo) {
            homeAccountId = AccountEntity.generateHomeAccountId(
                clientInfo,
                authority.authorityType,
                this.logger,
                this.cryptoObj,
                idTokenClaims
            );
        }

        if (!homeAccountId) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.unableToLoadToken
            );
        }
        const claimsTenantId = idTokenClaims.tid;

        const cachedAccount = buildAccountToCache(
            this.storage,
            authority,
            homeAccountId,
            idTokenClaims,
            base64Decode,
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
        idToken: string,
        homeAccountId: string,
        environment: string,
        tenantId: string
    ): IdTokenEntity {
        const idTokenEntity = CacheHelpers.createIdTokenEntity(
            homeAccountId,
            environment,
            idToken,
            this.config.auth.clientId,
            tenantId
        );

        this.logger.verbose("TokenCache - loading id token");
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
                "TokenCache - No access token provided for caching"
            );
            return null;
        }

        if (!response.expires_in) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.unableToLoadToken
            );
        }

        if (!options.extendedExpiresOn) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.unableToLoadToken
            );
        }

        const scopes = new ScopeSet(request.scopes).printScopes();
        const expiresOn =
            options.expiresOn ||
            response.expires_in + new Date().getTime() / 1000;
        const extendedExpiresOn = options.extendedExpiresOn;

        const accessTokenEntity = CacheHelpers.createAccessTokenEntity(
            homeAccountId,
            environment,
            response.access_token,
            this.config.auth.clientId,
            tenantId,
            scopes,
            expiresOn,
            extendedExpiresOn,
            base64Decode
        );

        this.logger.verbose("TokenCache - loading access token");
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
                "TokenCache - No refresh token provided for caching"
            );
            return null;
        }

        const refreshTokenEntity = CacheHelpers.createRefreshTokenEntity(
            homeAccountId,
            environment,
            response.refresh_token,
            this.config.auth.clientId
        );

        this.logger.verbose("TokenCache - loading refresh token");
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
            code: undefined,
            fromNativeBroker: false,
        };
    }
}
