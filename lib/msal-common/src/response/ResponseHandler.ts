/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { IdToken } from "../auth/IdToken";
import { CacheHelpers } from "../cache/CacheHelpers";
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { ScopeSet } from "../auth/ScopeSet";
import { buildClientInfo, ClientInfo } from "../auth/ClientInfo";
import { Account } from "../auth/Account";
import { ProtocolUtils } from "../utils/ProtocolUtils";
import { ICrypto } from "../crypto/ICrypto";
import { ICacheStorage } from "../cache/ICacheStorage";
import { TokenResponse } from "./TokenResponse";
import { PersistentCacheKeys, TemporaryCacheKeys } from "../utils/Constants";
import { ClientAuthError } from "../error/ClientAuthError";
import { TimeUtils } from "../utils/TimeUtils";
import { AccessTokenKey } from "../cache/AccessTokenKey";
import { AccessTokenValue } from "../cache/AccessTokenValue";
import { StringUtils } from "../utils/StringUtils";
import { UrlString } from "../url/UrlString";
import { ServerAuthorizationCodeResponse, validateServerAuthorizationCodeResponse } from "../server/ServerAuthorizationCodeResponse";
import { Logger } from "../logger/Logger";
import { CodeResponse } from "./CodeResponse";

/**
 * Class that handles response parsing.
 */
export class ResponseHandler {
    private clientId: string;
    private cacheStorage: ICacheStorage;
    private cacheManager: CacheHelpers;
    private cryptoObj: ICrypto;
    private logger: Logger;

    constructor(clientId: string, cacheStorage: ICacheStorage, cacheManager: CacheHelpers, cryptoObj: ICrypto, logger: Logger) {
        this.clientId = clientId;
        this.cacheStorage = cacheStorage;
        this.cacheManager = cacheManager;
        this.cryptoObj = cryptoObj;
        this.logger = logger;
    }

    static setResponseIdToken(originalResponse: TokenResponse, idTokenObj: IdToken) : TokenResponse {
        if (!originalResponse) {
            return null;
        } else if (!idTokenObj) {
            return originalResponse;
        }
    
        const expiresSeconds = Number(idTokenObj.claims.exp);
        if (expiresSeconds && !originalResponse.expiresOn) {
            originalResponse.expiresOn = new Date(expiresSeconds * 1000);
        }
    
        return {
            ...originalResponse,
            idToken: idTokenObj.rawIdToken,
            idTokenClaims: idTokenObj.claims,
            uniqueId: idTokenObj.claims.oid || idTokenObj.claims.sub,
            tenantId: idTokenObj.claims.tid,
        };
    }

    public handleFragmentResponse(hashFragment: string) {
        // Deserialize and validate hash fragment response parameters
        const hashUrlString = new UrlString(hashFragment);
        const hashParams = hashUrlString.getDeserializedHash<ServerAuthorizationCodeResponse>();
        try {
            validateServerAuthorizationCodeResponse(hashParams, this.cacheStorage.getItem(TemporaryCacheKeys.REQUEST_STATE), this.cryptoObj);

            // Cache client info
            if (hashParams.client_info) {
                this.cacheStorage.setItem(PersistentCacheKeys.CLIENT_INFO, hashParams.client_info);
            }

            // Create response object
            const response: CodeResponse = {
                code: hashParams.code,
                userRequestState: hashParams.state
            };

            return response;
        } catch(e) {
            this.cacheManager.resetTempCacheItems(hashParams && hashParams.state);
            throw e;
        }
    }

