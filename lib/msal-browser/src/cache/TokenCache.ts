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
    TimeUtils,
    AccountEntityUtils,
} from "@azure/msal-common/browser";
import { BrowserConfiguration } from "../config/Configuration.js";
import type { SilentRequest } from "../request/SilentRequest.js";
import { BrowserCacheManager } from "./BrowserCacheManager.js";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError.js";
import type { AuthenticationResult } from "../response/AuthenticationResult.js";
import { base64Decode } from "../encode/Base64Decode.js";
import * as BrowserCrypto from "../crypto/BrowserCrypto.js";

export type LoadTokenOptions = {
    clientInfo?: string;
    expiresOn?: number;
    extendedExpiresOn?: number;
};

/**
 * API to load tokens to msal-browser cache.
 * @param request
 * @param response
 * @param options
 * @returns `AuthenticationResult` for the response that was loaded.
 */
export async function loadExternalTokens(
    request: SilentRequest,
    response: ExternalTokenResponse,
    options: LoadTokenOptions,
    cache: TokenCache
): Promise<AuthenticationResult> {
    if (!cache.isBrowserEnvironment) {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.nonBrowserEnvironment
        );
    }

    const correlationId =
        request.correlationId || BrowserCrypto.createNewGuid();

    const idTokenClaims = response.id_token
        ? AuthToken.extractTokenClaims(response.id_token, base64Decode)
        : undefined;

    const authorityOptions: AuthorityOptions = {
        protocolMode: cache.config.system.protocolMode,
        knownAuthorities: cache.config.auth.knownAuthorities,
        cloudDiscoveryMetadata: cache.config.auth.cloudDiscoveryMetadata,
        authorityMetadata: cache.config.auth.authorityMetadata,
    };
    const authority = request.authority
        ? new Authority(
              Authority.generateAuthority(
                  request.authority,
                  request.azureCloudOptions
              ),
              cache.config.system.networkClient,
              cache.storage,
              authorityOptions,
              cache.logger,
              request.correlationId || BrowserCrypto.createNewGuid()
          )
        : undefined;

    const cacheRecordAccount: AccountEntity = await loadAccount(
        request,
        options.clientInfo || response.client_info || "",
        correlationId,
        cache,
        idTokenClaims,
        authority
    );

    const idToken = await loadIdToken(
        response,
        cacheRecordAccount.homeAccountId,
        cacheRecordAccount.environment,
        cacheRecordAccount.realm,
        correlationId,
        cache
    );

    const accessToken = await loadAccessToken(
        request,
        response,
        cacheRecordAccount.homeAccountId,
        cacheRecordAccount.environment,
        cacheRecordAccount.realm,
        options,
        correlationId,
        cache
    );

    const refreshToken = await loadRefreshToken(
        response,
        cacheRecordAccount.homeAccountId,
        cacheRecordAccount.environment,
        correlationId,
        cache
    );

    return generateAuthenticationResult(
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
async function loadAccount(
    request: SilentRequest,
    clientInfo: string,
    correlationId: string,
    cache: TokenCache,
    idTokenClaims?: TokenClaims,
    authority?: Authority
): Promise<AccountEntity> {
    cache.logger.verbose("TokenCache - loading account");

    if (request.account) {
        const accountEntity =
            AccountEntityUtils.createAccountEntityFromAccountInfo(
                request.account
            );
        await cache.storage.setAccount(accountEntity, correlationId);
        return accountEntity;
    } else if (!authority || (!clientInfo && !idTokenClaims)) {
        cache.logger.error(
            "TokenCache - if an account is not provided on the request, authority and either clientInfo or idToken must be provided instead."
        );
        throw createBrowserAuthError(BrowserAuthErrorCodes.unableToLoadToken);
    }

    const homeAccountId = AccountEntityUtils.generateHomeAccountId(
        clientInfo,
        authority.authorityType,
        cache.logger,
        cache.cryptoObj,
        idTokenClaims
    );

    const claimsTenantId = idTokenClaims?.tid;

    const cachedAccount = buildAccountToCache(
        cache.storage,
        authority,
        homeAccountId,
        base64Decode,
        idTokenClaims,
        clientInfo,
        authority.hostnameAndPort,
        claimsTenantId,
        undefined, // authCodePayload
        undefined, // nativeAccountId
        cache.logger
    );

    await cache.storage.setAccount(cachedAccount, correlationId);
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
async function loadIdToken(
    response: ExternalTokenResponse,
    homeAccountId: string,
    environment: string,
    tenantId: string,
    correlationId: string,
    cache: TokenCache
): Promise<IdTokenEntity | null> {
    if (!response.id_token) {
        cache.logger.verbose("TokenCache - no id token found in response");
        return null;
    }

    cache.logger.verbose("TokenCache - loading id token");
    const idTokenEntity = CacheHelpers.createIdTokenEntity(
        homeAccountId,
        environment,
        response.id_token,
        cache.config.auth.clientId,
        tenantId
    );

    await cache.storage.setIdTokenCredential(idTokenEntity, correlationId);
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
async function loadAccessToken(
    request: SilentRequest,
    response: ExternalTokenResponse,
    homeAccountId: string,
    environment: string,
    tenantId: string,
    options: LoadTokenOptions,
    correlationId: string,
    cache: TokenCache
): Promise<AccessTokenEntity | null> {
    if (!response.access_token) {
        cache.logger.verbose("TokenCache - no access token found in response");
        return null;
    } else if (!response.expires_in) {
        cache.logger.error(
            "TokenCache - no expiration set on the access token. Cannot add it to the cache."
        );
        return null;
    } else if (!response.scope && (!request.scopes || !request.scopes.length)) {
        cache.logger.error(
            "TokenCache - scopes not specified in the request or response. Cannot add token to the cache."
        );
        return null;
    }

    cache.logger.verbose("TokenCache - loading access token");

    const scopes = response.scope
        ? ScopeSet.fromString(response.scope)
        : new ScopeSet(request.scopes);
    const expiresOn =
        options.expiresOn || response.expires_in + TimeUtils.nowSeconds();

    const extendedExpiresOn =
        options.extendedExpiresOn ||
        (response.ext_expires_in || response.expires_in) +
            TimeUtils.nowSeconds();

    const accessTokenEntity = CacheHelpers.createAccessTokenEntity(
        homeAccountId,
        environment,
        response.access_token,
        cache.config.auth.clientId,
        tenantId,
        scopes.printScopes(),
        expiresOn,
        extendedExpiresOn,
        base64Decode
    );

    await cache.storage.setAccessTokenCredential(
        accessTokenEntity,
        correlationId
    );
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
async function loadRefreshToken(
    response: ExternalTokenResponse,
    homeAccountId: string,
    environment: string,
    correlationId: string,
    cache: TokenCache
): Promise<RefreshTokenEntity | null> {
    if (!response.refresh_token) {
        cache.logger.verbose("TokenCache - no refresh token found in response");
        return null;
    }

    cache.logger.verbose("TokenCache - loading refresh token");
    const refreshTokenEntity = CacheHelpers.createRefreshTokenEntity(
        homeAccountId,
        environment,
        response.refresh_token,
        cache.config.auth.clientId,
        response.foci,
        undefined, // userAssertionHash
        response.refresh_token_expires_in
    );

    await cache.storage.setRefreshTokenCredential(
        refreshTokenEntity,
        correlationId
    );
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
function generateAuthenticationResult(
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
        // Access token expiresOn stored in seconds, converting to Date for AuthenticationResult
        expiresOn = TimeUtils.toDateFromSeconds(
            cacheRecord.accessToken.expiresOn
        );
        extExpiresOn = TimeUtils.toDateFromSeconds(
            cacheRecord.accessToken.extendedExpiresOn
        );
    }

    const accountEntity = cacheRecord.account;

    return {
        authority: authority ? authority.canonicalAuthority : "",
        uniqueId: cacheRecord.account.localAccountId,
        tenantId: cacheRecord.account.realm,
        scopes: responseScopes,
        account: AccountEntityUtils.getAccountInfo(accountEntity),
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

/**
 * Token cache manager
 */
export class TokenCache {
    // Flag to indicate if in browser environment
    public isBrowserEnvironment: boolean;
    // Input configuration by developer/user
    public config: BrowserConfiguration;
    // Browser cache storage
    public storage: BrowserCacheManager;
    // Logger
    public logger: Logger;
    // Crypto class
    public cryptoObj: ICrypto;

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
}
