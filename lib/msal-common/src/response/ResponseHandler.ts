/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerAuthorizationTokenResponse } from "./ServerAuthorizationTokenResponse";
import { ICrypto } from "../crypto/ICrypto";
import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../error/ClientAuthError";
import { ServerAuthorizationCodeResponse } from "./ServerAuthorizationCodeResponse";
import { Logger } from "../logger/Logger";
import { ServerError } from "../error/ServerError";
import { ScopeSet } from "../request/ScopeSet";
import { AuthenticationResult } from "./AuthenticationResult";
import { AccountEntity } from "../cache/entities/AccountEntity";
import { Authority } from "../authority/Authority";
import { IdTokenEntity } from "../cache/entities/IdTokenEntity";
import { AccessTokenEntity } from "../cache/entities/AccessTokenEntity";
import { RefreshTokenEntity } from "../cache/entities/RefreshTokenEntity";
import {
    InteractionRequiredAuthError,
    isInteractionRequiredError,
} from "../error/InteractionRequiredAuthError";
import { CacheRecord } from "../cache/entities/CacheRecord";
import { CacheManager } from "../cache/CacheManager";
import { ProtocolUtils, RequestStateObject } from "../utils/ProtocolUtils";
import {
    AuthenticationScheme,
    Constants,
    THE_FAMILY_ID,
    HttpStatus,
} from "../utils/Constants";
import { PopTokenGenerator } from "../crypto/PopTokenGenerator";
import { AppMetadataEntity } from "../cache/entities/AppMetadataEntity";
import { ICachePlugin } from "../cache/interface/ICachePlugin";
import { TokenCacheContext } from "../cache/persistence/TokenCacheContext";
import { ISerializableTokenCache } from "../cache/interface/ISerializableTokenCache";
import { AuthorizationCodePayload } from "./AuthorizationCodePayload";
import { BaseAuthRequest } from "../request/BaseAuthRequest";
import { IPerformanceClient } from "../telemetry/performance/IPerformanceClient";
import { PerformanceEvents } from "../telemetry/performance/PerformanceEvent";
import { checkMaxAge, extractTokenClaims } from "../account/AuthToken";
import {
    TokenClaims,
    getTenantIdFromIdTokenClaims,
} from "../account/TokenClaims";
import {
    AccountInfo,
    buildTenantProfileFromIdTokenClaims,
    updateAccountTenantProfileData,
} from "../account/AccountInfo";
import * as CacheHelpers from "../cache/utils/CacheHelpers";

function parseServerErrorNo(
    serverResponse: ServerAuthorizationCodeResponse
): string | undefined {
    const errorCodePrefix = "code=";
    const errorCodePrefixIndex =
        serverResponse.error_uri?.lastIndexOf(errorCodePrefix);
    return errorCodePrefixIndex && errorCodePrefixIndex >= 0
        ? serverResponse.error_uri?.substring(
              errorCodePrefixIndex + errorCodePrefix.length
          )
        : undefined;
}

/**
 * Class that handles response parsing.
 * @internal
 */
export class ResponseHandler {
    private clientId: string;
    private cacheStorage: CacheManager;
    private cryptoObj: ICrypto;
    private logger: Logger;
    private homeAccountIdentifier: string;
    private serializableCache: ISerializableTokenCache | null;
    private persistencePlugin: ICachePlugin | null;
    private performanceClient?: IPerformanceClient;

    constructor(
        clientId: string,
        cacheStorage: CacheManager,
        cryptoObj: ICrypto,
        logger: Logger,
        serializableCache: ISerializableTokenCache | null,
        persistencePlugin: ICachePlugin | null,
        performanceClient?: IPerformanceClient
    ) {
        this.clientId = clientId;
        this.cacheStorage = cacheStorage;
        this.cryptoObj = cryptoObj;
        this.logger = logger;
        this.serializableCache = serializableCache;
        this.persistencePlugin = persistencePlugin;
        this.performanceClient = performanceClient;
    }

