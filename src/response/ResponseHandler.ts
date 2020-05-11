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
import { UnifiedCacheManager } from "../unifiedCache/UnifiedCacheManager";
import { ScopeSet } from "../request/ScopeSet";
import { TimeUtils } from "../utils/TimeUtils";
import { AuthenticationResult } from "./AuthenticationResult";
import { AccountEntity } from "../unifiedCache/entities/AccountEntity";
import { Authority } from "../authority/Authority";
import { AuthorityType } from "../authority/AuthorityType";
import { IdTokenEntity } from "../unifiedCache/entities/IdTokenEntity";
import { AccessTokenEntity } from "../unifiedCache/entities/AccessTokenEntity";
import { RefreshTokenEntity } from "../unifiedCache/entities/RefreshTokenEntity";

/**
 * Class that handles response parsing.
 */
export class ResponseHandler {
    private clientId: string;
    private uCacheManager: UnifiedCacheManager;
    private cryptoObj: ICrypto;
    private logger: Logger;
    private clientInfo: ClientInfo;
    private homeAccountIdentifier: string;

    constructor(clientId: string, unifiedCacheManager: UnifiedCacheManager, cryptoObj: ICrypto, logger: Logger) {
        this.clientId = clientId;
        this.uCacheManager = unifiedCacheManager;
        this.cryptoObj = cryptoObj;
        this.logger = logger;
    }

    /**
     * Function which validates server authorization code response.
     * @param serverResponseHash
     * @param cachedState
     * @param cryptoObj
     */
    validateServerAuthorizationCodeResponse(
        serverResponseHash: ServerAuthorizationCodeResponse,
        cachedState: string,
        cryptoObj: ICrypto
    ): void {
        if (serverResponseHash.state !== cachedState) {
            throw ClientAuthError.createStateMismatchError();
        }

        // Check for error
        if (serverResponseHash.error || serverResponseHash.error_description) {
            throw new ServerError(
                serverResponseHash.error,
                serverResponseHash.error_description
            );
        }

        if (serverResponseHash.client_info) {
            buildClientInfo(serverResponseHash.client_info, cryptoObj);
        }
    }

    /**
     * Function which validates server authorization token response.
     * @param serverResponse
     */
    validateTokenResponse(
        serverResponse: ServerAuthorizationTokenResponse
    ): void {
        // Check for error
        if (serverResponse.error || serverResponse.error_description) {
            const errString = `${serverResponse.error_codes} - [${serverResponse.timestamp}]: ${serverResponse.error_description} - Correlation ID: ${serverResponse.correlation_id} - Trace ID: ${serverResponse.trace_id}`;
            throw new ServerError(serverResponse.error, errString);
        }

        // generate homeAccountId
        if (serverResponse.client_info) {
            this.clientInfo = buildClientInfo(serverResponse.client_info, this.cryptoObj);
            if (!StringUtils.isEmpty(this.clientInfo.uid) && !StringUtils.isEmpty(this.clientInfo.utid)) {
                this.homeAccountIdentifier = this.cryptoObj.base64Encode(this.clientInfo.uid) + "." + this.cryptoObj.base64Encode(this.clientInfo.utid);
            }
        }
    }

    /**
     * Returns a constructed token response based on given string. Also manages the cache updates and cleanups.
     * @param serverTokenResponse
     * @param authorityString
     * @param resource
     * @param state
     */
    generateAuthenticationResult(serverTokenResponse: ServerAuthorizationTokenResponse, authority: Authority): AuthenticationResult {
        // Retrieve current account if in Cache
        // TODO: add this once the req for cache look up for tokens is confirmed

        const authenticationResult = this.processTokenResponse(serverTokenResponse, authority);

        const environment = authority.canonicalAuthorityUrlComponents.HostNameAndPort;
        this.addCredentialsToCache(authenticationResult, environment, serverTokenResponse.refresh_token);

        return authenticationResult;
    }

