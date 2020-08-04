/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { buildClientInfo, ClientInfo } from "../account/ClientInfo";
import { ICrypto } from "../crypto/ICrypto";
import { ClientAuthError } from "../error/ClientAuthError";
import { StringUtils } from "../utils/StringUtils";
import { ServerAuthorizationCodeResponse } from "../server/ServerAuthorizationCodeResponse";
import { Logger } from "../logger/Logger";
import { ServerError } from "../error/ServerError";
import { IdToken } from "../account/IdToken";
import { ScopeSet } from "../request/ScopeSet";
import { TimeUtils } from "../utils/TimeUtils";
import { AuthenticationResult } from "./AuthenticationResult";
import { AccountEntity } from "../cache/entities/AccountEntity";
import { Authority } from "../authority/Authority";
import { AuthorityType } from "../authority/AuthorityType";
import { IdTokenEntity } from "../cache/entities/IdTokenEntity";
import { AccessTokenEntity } from "../cache/entities/AccessTokenEntity";
import { RefreshTokenEntity } from "../cache/entities/RefreshTokenEntity";
import { InteractionRequiredAuthError } from "../error/InteractionRequiredAuthError";
import { CacheRecord } from "../cache/entities/CacheRecord";
import { TrustedAuthority } from "../authority/TrustedAuthority";
import { CacheManager } from "../cache/CacheManager";
import { ProtocolUtils, LibraryStateObject, RequestStateObject } from "../utils/ProtocolUtils";

/**
 * Class that handles response parsing.
 */
export class ResponseHandler {
    private clientId: string;
    private cacheStorage: CacheManager;
    private cryptoObj: ICrypto;
    private logger: Logger;
    private clientInfo: ClientInfo;
    private homeAccountIdentifier: string;

    constructor(clientId: string, cacheStorage: CacheManager, cryptoObj: ICrypto, logger: Logger) {
        this.clientId = clientId;
        this.cacheStorage = cacheStorage;
        this.cryptoObj = cryptoObj;
        this.logger = logger;
    }

    /**
     * Function which validates server authorization code response.
     * @param serverResponseHash
     * @param cachedState
     * @param cryptoObj
     */
    validateServerAuthorizationCodeResponse(serverResponseHash: ServerAuthorizationCodeResponse, cachedState: string, cryptoObj: ICrypto): void {
        if (decodeURIComponent(serverResponseHash.state) !== decodeURIComponent(cachedState)) {
            throw ClientAuthError.createStateMismatchError();
        }

        // Check for error
        if (serverResponseHash.error || serverResponseHash.error_description || serverResponseHash.suberror) {
            if (InteractionRequiredAuthError.isInteractionRequiredError(serverResponseHash.error, serverResponseHash.error_description, serverResponseHash.suberror)) {
                throw new InteractionRequiredAuthError(serverResponseHash.error, serverResponseHash.error_description, serverResponseHash.suberror);
            }

            throw new ServerError(serverResponseHash.error, serverResponseHash.error_description, serverResponseHash.suberror);
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
            throw new ServerError(serverResponse.error, errString);
        }

        // generate homeAccountId
        if (serverResponse.client_info) {
            this.clientInfo = buildClientInfo(serverResponse.client_info, this.cryptoObj);
            if (!StringUtils.isEmpty(this.clientInfo.uid) && !StringUtils.isEmpty(this.clientInfo.utid)) {
                this.homeAccountIdentifier = `${this.clientInfo.uid}.${this.clientInfo.utid}`;
            }
        }
    }

    /**
     * Returns a constructed token response based on given string. Also manages the cache updates and cleanups.
     * @param serverTokenResponse
     * @param authority
     */
    handleServerTokenResponse(serverTokenResponse: ServerAuthorizationTokenResponse, authority: Authority, cachedNonce?: string, cachedState?: string): AuthenticationResult {
        // create an idToken object (not entity)
        const idTokenObj = new IdToken(serverTokenResponse.id_token, this.cryptoObj);

        // token nonce check (TODO: Add a warning if no nonce is given?)
        if (!StringUtils.isEmpty(cachedNonce)) {
            if (idTokenObj.claims.nonce !== cachedNonce) {
                throw ClientAuthError.createNonceMismatchError();
            }
        }

        // save the response tokens
        let requestStateObj: RequestStateObject = null;
        if (!StringUtils.isEmpty(cachedState)) {
            requestStateObj = ProtocolUtils.parseRequestState(cachedState, this.cryptoObj); 
        }

        const cacheRecord = this.generateCacheRecord(serverTokenResponse, idTokenObj, authority, requestStateObj && requestStateObj.libraryState);
        this.cacheStorage.saveCacheRecord(cacheRecord);

        return ResponseHandler.generateAuthenticationResult(cacheRecord, idTokenObj, false, requestStateObj ? requestStateObj.userRequestState : null);
    }

