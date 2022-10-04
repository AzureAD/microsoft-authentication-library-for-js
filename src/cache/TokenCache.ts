/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccessTokenEntity, ICrypto, IdTokenEntity, Logger, ScopeSet, Authority, AuthorityOptions, ExternalTokenResponse, AccountEntity, AuthToken, RefreshTokenEntity , AuthorityType, CacheRecord, AuthenticationResult, Constants } from "@azure/msal-common";
import { BrowserConfiguration } from "../config/Configuration";
import { SilentRequest } from "../request/SilentRequest";
import { BrowserCacheManager } from "./BrowserCacheManager";
import { ITokenCache } from "./ITokenCache";
import { BrowserAuthError } from "../error/BrowserAuthError";

export type LoadTokenOptions = {
    clientInfo?: string,
    expiresOn?: number,
    extendedExpiresOn?: number
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

    constructor(configuration: BrowserConfiguration, storage: BrowserCacheManager, logger: Logger, cryptoObj: ICrypto) {
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
    loadExternalTokens(request: SilentRequest, response: ExternalTokenResponse, options: LoadTokenOptions): AuthenticationResult {
        this.logger.info("TokenCache - loadExternalTokens called");

        if (!response.id_token) {
            throw BrowserAuthError.createUnableToLoadTokenError("Please ensure server response includes id token.");
        }

        const idToken = new AuthToken(response.id_token, this.cryptoObj);

        let cacheRecord: CacheRecord | undefined;
        let authority: Authority | undefined;

        if (request.account) {
            const cacheRecordAccount = this.loadAccount(idToken, request.account.environment, undefined, undefined, request.account.homeAccountId);
            cacheRecord = new CacheRecord(
                cacheRecordAccount,
                this.loadIdToken(idToken, cacheRecordAccount.homeAccountId, request.account.environment, request.account.tenantId),
                this.loadAccessToken(request, response, cacheRecordAccount.homeAccountId, request.account.environment, request.account.tenantId, options),
                this.loadRefreshToken(request, response, cacheRecordAccount.homeAccountId, request.account.environment)
            );
        } else if (request.authority) {

            const authorityUrl = Authority.generateAuthority(request.authority, request.azureCloudOptions);
            const authorityOptions: AuthorityOptions = {
                protocolMode: this.config.auth.protocolMode,
                knownAuthorities: this.config.auth.knownAuthorities,
                cloudDiscoveryMetadata: this.config.auth.cloudDiscoveryMetadata,
                authorityMetadata: this.config.auth.authorityMetadata,
                skipAuthorityMetadataCache: this.config.auth.skipAuthorityMetadataCache,
            };
            authority = new Authority(authorityUrl, this.config.system.networkClient, this.storage, authorityOptions);

            // "clientInfo" from options takes precedence over "clientInfo" in response
            if (options.clientInfo) {
                this.logger.trace("TokenCache - homeAccountId from options");
                const cacheRecordAccount = this.loadAccount(idToken, authority.hostnameAndPort, options.clientInfo, authority.authorityType);
                cacheRecord = new CacheRecord(
                    cacheRecordAccount,
                    this.loadIdToken(idToken, cacheRecordAccount.homeAccountId, authority.hostnameAndPort, authority.tenant),
                    this.loadAccessToken(request, response, cacheRecordAccount.homeAccountId, authority.hostnameAndPort, authority.tenant, options),
                    this.loadRefreshToken(request, response, cacheRecordAccount.homeAccountId, authority.hostnameAndPort)
                );
            } else if (response.client_info) {
                this.logger.trace("TokenCache - homeAccountId from response");
                const cacheRecordAccount = this.loadAccount(idToken, authority.hostnameAndPort, response.client_info, authority.authorityType);
                cacheRecord = new CacheRecord(
                    cacheRecordAccount,
                    this.loadIdToken(idToken, cacheRecordAccount.homeAccountId, authority.hostnameAndPort, authority.tenant),
                    this.loadAccessToken(request, response, cacheRecordAccount.homeAccountId, authority.hostnameAndPort, authority.tenant, options),
                    this.loadRefreshToken(request, response, cacheRecordAccount.homeAccountId, authority.hostnameAndPort)
                );
            } else {
                throw BrowserAuthError.createUnableToLoadTokenError("Please provide clientInfo in the response or options.");
            }
        } else {
            throw BrowserAuthError.createUnableToLoadTokenError("Please provide a request with an account or a request with authority.");
        }

        return this.generateAuthenticationResult(request, idToken, cacheRecord, authority);
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
    private loadAccount(idToken: AuthToken, environment: string, clientInfo?: string, authorityType?: AuthorityType, requestHomeAccountId?: string): AccountEntity {

        let homeAccountId;
        if (requestHomeAccountId) {
            homeAccountId = requestHomeAccountId;
        } else if (authorityType !== undefined && clientInfo) {
            homeAccountId = AccountEntity.generateHomeAccountId(clientInfo, authorityType, this.logger, this.cryptoObj, idToken);
        }

        if (!homeAccountId) {
            throw BrowserAuthError.createUnableToLoadTokenError("Unexpected missing homeAccountId");
        }

        const accountEntity = clientInfo ?
            AccountEntity.createAccount(clientInfo, homeAccountId, idToken, undefined, undefined, undefined, environment) :
            AccountEntity.createGenericAccount(homeAccountId, idToken, undefined, undefined, undefined, environment);

        if (this.isBrowserEnvironment) {
            this.logger.verbose("TokenCache - loading account");

            this.storage.setAccount(accountEntity);
            return accountEntity;
        } else {
            throw BrowserAuthError.createUnableToLoadTokenError("loadExternalTokens is designed to work in browser environments only.");
        }
    }

    /**
     * Helper function to load id tokens to msal-browser cache
     * @param idToken
     * @param homeAccountId
     * @param environment
     * @param tenantId
     * @returns `IdTokenEntity`
     */
    private loadIdToken(idToken: AuthToken, homeAccountId: string, environment: string, tenantId: string): IdTokenEntity {

        const idTokenEntity = IdTokenEntity.createIdTokenEntity(homeAccountId, environment, idToken.rawToken, this.config.auth.clientId, tenantId);

        if (this.isBrowserEnvironment) {
            this.logger.verbose("TokenCache - loading id token");
            this.storage.setIdTokenCredential(idTokenEntity);
            return idTokenEntity;
        } else {
            throw BrowserAuthError.createUnableToLoadTokenError("loadExternalTokens is designed to work in browser environments only.");
        }
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
    private loadAccessToken(request: SilentRequest, response: ExternalTokenResponse, homeAccountId: string, environment: string, tenantId: string, options: LoadTokenOptions): AccessTokenEntity | null {

        if (!response.access_token) {
            this.logger.verbose("TokenCache - No access token provided for caching");
            return null;
        }

        if (!response.expires_in) {
            throw BrowserAuthError.createUnableToLoadTokenError("Please ensure server response includes expires_in value.");
        }

        if (!options.extendedExpiresOn) {
            throw BrowserAuthError.createUnableToLoadTokenError("Please provide an extendedExpiresOn value in the options.");
        }

        const scopes = new ScopeSet(request.scopes).printScopes();
        const expiresOn = options.expiresOn || (response.expires_in + new Date().getTime() / 1000);
        const extendedExpiresOn = options.extendedExpiresOn;

        const accessTokenEntity = AccessTokenEntity.createAccessTokenEntity(homeAccountId, environment, response.access_token, this.config.auth.clientId, tenantId, scopes, expiresOn, extendedExpiresOn, this.cryptoObj);

        if (this.isBrowserEnvironment) {
            this.logger.verbose("TokenCache - loading access token");
            this.storage.setAccessTokenCredential(accessTokenEntity);
            return accessTokenEntity;
        } else {
            throw BrowserAuthError.createUnableToLoadTokenError("loadExternalTokens is designed to work in browser environments only.");
        }
    }

    /**
     * Helper function to load refresh tokens to msal-browser cache
     * @param request
     * @param response
     * @param homeAccountId
     * @param environment
     * @returns `RefreshTokenEntity`
     */
    private loadRefreshToken(request: SilentRequest, response: ExternalTokenResponse, homeAccountId: string, environment: string): RefreshTokenEntity | null {

        if (!response.refresh_token) {
            this.logger.verbose("TokenCache - No refresh token provided for caching");
            return null;
        }

        const refreshTokenEntity = RefreshTokenEntity.createRefreshTokenEntity(homeAccountId, environment, response.refresh_token, this.config.auth.clientId);

        if (this.isBrowserEnvironment) {
            this.logger.verbose("TokenCache - loading refresh token");
            this.storage.setRefreshTokenCredential(refreshTokenEntity);
            return refreshTokenEntity;
        } else {
            throw BrowserAuthError.createUnableToLoadTokenError("loadExternalTokens is designed to work in browser environments only.");
        }
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
        idTokenObj: AuthToken,
        cacheRecord?: CacheRecord,
        authority?: Authority,
    ): AuthenticationResult {
        let accessToken: string = Constants.EMPTY_STRING;
        let responseScopes: Array<string> = [];
        let expiresOn: Date | null = null;
        let extExpiresOn: Date | undefined;

        if (cacheRecord?.accessToken) {
            accessToken = cacheRecord.accessToken.secret;
            responseScopes = ScopeSet.fromString(cacheRecord.accessToken.target).asArray();
            expiresOn = new Date(Number(cacheRecord.accessToken.expiresOn) * 1000);
            extExpiresOn = new Date(Number(cacheRecord.accessToken.extendedExpiresOn) * 1000);
        }

        const uid = idTokenObj?.claims.oid || idTokenObj?.claims.sub || Constants.EMPTY_STRING;
        const tid = idTokenObj?.claims.tid || Constants.EMPTY_STRING;

        return {
            authority: authority ? authority.canonicalAuthority : Constants.EMPTY_STRING,
            uniqueId: uid,
            tenantId: tid,
            scopes: responseScopes,
            account: cacheRecord?.account ? cacheRecord.account.getAccountInfo() : null,
            idToken: idTokenObj ? idTokenObj.rawToken : Constants.EMPTY_STRING,
            idTokenClaims: idTokenObj ? idTokenObj.claims : {},
            accessToken: accessToken,
            fromCache: true,
            expiresOn: expiresOn,
            correlationId: request.correlationId || Constants.EMPTY_STRING,
            requestId: Constants.EMPTY_STRING,
            extExpiresOn: extExpiresOn,
            familyId: Constants.EMPTY_STRING,
            tokenType: cacheRecord?.accessToken?.tokenType || Constants.EMPTY_STRING,
            state: Constants.EMPTY_STRING,
            cloudGraphHostName: cacheRecord?.account?.cloudGraphHostName || Constants.EMPTY_STRING,
            msGraphHost: cacheRecord?.account?.msGraphHost || Constants.EMPTY_STRING,
            code: undefined,
            fromNativeBroker: false
        };
    }
}