    /**
     * Function which validates server authorization code response.
     * @param serverResponseHash
     * @param requestState
     * @param cryptoObj
     */
    validateServerAuthorizationCodeResponse(
        serverResponse: ServerAuthorizationCodeResponse,
        requestState: string
    ): void {
        if (!serverResponse.state || !requestState) {
            throw serverResponse.state
                ? createClientAuthError(
                      ClientAuthErrorCodes.stateNotFound,
                      "Cached State"
                  )
                : createClientAuthError(
                      ClientAuthErrorCodes.stateNotFound,
                      "Server State"
                  );
        }

        let decodedServerResponseState: string;
        let decodedRequestState: string;

        try {
            decodedServerResponseState = decodeURIComponent(
                serverResponse.state
            );
        } catch (e) {
            throw createClientAuthError(
                ClientAuthErrorCodes.invalidState,
                serverResponse.state
            );
        }

        try {
            decodedRequestState = decodeURIComponent(requestState);
        } catch (e) {
            throw createClientAuthError(
                ClientAuthErrorCodes.invalidState,
                serverResponse.state
            );
        }

        if (decodedServerResponseState !== decodedRequestState) {
            throw createClientAuthError(ClientAuthErrorCodes.stateMismatch);
        }

        // Check for error
        if (
            serverResponse.error ||
            serverResponse.error_description ||
            serverResponse.suberror
        ) {
            const serverErrorNo = parseServerErrorNo(serverResponse);
            if (
                isInteractionRequiredError(
                    serverResponse.error,
                    serverResponse.error_description,
                    serverResponse.suberror
                )
            ) {
                throw new InteractionRequiredAuthError(
                    serverResponse.error || "",
                    serverResponse.error_description,
                    serverResponse.suberror,
                    serverResponse.timestamp || "",
                    serverResponse.trace_id || "",
                    serverResponse.correlation_id || "",
                    serverResponse.claims || "",
                    serverErrorNo
                );
            }

            throw new ServerError(
                serverResponse.error || "",
                serverResponse.error_description,
                serverResponse.suberror,
                serverErrorNo
            );
        }
    }

    /**
     * Function which validates server authorization token response.
     * @param serverResponse
     * @param refreshAccessToken
     */
    validateTokenResponse(
        serverResponse: ServerAuthorizationTokenResponse,
        refreshAccessToken?: boolean
    ): void {
        // Check for error
        if (
            serverResponse.error ||
            serverResponse.error_description ||
            serverResponse.suberror
        ) {
            const errString = `${serverResponse.error_codes} - [${serverResponse.timestamp}]: ${serverResponse.error_description} - Correlation ID: ${serverResponse.correlation_id} - Trace ID: ${serverResponse.trace_id}`;
            const serverErrorNo = serverResponse.error_codes?.length
                ? serverResponse.error_codes[0]
                : undefined;
            const serverError = new ServerError(
                serverResponse.error,
                errString,
                serverResponse.suberror,
                serverErrorNo
            );

            // check if 500 error
            if (
                refreshAccessToken &&
                serverResponse.status &&
                serverResponse.status >= HttpStatus.SERVER_ERROR_RANGE_START &&
                serverResponse.status <= HttpStatus.SERVER_ERROR_RANGE_END
            ) {
                this.logger.warning(
                    `executeTokenRequest:validateTokenResponse - AAD is currently unavailable and the access token is unable to be refreshed.\n${serverError}`
                );

                // don't throw an exception, but alert the user via a log that the token was unable to be refreshed
                return;
                // check if 400 error
            } else if (
                refreshAccessToken &&
                serverResponse.status &&
                serverResponse.status >= HttpStatus.CLIENT_ERROR_RANGE_START &&
                serverResponse.status <= HttpStatus.CLIENT_ERROR_RANGE_END
            ) {
                this.logger.warning(
                    `executeTokenRequest:validateTokenResponse - AAD is currently available but is unable to refresh the access token.\n${serverError}`
                );

                // don't throw an exception, but alert the user via a log that the token was unable to be refreshed
                return;
            }

            if (
                isInteractionRequiredError(
                    serverResponse.error,
                    serverResponse.error_description,
                    serverResponse.suberror
                )
            ) {
                throw new InteractionRequiredAuthError(
                    serverResponse.error,
                    serverResponse.error_description,
                    serverResponse.suberror,
                    serverResponse.timestamp || Constants.EMPTY_STRING,
                    serverResponse.trace_id || Constants.EMPTY_STRING,
                    serverResponse.correlation_id || Constants.EMPTY_STRING,
                    serverResponse.claims || Constants.EMPTY_STRING,
                    serverErrorNo
                );
            }

            throw serverError;
        }
    }

