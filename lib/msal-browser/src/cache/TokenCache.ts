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
    buildStaticAuthorityOptions,
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
import { StandardOperatingContext } from "../operatingcontext/StandardOperatingContext.js";
import { CryptoOps } from "../crypto/CryptoOps.js";
import { EventHandler } from "../event/EventHandler.js";

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
    config: BrowserConfiguration,
    request: SilentRequest,
    response: ExternalTokenResponse,
    options: LoadTokenOptions
): Promise<AuthenticationResult> {
    const operatingContext = new StandardOperatingContext(config);
    if (!operatingContext.isBrowserEnvironment()) {
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
        protocolMode: config.system.protocolMode,
        knownAuthorities: config.auth.knownAuthorities,
        cloudDiscoveryMetadata: config.auth.cloudDiscoveryMetadata,
        authorityMetadata: config.auth.authorityMetadata,
    };
    const cryptoOps = new CryptoOps(
        operatingContext.logger,
        config.telemetry.client
    );
    const storage = new BrowserCacheManager(
        config.auth.clientId,
        config.cache,
        cryptoOps,
        operatingContext.logger,
        config.telemetry.client,
        new EventHandler(operatingContext.logger),
        buildStaticAuthorityOptions(config.auth)
    );
    const logger = operatingContext.logger;
    const authority = request.authority
        ? new Authority(
              Authority.generateAuthority(
                  request.authority,
                  request.azureCloudOptions
              ),
              config.system.networkClient,
              storage,
              authorityOptions,
              logger,
              request.correlationId || BrowserCrypto.createNewGuid()
          )
        : undefined;

    const cacheRecordAccount: AccountEntity = await loadAccount(
        request,
        options.clientInfo || response.client_info || "",
        correlationId,
        storage,
        logger,
        cryptoOps,
        idTokenClaims,
        authority
    );

    const idToken = await loadIdToken(
        response,
        cacheRecordAccount.homeAccountId,
        cacheRecordAccount.environment,
        cacheRecordAccount.realm,
        correlationId,
        storage,
        logger,
        config.auth.clientId
    );

    const accessToken = await loadAccessToken(
        request,
        response,
        cacheRecordAccount.homeAccountId,
        cacheRecordAccount.environment,
        cacheRecordAccount.realm,
        options,
        correlationId,
        storage,
        logger,
        config.auth.clientId
    );

    const refreshToken = await loadRefreshToken(
        response,
        cacheRecordAccount.homeAccountId,
        cacheRecordAccount.environment,
        correlationId,
        storage,
        logger,
        config.auth.clientId
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
    storage: BrowserCacheManager,
    logger: Logger,
    cryptoObj: ICrypto,
    idTokenClaims?: TokenClaims,
    authority?: Authority
): Promise<AccountEntity> {
    logger.verbose("TokenCache - loading account");

    if (request.account) {
        const accountEntity =
            AccountEntityUtils.createAccountEntityFromAccountInfo(
                request.account
            );
        await storage.setAccount(accountEntity, correlationId);
        return accountEntity;
    } else if (!authority || (!clientInfo && !idTokenClaims)) {
        logger.error(
            "TokenCache - if an account is not provided on the request, authority and either clientInfo or idToken must be provided instead."
        );
        throw createBrowserAuthError(BrowserAuthErrorCodes.unableToLoadToken);
    }

    const homeAccountId = AccountEntityUtils.generateHomeAccountId(
        clientInfo,
        authority.authorityType,
        logger,
        cryptoObj,
        idTokenClaims
    );

    const claimsTenantId = idTokenClaims?.tid;

    const cachedAccount = buildAccountToCache(
        storage,
        authority,
        homeAccountId,
        base64Decode,
        idTokenClaims,
        clientInfo,
        authority.hostnameAndPort,
        claimsTenantId,
        undefined, // authCodePayload
        undefined, // nativeAccountId
        logger
    );

    await storage.setAccount(cachedAccount, correlationId);
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
    storage: BrowserCacheManager,
    logger: Logger,
    clientId: string
): Promise<IdTokenEntity | null> {
    if (!response.id_token) {
        logger.verbose("TokenCache - no id token found in response");
        return null;
    }

    logger.verbose("TokenCache - loading id token");
    const idTokenEntity = CacheHelpers.createIdTokenEntity(
        homeAccountId,
        environment,
        response.id_token,
        clientId,
        tenantId
    );

    await storage.setIdTokenCredential(idTokenEntity, correlationId);
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
    storage: BrowserCacheManager,
    logger: Logger,
    clientId: string
): Promise<AccessTokenEntity | null> {
    if (!response.access_token) {
        logger.verbose("TokenCache - no access token found in response");
        return null;
    } else if (!response.expires_in) {
        logger.error(
            "TokenCache - no expiration set on the access token. Cannot add it to the cache."
        );
        return null;
    } else if (!response.scope && (!request.scopes || !request.scopes.length)) {
        logger.error(
            "TokenCache - scopes not specified in the request or response. Cannot add token to the cache."
        );
        return null;
    }

    logger.verbose("TokenCache - loading access token");

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
        clientId,
        tenantId,
        scopes.printScopes(),
        expiresOn,
        extendedExpiresOn,
        base64Decode
    );

    await storage.setAccessTokenCredential(accessTokenEntity, correlationId);
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
    storage: BrowserCacheManager,
    logger: Logger,
    clientId: string
): Promise<RefreshTokenEntity | null> {
    if (!response.refresh_token) {
        logger.verbose("TokenCache - no refresh token found in response");
        return null;
    }

    logger.verbose("TokenCache - loading refresh token");
    const refreshTokenEntity = CacheHelpers.createRefreshTokenEntity(
        homeAccountId,
        environment,
        response.refresh_token,
        clientId,
        response.foci,
        undefined, // userAssertionHash
        response.refresh_token_expires_in
    );

    await storage.setRefreshTokenCredential(refreshTokenEntity, correlationId);
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
