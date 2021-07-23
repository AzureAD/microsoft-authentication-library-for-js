/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccessTokenEntity, ICrypto, IdTokenEntity, Logger, ScopeSet, ClientInfo, Authority, AuthorityOptions, ServerAuthorizationROPCResponse } from "@azure/msal-common";
import { BrowserConfiguration, buildConfiguration, Configuration } from "../config/Configuration";
import { SilentRequest } from "../request/SilentRequest";
import { BrowserCacheManager } from "./BrowserCacheManager";
import { ITokenCache } from "./ITokenCache";
import { BrowserAuthError } from "../error/BrowserAuthError";

export type LoadTokenOptions = {
    clientInfo?: ClientInfo,
    extendedExpiresOn?: number,
    callback?: TokenCallback
};

export type TokenCallback = (key: string, value: string) => void;

export class TokenCache implements ITokenCache {
    protected config: BrowserConfiguration;
    public isBrowserEnvironment: boolean;
    private storage: BrowserCacheManager;
    private logger: Logger;
    private cryptoObj: ICrypto;

    constructor(configuration: Configuration, storage: BrowserCacheManager, logger: Logger, cryptoObj: ICrypto) {
        this.isBrowserEnvironment = typeof window !== "undefined";
        this.config = buildConfiguration(configuration, this.isBrowserEnvironment);
        this.storage = storage;
        this.logger = logger;
        this.cryptoObj = cryptoObj;
    }
    
    // Move getAllAccounts here and cache utility APIs

    loadTokens(request: SilentRequest, response: ServerAuthorizationROPCResponse, options: LoadTokenOptions): void {
        this.logger.info("TokenCache - loadTokens called");

        if (!response.id_token) {
            throw BrowserAuthError.createUnableToLoadTokenError("Please ensure server response includes id token.");
        }

        if (request.account) {
            this.loadIdToken(response.id_token, request.account.homeAccountId, request.account.environment, request.account.tenantId, options);

            this.loadAccessToken(request, response, options, request.account.homeAccountId, request.account.environment, request.account.tenantId);
        } else if (request.authority && options.clientInfo) {
            const homeAccountId = `${options.clientInfo?.uid}.${options.clientInfo?.utid}`;

            const authorityOptions: AuthorityOptions = {
                protocolMode: this.config.auth.protocolMode,
                knownAuthorities: this.config.auth.knownAuthorities,
                cloudDiscoveryMetadata: this.config.auth.cloudDiscoveryMetadata,
                authorityMetadata: this.config.auth.authorityMetadata
            };
            const authority = new Authority(request.authority, this.config.system.networkClient, this.storage, authorityOptions);

            this.loadIdToken(response.id_token, homeAccountId, authority.hostnameAndPort, authority.tenant, options);

            this.loadAccessToken(request, response, options, homeAccountId, authority.hostnameAndPort, authority.tenant);

        } else {
            throw BrowserAuthError.createUnableToLoadTokenError("Please provide a request with an account, or a request with authority and clientInfo.");
        }
    }

    private loadIdToken(idToken: string, homeAccountId: string, environment: string, tenantId: string, options: LoadTokenOptions): void {

        const idTokenEntity = IdTokenEntity.createIdTokenEntity(homeAccountId, environment, idToken, this.config.auth.clientId, tenantId);

        if (this.isBrowserEnvironment) {
            this.logger.verbose("TokenCache - loading id token");
            this.storage.setIdTokenCredential(idTokenEntity);
        } else {
            if (options.callback) {
                const idTokenKey = idTokenEntity.generateCredentialKey();
                options.callback(idTokenKey, JSON.stringify(idTokenEntity));
            } else {
                throw BrowserAuthError.createUnableToLoadTokenError("Please provide callback to cache id tokens in non-browser environments.");
            }
        }
    }

    private loadAccessToken(request: SilentRequest, response: ServerAuthorizationROPCResponse, options: LoadTokenOptions, homeAccountId: string, environment: string, tenantId: string): void {

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
        const expiresOn = response.expires_in;
        const extendedExpiresOn = options.extendedExpiresOn;

        const accessTokenEntity = AccessTokenEntity.createAccessTokenEntity(homeAccountId, environment, response.access_token, this.config.auth.clientId, tenantId, scopes, expiresOn, extendedExpiresOn, this.cryptoObj);

        // Cache token to local/session storage if browser, otherwise provide callback
        if (this.isBrowserEnvironment) {
            this.logger.verbose("TokenCache - loading access token");
            this.storage.setAccessTokenCredential(accessTokenEntity);
        } else {
            if (options.callback) {
                const accessTokenKey = accessTokenEntity.generateCredentialKey();
                options.callback(accessTokenKey, JSON.stringify(accessTokenEntity));
            } else {
                throw BrowserAuthError.createUnableToLoadTokenError("Please provide callback to cache access tokens in non-browser environments");
            }
        }
    }
}