    /**
     * Returns a constructed token response based on given string. Also manages the cache updates and cleanups.
     * @param serverTokenResponse
     * @param authority
     */
    async handleServerTokenResponse(
        serverTokenResponse: ServerAuthorizationTokenResponse,
        authority: Authority,
        reqTimestamp: number,
        request: BaseAuthRequest,
        authCodePayload?: AuthorizationCodePayload,
        userAssertionHash?: string,
        handlingRefreshTokenResponse?: boolean,
        forceCacheRefreshTokenResponse?: boolean,
        serverRequestId?: string
    ): Promise<AuthenticationResult> {
        this.performanceClient?.addQueueMeasurement(
            PerformanceEvents.HandleServerTokenResponse,
            serverTokenResponse.correlation_id
        );

        // create an idToken object (not entity)
        let idTokenClaims: TokenClaims | undefined;
        if (serverTokenResponse.id_token) {
            idTokenClaims = extractTokenClaims(
                serverTokenResponse.id_token || Constants.EMPTY_STRING,
                this.cryptoObj.base64Decode
            );

            // token nonce check (TODO: Add a warning if no nonce is given?)
            if (authCodePayload && authCodePayload.nonce) {
                if (idTokenClaims.nonce !== authCodePayload.nonce) {
                    throw createClientAuthError(
                        ClientAuthErrorCodes.nonceMismatch
                    );
                }
            }

            // token max_age check
            if (request.maxAge || request.maxAge === 0) {
                const authTime = idTokenClaims.auth_time;
                if (!authTime) {
                    throw createClientAuthError(
                        ClientAuthErrorCodes.authTimeNotFound
                    );
                }

                checkMaxAge(authTime, request.maxAge);
            }
        }

        // generate homeAccountId
        this.homeAccountIdentifier = AccountEntity.generateHomeAccountId(
            serverTokenResponse.client_info || Constants.EMPTY_STRING,
            authority.authorityType,
            this.logger,
            this.cryptoObj,
            idTokenClaims
        );

        // save the response tokens
        let requestStateObj: RequestStateObject | undefined;
        if (!!authCodePayload && !!authCodePayload.state) {
            requestStateObj = ProtocolUtils.parseRequestState(
                this.cryptoObj,
                authCodePayload.state
            );
        }

        // Add keyId from request to serverTokenResponse if defined
        serverTokenResponse.key_id =
            serverTokenResponse.key_id || request.sshKid || undefined;

        const cacheRecord = this.generateCacheRecord(
            serverTokenResponse,
            authority,
            reqTimestamp,
            request,
            idTokenClaims,
            userAssertionHash,
            authCodePayload
        );
        let cacheContext;
        try {
            if (this.persistencePlugin && this.serializableCache) {
                this.logger.verbose(
                    "Persistence enabled, calling beforeCacheAccess"
                );
                cacheContext = new TokenCacheContext(
                    this.serializableCache,
                    true
                );
                await this.persistencePlugin.beforeCacheAccess(cacheContext);
            }
            /*
             * When saving a refreshed tokens to the cache, it is expected that the account that was used is present in the cache.
             * If not present, we should return null, as it's the case that another application called removeAccount in between
             * the calls to getAllAccounts and acquireTokenSilent. We should not overwrite that removal, unless explicitly flagged by
             * the developer, as in the case of refresh token flow used in ADAL Node to MSAL Node migration.
             */
            if (
                handlingRefreshTokenResponse &&
                !forceCacheRefreshTokenResponse &&
                cacheRecord.account
            ) {
                const key = cacheRecord.account.generateAccountKey();
                const account = this.cacheStorage.getAccount(key, this.logger);
                if (!account) {
                    this.logger.warning(
                        "Account used to refresh tokens not in persistence, refreshed tokens will not be stored in the cache"
                    );
                    return await ResponseHandler.generateAuthenticationResult(
                        this.cryptoObj,
                        authority,
                        cacheRecord,
                        false,
                        request,
                        idTokenClaims,
                        requestStateObj,
                        undefined,
                        serverRequestId
                    );
                }
            }
            await this.cacheStorage.saveCacheRecord(
                cacheRecord,
                request.storeInCache,
                request.correlationId
            );
        } finally {
            if (
                this.persistencePlugin &&
                this.serializableCache &&
                cacheContext
            ) {
                this.logger.verbose(
                    "Persistence enabled, calling afterCacheAccess"
                );
                await this.persistencePlugin.afterCacheAccess(cacheContext);
            }
        }

        return ResponseHandler.generateAuthenticationResult(
            this.cryptoObj,
            authority,
            cacheRecord,
            false,
            request,
            idTokenClaims,
            requestStateObj,
            serverTokenResponse,
            serverRequestId
        );
    }

