/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccessTokenEntity, ICrypto, IdTokenEntity, Logger, ScopeSet, Authority, AuthorityOptions, ExternalTokenResponse, AccountEntity, AuthToken, RefreshTokenEntity , AuthorityType, Constants } from "@azure/msal-common";
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
     * @returns The homeAccountId of the account associated with the response.
     */
    loadExternalTokens(request: SilentRequest, response: ExternalTokenResponse, options: LoadTokenOptions): string {
        this.logger.info("TokenCache - loadExternalTokens called");

        if (!response.id_token) {
            throw BrowserAuthError.createUnableToLoadTokenError("Please ensure server response includes id token.");
        }

        if (request.account) {
            const homeAccountId = this.loadIdToken(response.id_token, Constants.EMPTY_STRING, request.account.environment, request.account.tenantId, options, undefined, request.account.homeAccountId);
            this.loadAccessToken(request, response, homeAccountId, request.account.environment, request.account.tenantId, options);
            this.loadRefreshToken(request, response, homeAccountId, request.account.environment);
            return homeAccountId;
        } else if (request.authority) {

            const authorityUrl = Authority.generateAuthority(request.authority, request.azureCloudOptions);
            const authorityOptions: AuthorityOptions = {
                protocolMode: this.config.auth.protocolMode,
                knownAuthorities: this.config.auth.knownAuthorities,
                cloudDiscoveryMetadata: this.config.auth.cloudDiscoveryMetadata,
                authorityMetadata: this.config.auth.authorityMetadata,
                skipAuthorityMetadataCache: this.config.auth.skipAuthorityMetadataCache,
            };
            const authority = new Authority(authorityUrl, this.config.system.networkClient, this.storage, authorityOptions);

            // "clientInfo" from options takes precedence over "clientInfo" in response
            if (options.clientInfo) {
                this.logger.trace("TokenCache - homeAccountId from options");
                const homeAccountId = this.loadIdToken(response.id_token, options.clientInfo, authority.hostnameAndPort, authority.tenant, options, authority.authorityType);
                this.loadAccessToken(request, response, homeAccountId, authority.hostnameAndPort, authority.tenant, options);
                this.loadRefreshToken(request, response, homeAccountId, authority.hostnameAndPort);
                return homeAccountId;
            } else if (response.client_info) {
                this.logger.trace("TokenCache - homeAccountId from response");
                const homeAccountId = this.loadIdToken(response.id_token, response.client_info, authority.hostnameAndPort, authority.tenant, options, authority.authorityType);
                this.loadAccessToken(request, response, homeAccountId, authority.hostnameAndPort, authority.tenant, options);
                this.loadRefreshToken(request, response, homeAccountId, authority.hostnameAndPort);
                return homeAccountId;
            } else {
                throw BrowserAuthError.createUnableToLoadTokenError("Please provide clientInfo in the response or options.");
            }
        } else {
            throw BrowserAuthError.createUnableToLoadTokenError("Please provide a request with an account or a request with authority.");
        }
    }

    /**
     * Helper function to load id tokens to msal-browser cache
     * @param idToken
     * @param clientInfo
     * @param environment
     * @param tenantId
     * @param options
     * @param authorityType
     * @param homeAccountId
     * @returns The homeAccountId of the account.
     */
    private loadIdToken(idToken: string, clientInfo: string, environment: string, tenantId: string, options: LoadTokenOptions, authorityType?: AuthorityType, homeAccountId?: string): string {

        const idAuthToken = new AuthToken(idToken, this.cryptoObj);
        const idTokenHomeAccountId = homeAccountId ?
            homeAccountId :
            authorityType !== undefined ?
                AccountEntity.generateHomeAccountId(clientInfo, authorityType, this.logger, this.cryptoObj, idAuthToken) :
                clientInfo;

        const idTokenEntity = IdTokenEntity.createIdTokenEntity(idTokenHomeAccountId, environment, idToken, this.config.auth.clientId, tenantId);
        const accountEntity = options.clientInfo ?
            AccountEntity.createAccount(options.clientInfo, idTokenHomeAccountId, idAuthToken, undefined, undefined, undefined, environment) :
            AccountEntity.createGenericAccount(idTokenHomeAccountId, idAuthToken, undefined, undefined, undefined, environment);

        if (this.isBrowserEnvironment) {
            this.logger.verbose("TokenCache - loading id token");
            this.storage.setAccount(accountEntity);
            this.storage.setIdTokenCredential(idTokenEntity);
        } else {
            throw BrowserAuthError.createUnableToLoadTokenError("loadExternalTokens is designed to work in browser environments only.");
        }

        return idTokenHomeAccountId;
    }

    /**
     * Helper function to load access tokens to msal-browser cache
     * @param request
     * @param response
     * @param options
     * @param homeAccountId
     * @param environment
     * @param tenantId
     * @returns
     */
    private loadAccessToken(request: SilentRequest, response: ExternalTokenResponse, homeAccountId: string, environment: string, tenantId: string, options: LoadTokenOptions): void {

        if (!response.access_token) {
            this.logger.verbose("TokenCache - No access token provided for caching");
            return;
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
     * @returns
     */
    private loadRefreshToken(request: SilentRequest, response: ExternalTokenResponse, homeAccountId: string, environment: string): void {

        if (!response.refresh_token) {
            this.logger.verbose("TokenCache - No refresh token provided for caching");
            return;
        }

        const refreshTokenEntity = RefreshTokenEntity.createRefreshTokenEntity(homeAccountId, environment, response.refresh_token, this.config.auth.clientId);

        if (this.isBrowserEnvironment) {
            this.logger.verbose("TokenCache - loading refresh token");
            this.storage.setRefreshTokenCredential(refreshTokenEntity);
        } else {
            throw BrowserAuthError.createUnableToLoadTokenError("loadExternalTokens is designed to work in browser environments only.");
        }
    }
}