    /**
     * Generates CacheRecord
     * @param serverTokenResponse
     * @param idTokenObj
     * @param authority
     */
    private generateCacheRecord(serverTokenResponse: ServerAuthorizationTokenResponse, idTokenObj: IdToken, authority: Authority, libraryState?: LibraryStateObject): CacheRecord {
        // Account
        const cachedAccount  = this.generateAccountEntity(
            serverTokenResponse,
            idTokenObj,
            authority
        );

        const reqEnvironment = authority.canonicalAuthorityUrlComponents.HostNameAndPort;
        const env = TrustedAuthority.getCloudDiscoveryMetadata(reqEnvironment) ? TrustedAuthority.getCloudDiscoveryMetadata(reqEnvironment).preferred_cache : "";

        if (StringUtils.isEmpty(env)) {
            throw ClientAuthError.createInvalidCacheEnvironmentError();
        }

        // IdToken
        let cachedIdToken: IdTokenEntity = null;
        if (!StringUtils.isEmpty(serverTokenResponse.id_token)) {
            cachedIdToken = IdTokenEntity.createIdTokenEntity(
                this.homeAccountIdentifier,
                env,
                serverTokenResponse.id_token,
                this.clientId,
                idTokenObj.claims.tid
            );
        }

        // AccessToken
        let cachedAccessToken: AccessTokenEntity = null;
        if (!StringUtils.isEmpty(serverTokenResponse.access_token)) {
            const responseScopes = ScopeSet.fromString(serverTokenResponse.scope);

            // Expiration calculation
            const currentTime = TimeUtils.nowSeconds();

            // If the request timestamp was sent in the library state, use that timestamp to calculate expiration. Otherwise, use current time.
            const timestamp = libraryState ? libraryState.ts : currentTime;
            const tokenExpirationSeconds = timestamp + serverTokenResponse.expires_in;
            const extendedTokenExpirationSeconds = tokenExpirationSeconds + serverTokenResponse.ext_expires_in;

            cachedAccessToken = AccessTokenEntity.createAccessTokenEntity(
                this.homeAccountIdentifier,
                env,
                serverTokenResponse.access_token,
                this.clientId,
                idTokenObj.claims.tid,
                responseScopes.printScopesLowerCase(),
                tokenExpirationSeconds,
                extendedTokenExpirationSeconds
            );
        }

        // refreshToken
        let cachedRefreshToken: RefreshTokenEntity = null;
        if (!StringUtils.isEmpty(serverTokenResponse.refresh_token)) {
            cachedRefreshToken = RefreshTokenEntity.createRefreshTokenEntity(
                this.homeAccountIdentifier,
                env,
                serverTokenResponse.refresh_token,
                this.clientId,
                serverTokenResponse.foci
            );
        }

        return new CacheRecord(cachedAccount, cachedIdToken, cachedAccessToken, cachedRefreshToken);
    }

    /**
     * Generate Account
     * @param serverTokenResponse
     * @param idToken
     * @param authority
     */
    private generateAccountEntity(serverTokenResponse: ServerAuthorizationTokenResponse, idToken: IdToken, authority: Authority): AccountEntity {
        const authorityType = authority.authorityType;

        if (StringUtils.isEmpty(serverTokenResponse.client_info)) {
            throw ClientAuthError.createClientInfoEmptyError(serverTokenResponse.client_info);
        }

        return (authorityType === AuthorityType.Adfs)? 
            AccountEntity.createADFSAccount(authority, idToken): 
            AccountEntity.createAccount(serverTokenResponse.client_info, authority, idToken, this.cryptoObj);
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
    static generateAuthenticationResult(cacheRecord: CacheRecord, idTokenObj: IdToken, fromTokenCache: boolean, stateString?: string): AuthenticationResult {
        let accessToken: string = "";
        let responseScopes: Array<string> = [];
        let expiresOn: Date = null;
        let extExpiresOn: Date = null;
        let familyId: string = null;
        if (cacheRecord.accessToken) {
            accessToken = cacheRecord.accessToken.secret;
            responseScopes = ScopeSet.fromString(cacheRecord.accessToken.target).asArray();
            expiresOn = new Date(Number(cacheRecord.accessToken.expiresOn) * 1000);
            extExpiresOn = new Date(Number(cacheRecord.accessToken.extendedExpiresOn) * 1000);
        }
        if (cacheRecord.refreshToken) {
            familyId = cacheRecord.refreshToken.familyId || null;
        }
        return {
            uniqueId: idTokenObj.claims.oid || idTokenObj.claims.sub,
            tenantId: idTokenObj.claims.tid,
            scopes: responseScopes,
            account: cacheRecord.account.getAccountInfo(),
            idToken: idTokenObj.rawIdToken,
            idTokenClaims: idTokenObj.claims,
            accessToken: accessToken,
            fromCache: fromTokenCache,
            expiresOn: expiresOn,
            extExpiresOn: extExpiresOn,
            familyId: familyId,
            state: stateString || ""
        };
    }
}
