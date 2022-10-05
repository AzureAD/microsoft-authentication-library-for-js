/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerAuthorizationTokenResponse } from "./ServerAuthorizationTokenResponse";
import { buildClientInfo} from "../account/ClientInfo";
import { ICrypto } from "../crypto/ICrypto";
import { ClientAuthError } from "../error/ClientAuthError";
import { StringUtils } from "../utils/StringUtils";
import { ServerAuthorizationCodeResponse } from "./ServerAuthorizationCodeResponse";
import { Logger } from "../logger/Logger";
import { ServerError } from "../error/ServerError";
import { AuthToken } from "../account/AuthToken";
import { ScopeSet } from "../request/ScopeSet";
import { AuthenticationResult } from "./AuthenticationResult";
import { AccountEntity } from "../cache/entities/AccountEntity";
import { Authority } from "../authority/Authority";
import { AuthorityType } from "../authority/AuthorityType";
import { IdTokenEntity } from "../cache/entities/IdTokenEntity";
import { AccessTokenEntity } from "../cache/entities/AccessTokenEntity";
import { RefreshTokenEntity } from "../cache/entities/RefreshTokenEntity";
import { InteractionRequiredAuthError } from "../error/InteractionRequiredAuthError";
import { CacheRecord } from "../cache/entities/CacheRecord";
import { CacheManager } from "../cache/CacheManager";
import { ProtocolUtils, RequestStateObject } from "../utils/ProtocolUtils";
import { AuthenticationScheme, Constants, THE_FAMILY_ID } from "../utils/Constants";
import { PopTokenGenerator } from "../crypto/PopTokenGenerator";
import { AppMetadataEntity } from "../cache/entities/AppMetadataEntity";
import { ICachePlugin } from "../cache/interface/ICachePlugin";
import { TokenCacheContext } from "../cache/persistence/TokenCacheContext";
import { ISerializableTokenCache } from "../cache/interface/ISerializableTokenCache";
import { AuthorizationCodePayload } from "./AuthorizationCodePayload";
import { BaseAuthRequest } from "../request/BaseAuthRequest";

/**
 * Class that handles response parsing.
 */
export class ResponseHandler {
    private clientId: string;
    private cacheStorage: CacheManager;
    private cryptoObj: ICrypto;
    private logger: Logger;
    private homeAccountIdentifier: string;
    private serializableCache: ISerializableTokenCache | null;
    private persistencePlugin: ICachePlugin | null;

    constructor(clientId: string, cacheStorage: CacheManager, cryptoObj: ICrypto, logger: Logger, serializableCache: ISerializableTokenCache | null, persistencePlugin: ICachePlugin | null) {
        this.clientId = clientId;
        this.cacheStorage = cacheStorage;
        this.cryptoObj = cryptoObj;
        this.logger = logger;
        this.serializableCache = serializableCache;
        this.persistencePlugin = persistencePlugin;
    }

    /**
     * Function which validates server authorization code response.
     * @param serverResponseHash
     * @param cachedState
     * @param cryptoObj
     */
    validateServerAuthorizationCodeResponse(serverResponseHash: ServerAuthorizationCodeResponse, cachedState: string, cryptoObj: ICrypto): void {

        if (!serverResponseHash.state || !cachedState) {
            throw !serverResponseHash.state ? ClientAuthError.createStateNotFoundError("Server State") : ClientAuthError.createStateNotFoundError("Cached State");
        }

        if (decodeURIComponent(serverResponseHash.state) !== decodeURIComponent(cachedState)) {
            throw ClientAuthError.createStateMismatchError();
        }

        // Check for error
        if (serverResponseHash.error || serverResponseHash.error_description || serverResponseHash.suberror) {
            if (InteractionRequiredAuthError.isInteractionRequiredError(serverResponseHash.error, serverResponseHash.error_description, serverResponseHash.suberror)) {
                throw new InteractionRequiredAuthError(serverResponseHash.error || Constants.EMPTY_STRING, serverResponseHash.error_description, serverResponseHash.suberror);
            }

            throw new ServerError(serverResponseHash.error || Constants.EMPTY_STRING, serverResponseHash.error_description, serverResponseHash.suberror);
        }

        if (serverResponseHash.client_info) {
            buildClientInfo(serverResponseHash.client_info, cryptoObj);
        }
    }