    /**
     * Generates CacheRecord
     * @param serverTokenResponse
     * @param idTokenObj
     * @param authority
     */
    private generateCacheRecord(
        serverTokenResponse: ServerAuthorizationTokenResponse,
        authority: Authority,
        reqTimestamp: number,
        request: BaseAuthRequest,
        idTokenClaims?: TokenClaims,
        userAssertionHash?: string,
        authCodePayload?: AuthorizationCodePayload
    ): CacheRecord {
        const env = authority.getPreferredCache();
        if (!env) {
            throw createClientAuthError(
                ClientAuthErrorCodes.invalidCacheEnvironment
            );
        }

        const claimsTenantId = getTenantIdFromIdTokenClaims(idTokenClaims);

        // IdToken: non AAD scenarios can have empty realm
        let cachedIdToken: IdTokenEntity | undefined;
        let cachedAccount: AccountEntity | undefined;
        if (serverTokenResponse.id_token && !!idTokenClaims) {
            cachedIdToken = CacheHelpers.createIdTokenEntity(
                this.homeAccountIdentifier,
                env,
                serverTokenResponse.id_token,
                this.clientId,
                claimsTenantId || ""
            );

            cachedAccount = buildAccountToCache(
                this.cacheStorage,
                authority,
                this.homeAccountIdentifier,
                idTokenClaims,
                this.cryptoObj.base64Decode,
                serverTokenResponse.client_info,
                env,
                claimsTenantId,
                authCodePayload,
                undefined, // nativeAccountId
                this.logger
            );
        }

        // AccessToken
        let cachedAccessToken: AccessTokenEntity | null = null;
        if (serverTokenResponse.access_token) {
            // If scopes not returned in server response, use request scopes
            const responseScopes = serverTokenResponse.scope
                ? ScopeSet.fromString(serverTokenResponse.scope)
                : new ScopeSet(request.scopes || []);

            /*
             * Use timestamp calculated before request
             * Server may return timestamps as strings, parse to numbers if so.
             */
            const expiresIn: number =
                (typeof serverTokenResponse.expires_in === "string"
                    ? parseInt(serverTokenResponse.expires_in, 10)
                    : serverTokenResponse.expires_in) || 0;
            const extExpiresIn: number =
                (typeof serverTokenResponse.ext_expires_in === "string"
                    ? parseInt(serverTokenResponse.ext_expires_in, 10)
                    : serverTokenResponse.ext_expires_in) || 0;
            const refreshIn: number | undefined =
                (typeof serverTokenResponse.refresh_in === "string"
                    ? parseInt(serverTokenResponse.refresh_in, 10)
                    : serverTokenResponse.refresh_in) || undefined;
            const tokenExpirationSeconds = reqTimestamp + expiresIn;
            const extendedTokenExpirationSeconds =
                tokenExpirationSeconds + extExpiresIn;
            const refreshOnSeconds =
                refreshIn && refreshIn > 0
                    ? reqTimestamp + refreshIn
                    : undefined;

            // non AAD scenarios can have empty realm
            cachedAccessToken = CacheHelpers.createAccessTokenEntity(
                this.homeAccountIdentifier,
                env,
                serverTokenResponse.access_token,
                this.clientId,
                claimsTenantId || authority.tenant || "",
                responseScopes.printScopes(),
                tokenExpirationSeconds,
                extendedTokenExpirationSeconds,
                this.cryptoObj.base64Decode,
                refreshOnSeconds,
                serverTokenResponse.token_type,
                userAssertionHash,
                serverTokenResponse.key_id,
                request.claims,
                request.requestedClaimsHash
            );
        }

        // refreshToken
        let cachedRefreshToken: RefreshTokenEntity | null = null;
        if (serverTokenResponse.refresh_token) {
            let rtExpiresOn: number | undefined;
            if (serverTokenResponse.refresh_token_expires_in) {
                const rtExpiresIn: number =
                    typeof serverTokenResponse.refresh_token_expires_in ===
                    "string"
                        ? parseInt(
                              serverTokenResponse.refresh_token_expires_in,
                              10
                          )
                        : serverTokenResponse.refresh_token_expires_in;
                rtExpiresOn = reqTimestamp + rtExpiresIn;
            }
            cachedRefreshToken = CacheHelpers.createRefreshTokenEntity(
                this.homeAccountIdentifier,
                env,
                serverTokenResponse.refresh_token,
                this.clientId,
                serverTokenResponse.foci,
                userAssertionHash,
                rtExpiresOn
            );
        }

        // appMetadata
        let cachedAppMetadata: AppMetadataEntity | null = null;
        if (serverTokenResponse.foci) {
            cachedAppMetadata = {
                clientId: this.clientId,
                environment: env,
                familyId: serverTokenResponse.foci,
            };
        }

        return new CacheRecord(
            cachedAccount,
            cachedIdToken,
            cachedAccessToken,
            cachedRefreshToken,
            cachedAppMetadata
        );
    }