    /**
     * Returns a new AuthenticationResult with the data from original result filled with the relevant data.
     * @param authenticationResult
     * @param idTokenString(raw idToken in the server response)
     */
    processTokenResponse(serverTokenResponse: ServerAuthorizationTokenResponse, authority: Authority): AuthenticationResult {
        const authenticationResult: AuthenticationResult = {
            uniqueId: "",
            tenantId: "",
            tokenType: "",
            idToken: null,
            idTokenClaims: null,
            accessToken: "",
            scopes: [],
            expiresOn: null,
            familyId: null
        };

        // IdToken
        const idTokenObj = new IdToken(serverTokenResponse.id_token, this.cryptoObj);

        // if account is not in cache, append it to the cache
        this.addAccountToCache(serverTokenResponse, idTokenObj, authority);

        // TODO: Check how this changes for auth code response
        const expiresSeconds = Number(idTokenObj.claims.exp);
        if (expiresSeconds && !authenticationResult.expiresOn) {
            authenticationResult.expiresOn = new Date(expiresSeconds * 1000);
        }

        // Expiration calculation
        const expiresInSeconds = TimeUtils.nowSeconds() + serverTokenResponse.expires_in;
        const extendedExpiresInSeconds = expiresInSeconds + serverTokenResponse.ext_expires_in;
        // Set consented scopes in response
        const responseScopes = ScopeSet.fromString(serverTokenResponse.scope, this.clientId, true);

        return {
            ...authenticationResult,
            uniqueId: idTokenObj.claims.oid || idTokenObj.claims.sub,
            tenantId: idTokenObj.claims.tid,
            idToken: idTokenObj.rawIdToken,
            idTokenClaims: idTokenObj.claims,
            accessToken: serverTokenResponse.access_token,
            expiresOn: new Date(expiresInSeconds),
            extExpiresOn: new Date(extendedExpiresInSeconds),
            scopes: responseScopes.asArray(),
            familyId: serverTokenResponse.foci,
        };
    }

    /**
     * if Account is not in the cache, generateAccount and append it to the cache
     * @param serverTokenResponse
     * @param idToken
     * @param authority
     */
    addAccountToCache(serverTokenResponse: ServerAuthorizationTokenResponse, idToken: IdToken, authority: Authority): void {
        const environment = authority.canonicalAuthorityUrlComponents.HostNameAndPort;
        let accountEntity: AccountEntity;
        const cachedAccount: AccountEntity = this.uCacheManager.getAccount(this.homeAccountIdentifier, environment, idToken.claims.tid);
        if (!cachedAccount) {
            accountEntity = this.generateAccountEntity(serverTokenResponse, idToken, authority);
            this.uCacheManager.addAccountEntity(accountEntity);
        }
    }

    /**
     * Generate Account
     * @param serverTokenResponse
     * @param idToken
     * @param authority
     */
    generateAccountEntity(serverTokenResponse: ServerAuthorizationTokenResponse, idToken: IdToken, authority: Authority): AccountEntity {
        const authorityType = authority.authorityType;

        if (!serverTokenResponse.client_info)
            throw ClientAuthError.createClientInfoEmptyError(serverTokenResponse.client_info);

        switch (authorityType) {
            case AuthorityType.B2C:
                return AccountEntity.createAccount(serverTokenResponse.client_info, authority, idToken, "policy", this.cryptoObj);
            case AuthorityType.Adfs:
                return AccountEntity.createADFSAccount(authority, idToken);
            // default to AAD
            default:
                return AccountEntity.createAccount(serverTokenResponse.client_info, authority, idToken, null, this.cryptoObj);
        }
    }

    /**
     * Appends the minted tokens to the in-memory cache
     * @param authenticationResult
     * @param authority
     */
    addCredentialsToCache(
        authenticationResult: AuthenticationResult,
        authority: string,
        refreshToken: string
    ): void {
        const idTokenEntity = IdTokenEntity.createIdTokenEntity(
            this.homeAccountIdentifier,
            authenticationResult,
            this.clientId,
            authority
        );
        const accessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            this.homeAccountIdentifier,
            authenticationResult,
            this.clientId,
            authority
        );
        const refreshTokenEntity = RefreshTokenEntity.createRefreshTokenEntity(
            this.homeAccountIdentifier,
            authenticationResult,
            refreshToken,
            this.clientId,
            authority
        );

        this.uCacheManager.addCredentialCache(accessTokenEntity, idTokenEntity, refreshTokenEntity);
    }
}