    /**
     * Function which validates server authorization token response.
     * @param serverResponse
     */
    validateTokenResponse(serverResponse: ServerAuthorizationTokenResponse): void {
        // Check for error
        if (serverResponse.error || serverResponse.error_description || serverResponse.suberror) {
            if (InteractionRequiredAuthError.isInteractionRequiredError(serverResponse.error, serverResponse.error_description, serverResponse.suberror)) {
                throw new InteractionRequiredAuthError(serverResponse.error, serverResponse.error_description, serverResponse.suberror);
            }

            const errString = `${serverResponse.error_codes} - [${serverResponse.timestamp}]: ${serverResponse.error_description} - Correlation ID: ${serverResponse.correlation_id} - Trace ID: ${serverResponse.trace_id}`;
            throw new ServerError(serverResponse.error, errString, serverResponse.suberror);
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
        serverRequestId?: string): Promise<AuthenticationResult> {

        // create an idToken object (not entity)
        let idTokenObj: AuthToken | undefined;
        if (serverTokenResponse.id_token) {
            idTokenObj = new AuthToken(serverTokenResponse.id_token || Constants.EMPTY_STRING, this.cryptoObj);

            // token nonce check (TODO: Add a warning if no nonce is given?)
            if (authCodePayload && !StringUtils.isEmpty(authCodePayload.nonce)) {
                if (idTokenObj.claims.nonce !== authCodePayload.nonce) {
                    throw ClientAuthError.createNonceMismatchError();
                }
            }

            // token max_age check
            if (request.maxAge || (request.maxAge === 0)) {
                const authTime = idTokenObj.claims.auth_time;
                if (!authTime) {
                    throw ClientAuthError.createAuthTimeNotFoundError();
                }

                AuthToken.checkMaxAge(authTime, request.maxAge);
            }
        }

        // generate homeAccountId
        this.homeAccountIdentifier = AccountEntity.generateHomeAccountId(serverTokenResponse.client_info || Constants.EMPTY_STRING, authority.authorityType, this.logger, this.cryptoObj, idTokenObj);

        // save the response tokens
        let requestStateObj: RequestStateObject | undefined;
        if (!!authCodePayload && !!authCodePayload.state) {
            requestStateObj = ProtocolUtils.parseRequestState(this.cryptoObj, authCodePayload.state);
        }

        // Add keyId from request to serverTokenResponse if defined
        serverTokenResponse.key_id = serverTokenResponse.key_id || request.sshKid || undefined;

        const cacheRecord = this.generateCacheRecord(serverTokenResponse, authority, reqTimestamp, request, idTokenObj, userAssertionHash, authCodePayload);
        let cacheContext;
        try {
            if (this.persistencePlugin && this.serializableCache) {
                this.logger.verbose("Persistence enabled, calling beforeCacheAccess");
                cacheContext = new TokenCacheContext(this.serializableCache, true);
                await this.persistencePlugin.beforeCacheAccess(cacheContext);
            }
            /*
             * When saving a refreshed tokens to the cache, it is expected that the account that was used is present in the cache.
             * If not present, we should return null, as it's the case that another application called removeAccount in between
             * the calls to getAllAccounts and acquireTokenSilent. We should not overwrite that removal, unless explicitly flagged by
             * the developer, as in the case of refresh token flow used in ADAL Node to MSAL Node migration.
             */
            if (handlingRefreshTokenResponse && !forceCacheRefreshTokenResponse && cacheRecord.account) {
                const key = cacheRecord.account.generateAccountKey();
                const account = this.cacheStorage.getAccount(key);
                if (!account) {
                    this.logger.warning("Account used to refresh tokens not in persistence, refreshed tokens will not be stored in the cache");
                    return ResponseHandler.generateAuthenticationResult(this.cryptoObj, authority, cacheRecord, false, request, idTokenObj, requestStateObj, undefined, serverRequestId);
                }
            }
            await this.cacheStorage.saveCacheRecord(cacheRecord);
        } finally {
            if (this.persistencePlugin && this.serializableCache && cacheContext) {
                this.logger.verbose("Persistence enabled, calling afterCacheAccess");
                await this.persistencePlugin.afterCacheAccess(cacheContext);
            }
        }
        return ResponseHandler.generateAuthenticationResult(this.cryptoObj, authority, cacheRecord, false, request, idTokenObj, requestStateObj, serverTokenResponse.spa_code, serverRequestId);
    }

    /**
     * Generates CacheRecord
     * @param serverTokenResponse
     * @param idTokenObj
     * @param authority
     */
    private generateCacheRecord(serverTokenResponse: ServerAuthorizationTokenResponse, authority: Authority, reqTimestamp: number, request: BaseAuthRequest, idTokenObj?: AuthToken, userAssertionHash?: string, authCodePayload?: AuthorizationCodePayload): CacheRecord {
        const env = authority.getPreferredCache();
        if (StringUtils.isEmpty(env)) {
            throw ClientAuthError.createInvalidCacheEnvironmentError();
        }

        // IdToken: non AAD scenarios can have empty realm
        let cachedIdToken: IdTokenEntity | undefined;
        let cachedAccount: AccountEntity | undefined;
        if (!StringUtils.isEmpty(serverTokenResponse.id_token) && !!idTokenObj) {
            cachedIdToken = IdTokenEntity.createIdTokenEntity(
                this.homeAccountIdentifier,
                env,
                serverTokenResponse.id_token || Constants.EMPTY_STRING,
                this.clientId,
                idTokenObj.claims.tid || Constants.EMPTY_STRING,
            );

            cachedAccount = this.generateAccountEntity(
                serverTokenResponse,
                idTokenObj,
                authority,
                authCodePayload
            );
        }

        // AccessToken
        let cachedAccessToken: AccessTokenEntity | null = null;
        if (!StringUtils.isEmpty(serverTokenResponse.access_token)) {

            // If scopes not returned in server response, use request scopes
            const responseScopes = serverTokenResponse.scope ? ScopeSet.fromString(serverTokenResponse.scope) : new ScopeSet(request.scopes || []);

            /*
             * Use timestamp calculated before request
             * Server may return timestamps as strings, parse to numbers if so.
             */
            const expiresIn: number = (typeof serverTokenResponse.expires_in === "string" ? parseInt(serverTokenResponse.expires_in, 10) : serverTokenResponse.expires_in) || 0;
            const extExpiresIn: number = (typeof serverTokenResponse.ext_expires_in === "string" ? parseInt(serverTokenResponse.ext_expires_in, 10) : serverTokenResponse.ext_expires_in) || 0;
            const refreshIn: number | undefined = (typeof serverTokenResponse.refresh_in === "string" ? parseInt(serverTokenResponse.refresh_in, 10) : serverTokenResponse.refresh_in) || undefined;
            const tokenExpirationSeconds = reqTimestamp + expiresIn;
            const extendedTokenExpirationSeconds = tokenExpirationSeconds + extExpiresIn;
            const refreshOnSeconds = refreshIn && refreshIn > 0 ? reqTimestamp + refreshIn : undefined;

            // non AAD scenarios can have empty realm
            cachedAccessToken = AccessTokenEntity.createAccessTokenEntity(
                this.homeAccountIdentifier,
                env,
                serverTokenResponse.access_token || Constants.EMPTY_STRING,
                this.clientId,
                idTokenObj ? idTokenObj.claims.tid || Constants.EMPTY_STRING : authority.tenant,
                responseScopes.printScopes(),
                tokenExpirationSeconds,
                extendedTokenExpirationSeconds,
                this.cryptoObj,
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
        if (!StringUtils.isEmpty(serverTokenResponse.refresh_token)) {
            cachedRefreshToken = RefreshTokenEntity.createRefreshTokenEntity(
                this.homeAccountIdentifier,
                env,
                serverTokenResponse.refresh_token || Constants.EMPTY_STRING,
                this.clientId,
                serverTokenResponse.foci,
                userAssertionHash
            );
        }

        // appMetadata
        let cachedAppMetadata: AppMetadataEntity | null = null;
        if (!StringUtils.isEmpty(serverTokenResponse.foci)) {
            cachedAppMetadata = AppMetadataEntity.createAppMetadataEntity(this.clientId, env, serverTokenResponse.foci);
        }

        return new CacheRecord(cachedAccount, cachedIdToken, cachedAccessToken, cachedRefreshToken, cachedAppMetadata);
    }

    /**
     * Generate Account
     * @param serverTokenResponse
     * @param idToken
     * @param authority
     */
    private generateAccountEntity(serverTokenResponse: ServerAuthorizationTokenResponse, idToken: AuthToken, authority: Authority, authCodePayload?: AuthorizationCodePayload): AccountEntity {
        const authorityType = authority.authorityType;
        const cloudGraphHostName = authCodePayload ? authCodePayload.cloud_graph_host_name : Constants.EMPTY_STRING;
        const msGraphhost = authCodePayload ? authCodePayload.msgraph_host : Constants.EMPTY_STRING;

        // ADFS does not require client_info in the response
        if (authorityType === AuthorityType.Adfs) {
            this.logger.verbose("Authority type is ADFS, creating ADFS account");
            return AccountEntity.createGenericAccount(this.homeAccountIdentifier, idToken, authority, cloudGraphHostName, msGraphhost);
        }

        // This fallback applies to B2C as well as they fall under an AAD account type.
        if (StringUtils.isEmpty(serverTokenResponse.client_info) && authority.protocolMode === "AAD") {
            throw ClientAuthError.createClientInfoEmptyError();
        }

        return serverTokenResponse.client_info ?
            AccountEntity.createAccount(serverTokenResponse.client_info, this.homeAccountIdentifier, idToken, authority, cloudGraphHostName, msGraphhost) :
            AccountEntity.createGenericAccount(this.homeAccountIdentifier, idToken, authority, cloudGraphHostName, msGraphhost);
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
        idTokenObj?: AuthToken,
        requestState?: RequestStateObject,
        code?: string,
        requestId?: string
    ): Promise<AuthenticationResult> {
        let accessToken: string = Constants.EMPTY_STRING;
        let responseScopes: Array<string> = [];
        let expiresOn: Date | null = null;
        let extExpiresOn: Date | undefined;
        let familyId: string = Constants.EMPTY_STRING;

        if (cacheRecord.accessToken) {
            if (cacheRecord.accessToken.tokenType === AuthenticationScheme.POP) {
                const popTokenGenerator: PopTokenGenerator = new PopTokenGenerator(cryptoObj);
                const { secret, keyId } = cacheRecord.accessToken;

                if (!keyId) {
                    throw ClientAuthError.createKeyIdMissingError();
                }

                accessToken = await popTokenGenerator.signPopToken(secret, keyId, request);
            } else {
                accessToken = cacheRecord.accessToken.secret;
            }
            responseScopes = ScopeSet.fromString(cacheRecord.accessToken.target).asArray();
            expiresOn = new Date(Number(cacheRecord.accessToken.expiresOn) * 1000);
            extExpiresOn = new Date(Number(cacheRecord.accessToken.extendedExpiresOn) * 1000);
        }

        if (cacheRecord.appMetadata) {
            familyId = cacheRecord.appMetadata.familyId === THE_FAMILY_ID ? THE_FAMILY_ID : Constants.EMPTY_STRING;
        }
        const uid = idTokenObj?.claims.oid || idTokenObj?.claims.sub || Constants.EMPTY_STRING;
        const tid = idTokenObj?.claims.tid || Constants.EMPTY_STRING;

        return {
            authority: authority.canonicalAuthority,
            uniqueId: uid,
            tenantId: tid,
            scopes: responseScopes,
            account: cacheRecord.account ? cacheRecord.account.getAccountInfo() : null,
            idToken: idTokenObj ? idTokenObj.rawToken : Constants.EMPTY_STRING,
            idTokenClaims: idTokenObj ? idTokenObj.claims : {},
            accessToken: accessToken,
            fromCache: fromTokenCache,
            expiresOn: expiresOn,
            correlationId: request.correlationId,
            requestId: requestId || Constants.EMPTY_STRING,
            extExpiresOn: extExpiresOn,
            familyId: familyId,
            tokenType: cacheRecord.accessToken?.tokenType || Constants.EMPTY_STRING,
            state: requestState ? requestState.userRequestState : Constants.EMPTY_STRING,
            cloudGraphHostName: cacheRecord.account?.cloudGraphHostName || Constants.EMPTY_STRING,
            msGraphHost: cacheRecord.account?.msGraphHost || Constants.EMPTY_STRING,
            code,
            fromNativeBroker: false
        };
    }
}