    /**
     * Creates an @AuthenticationResult from @CacheRecord , @IdToken , and a boolean that states whether or not the result is from cache.
     *
     * Optionally takes a state string that is set as-is in the response.
     *
     * @param cacheRecord
     * @param idTokenObj
     * @param fromTokenCache
     * @param stateString
     */
    static async generateAuthenticationResult(
        cryptoObj: ICrypto,
        authority: Authority,
        cacheRecord: CacheRecord,
        fromTokenCache: boolean,
        request: BaseAuthRequest,
        idTokenClaims?: TokenClaims,
        requestState?: RequestStateObject,
        serverTokenResponse?: ServerAuthorizationTokenResponse,
        requestId?: string
    ): Promise<AuthenticationResult> {
        let accessToken: string = Constants.EMPTY_STRING;
        let responseScopes: Array<string> = [];
        let expiresOn: Date | null = null;
        let extExpiresOn: Date | undefined;
        let refreshOn: Date | undefined;
        let familyId: string = Constants.EMPTY_STRING;

        if (cacheRecord.accessToken) {
            /*
             * if the request object has `popKid` property, `signPopToken` will be set to false and
             * the token will be returned unsigned
             */
            if (
                cacheRecord.accessToken.tokenType ===
                    AuthenticationScheme.POP &&
                !request.popKid
            ) {
                const popTokenGenerator: PopTokenGenerator =
                    new PopTokenGenerator(cryptoObj);
                const { secret, keyId } = cacheRecord.accessToken;

                if (!keyId) {
                    throw createClientAuthError(
                        ClientAuthErrorCodes.keyIdMissing
                    );
                }

                accessToken = await popTokenGenerator.signPopToken(
                    secret,
                    keyId,
                    request
                );
            } else {
                accessToken = cacheRecord.accessToken.secret;
            }
            responseScopes = ScopeSet.fromString(
                cacheRecord.accessToken.target
            ).asArray();
            expiresOn = new Date(
                Number(cacheRecord.accessToken.expiresOn) * 1000
            );
            extExpiresOn = new Date(
                Number(cacheRecord.accessToken.extendedExpiresOn) * 1000
            );
            if (cacheRecord.accessToken.refreshOn) {
                refreshOn = new Date(
                    Number(cacheRecord.accessToken.refreshOn) * 1000
                );
            }
        }

        if (cacheRecord.appMetadata) {
            familyId =
                cacheRecord.appMetadata.familyId === THE_FAMILY_ID
                    ? THE_FAMILY_ID
                    : "";
        }
        const uid = idTokenClaims?.oid || idTokenClaims?.sub || "";
        const tid = idTokenClaims?.tid || "";

        // for hybrid + native bridge enablement, send back the native account Id
        if (serverTokenResponse?.spa_accountid && !!cacheRecord.account) {
            cacheRecord.account.nativeAccountId =
                serverTokenResponse?.spa_accountid;
        }

        const accountInfo: AccountInfo | null = cacheRecord.account
            ? updateAccountTenantProfileData(
                  cacheRecord.account.getAccountInfo(),
                  undefined, // tenantProfile optional
                  idTokenClaims,
                  cacheRecord.idToken?.secret
              )
            : null;

        return {
            authority: authority.canonicalAuthority,
            uniqueId: uid,
            tenantId: tid,
            scopes: responseScopes,
            account: accountInfo,
            idToken: cacheRecord?.idToken?.secret || "",
            idTokenClaims: idTokenClaims || {},
            accessToken: accessToken,
            fromCache: fromTokenCache,
            expiresOn: expiresOn,
            extExpiresOn: extExpiresOn,
            refreshOn: refreshOn,
            correlationId: request.correlationId,
            requestId: requestId || Constants.EMPTY_STRING,
            familyId: familyId,
            tokenType:
                cacheRecord.accessToken?.tokenType || Constants.EMPTY_STRING,
            state: requestState
                ? requestState.userRequestState
                : Constants.EMPTY_STRING,
            cloudGraphHostName:
                cacheRecord.account?.cloudGraphHostName ||
                Constants.EMPTY_STRING,
            msGraphHost:
                cacheRecord.account?.msGraphHost || Constants.EMPTY_STRING,
            code: serverTokenResponse?.spa_code,
            fromNativeBroker: false,
        };
    }
}