    private saveToken(originalTokenResponse: TokenResponse, authority: string, resource: string, serverTokenResponse: ServerAuthorizationTokenResponse, clientInfo: ClientInfo): TokenResponse {
        // Set consented scopes in response
        const responseScopes = ScopeSet.fromString(serverTokenResponse.scope, this.clientId, true);
        const responseScopeArray = responseScopes.asArray();

        // Expiration calculation
        const expiresIn = TimeUtils.parseExpiresInSeconds(serverTokenResponse.expires_in);
        const expirationSec = TimeUtils.now() + expiresIn;
        const extendedExpirationSec = expirationSec + TimeUtils.parseExpiresInSeconds(serverTokenResponse.ext_expires_in);

        // Get id token
        if (!StringUtils.isEmpty(originalTokenResponse.idToken)) {
            this.cacheStorage.setItem(PersistentCacheKeys.ID_TOKEN, originalTokenResponse.idToken);
        }

        // Save access token in cache
        const newAccessTokenValue = new AccessTokenValue(serverTokenResponse.token_type, serverTokenResponse.access_token, originalTokenResponse.idToken, serverTokenResponse.refresh_token, expirationSec.toString(), extendedExpirationSec.toString());
        const homeAccountIdentifier = originalTokenResponse.account && originalTokenResponse.account.homeAccountIdentifier;
        const accessTokenCacheItems = this.cacheManager.getAllAccessTokens(this.clientId, authority || "", resource || "", homeAccountIdentifier || "");
        if (accessTokenCacheItems.length < 1) {
            const newTokenKey = new AccessTokenKey(
                authority, 
                this.clientId, 
                serverTokenResponse.scope, 
                resource, 
                clientInfo && clientInfo.uid, 
                clientInfo && clientInfo.utid, 
                this.cryptoObj
            );
            this.cacheStorage.setItem(JSON.stringify(newTokenKey), JSON.stringify(newAccessTokenValue));
        } else {
            accessTokenCacheItems.forEach(accessTokenCacheItem => {
                const cachedScopes = ScopeSet.fromString(accessTokenCacheItem.key.scopes, this.clientId, true);
                if(cachedScopes.intersectingScopeSets(responseScopes)) {
                    this.cacheStorage.removeItem(JSON.stringify(accessTokenCacheItem.key));
                    cachedScopes.appendScopes(responseScopeArray);
                    accessTokenCacheItem.key.scopes = cachedScopes.printScopes();
                    if (StringUtils.isEmpty(newAccessTokenValue.idToken)) {
                        newAccessTokenValue.idToken = accessTokenCacheItem.value.idToken;
                    }
                    this.cacheStorage.setItem(JSON.stringify(accessTokenCacheItem.key), JSON.stringify(newAccessTokenValue));
                }
            });
        }

        // Save tokens in cache
        return {
            ...originalTokenResponse,
            scopes: responseScopeArray,
            accessToken: serverTokenResponse.access_token,
            refreshToken: serverTokenResponse.refresh_token,
            expiresOn: new Date(expirationSec * 1000)
        };
    }

    private getCachedAccount(accountKey: string): Account {
        try {
            return JSON.parse(this.cacheStorage.getItem(accountKey)) as Account;
        } catch (e) {
            return null;
        }
    }

    public createTokenResponse(serverTokenResponse: ServerAuthorizationTokenResponse, authorityString: string, resource: string, state?: string): TokenResponse {
        let tokenResponse: TokenResponse = {
            uniqueId: "",
            tenantId: "",
            tokenType: "",
            idToken: null,
            idTokenClaims: null,
            accessToken: "",
            refreshToken: "",
            scopes: [],
            expiresOn: null,
            account: null,
            userRequestState: ""
        };

        // Retrieve current id token object
        let idTokenObj: IdToken;
        const cachedIdToken: string = this.cacheStorage.getItem(PersistentCacheKeys.ID_TOKEN);
        if (serverTokenResponse.id_token) {
            idTokenObj = new IdToken(serverTokenResponse.id_token, this.cryptoObj);
            tokenResponse = ResponseHandler.setResponseIdToken(tokenResponse, idTokenObj);
        } else if (cachedIdToken) {
            idTokenObj = new IdToken(cachedIdToken, this.cryptoObj);
            tokenResponse = ResponseHandler.setResponseIdToken(tokenResponse, idTokenObj);
        } else {
            idTokenObj = null;
        }

        let clientInfo: ClientInfo = null;
        let cachedAccount: Account = null;
        if (idTokenObj) {
            // If state is empty, refresh token is being used
            if (!StringUtils.isEmpty(state)) {
                // check nonce integrity if refresh token is not used - throw an error if not matched        
                if (!idTokenObj.claims.nonce) {
                    throw ClientAuthError.createInvalidIdTokenError(idTokenObj);
                }

                const nonce = this.cacheStorage.getItem(this.cacheManager.generateNonceKey(state));
                if (idTokenObj.claims.nonce !== nonce) {
                    throw ClientAuthError.createNonceMismatchError();
                }
            }

            // Retrieve client info
            clientInfo = buildClientInfo(this.cacheStorage.getItem(PersistentCacheKeys.CLIENT_INFO), this.cryptoObj);

            // Create account object for request
            tokenResponse.account = Account.createAccount(idTokenObj, clientInfo, this.cryptoObj);

            // Save the access token if it exists
            const accountKey = this.cacheManager.generateAcquireTokenAccountKey(tokenResponse.account.homeAccountIdentifier);
            
            // Get cached account
            cachedAccount = this.getCachedAccount(accountKey);
        }

        // Return user set state in the response
        tokenResponse.userRequestState = ProtocolUtils.getUserRequestState(state);

        this.cacheManager.resetTempCacheItems(state);
        if (!cachedAccount || !tokenResponse.account || Account.compareAccounts(cachedAccount, tokenResponse.account)) {
            return this.saveToken(tokenResponse, authorityString, resource, serverTokenResponse, clientInfo);
        } else {
            throw ClientAuthError.createAccountMismatchError();
        }
    }
}