export function buildAccountToCache(
    cacheStorage: CacheManager,
    authority: Authority,
    homeAccountId: string,
    idTokenClaims: TokenClaims,
    base64Decode: (input: string) => string,
    clientInfo?: string,
    environment?: string,
    claimsTenantId?: string | null,
    authCodePayload?: AuthorizationCodePayload,
    nativeAccountId?: string,
    logger?: Logger
): AccountEntity {
    logger?.verbose("setCachedAccount called");

    // Check if base account is already cached
    const accountKeys = cacheStorage.getAccountKeys();
    const baseAccountKey = accountKeys.find((accountKey: string) => {
        return accountKey.startsWith(homeAccountId);
    });

    let cachedAccount: AccountEntity | null = null;
    if (baseAccountKey) {
        cachedAccount = cacheStorage.getAccount(baseAccountKey, logger);
    }

    const baseAccount =
        cachedAccount ||
        AccountEntity.createAccount(
            {
                homeAccountId,
                idTokenClaims,
                clientInfo,
                environment,
                cloudGraphHostName: authCodePayload?.cloud_graph_host_name,
                msGraphHost: authCodePayload?.msgraph_host,
                nativeAccountId: nativeAccountId,
            },
            authority,
            base64Decode
        );

    const tenantProfiles = baseAccount.tenantProfiles || [];

    if (
        claimsTenantId &&
        !tenantProfiles.find((tenantProfile) => {
            return tenantProfile.tenantId === claimsTenantId;
        })
    ) {
        const newTenantProfile = buildTenantProfileFromIdTokenClaims(
            homeAccountId,
            idTokenClaims
        );
        tenantProfiles.push(newTenantProfile);
    }
    baseAccount.tenantProfiles = tenantProfiles;

    return baseAccount;
}
