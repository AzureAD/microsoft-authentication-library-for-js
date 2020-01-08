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
import { PersistentCacheKeys } from "../utils/Constants";
import { ClientAuthError } from "../error/ClientAuthError";
import { TimeUtils } from "../utils/TimeUtils";
import { AccessTokenKey } from "../cache/AccessTokenKey";
import { AccessTokenValue } from "../cache/AccessTokenValue";

/**
 * Class that handles response parsing.
 */
export class ResponseHandler {
    private clientId: string;
    private cacheStorage: ICacheStorage;
    private cacheManager: CacheHelpers;
    private cryptoObj: ICrypto;

    constructor(clientId: string, cacheStorage: ICacheStorage, cacheManager: CacheHelpers, cryptoObj: ICrypto) {
        this.clientId = clientId;
        this.cacheStorage = cacheStorage;
        this.cacheManager = cacheManager;
        this.cryptoObj = cryptoObj;
    }

    public setResponseIdToken(originalResponse: TokenResponse, idTokenObj: IdToken) : TokenResponse {
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

    private saveToken(originalTokenResponse: TokenResponse, authority: string, serverTokenResponse: ServerAuthorizationTokenResponse, clientInfo: ClientInfo): TokenResponse {
        const tokenResponse = { ...originalTokenResponse };
        // Set consented scopes in response
        const requestScopes = ScopeSet.fromString(serverTokenResponse.scope, this.clientId, false);
        tokenResponse.scopes = requestScopes.asArray();

        const accessTokenCacheItems = this.cacheManager.getAllAccessTokens(this.clientId, authority);

        for (let i = 0; i < accessTokenCacheItems.length; i++) {
            const accessTokenCacheItem = accessTokenCacheItems[i];
            if (accessTokenCacheItem.key.homeAccountIdentifier === tokenResponse.account.homeAccountIdentifier) {
                const cachedScopes = ScopeSet.fromString(accessTokenCacheItem.key.scopes, this.clientId, false);

                if(cachedScopes.intersectingScopeSets(tokenResponse.scopes)) {
                    this.cacheStorage.removeItem(JSON.stringify(accessTokenCacheItem.key));
                }
            }
        }

        // Expiration calculation
        const expiresIn = TimeUtils.parseExpiresIn(serverTokenResponse.expires_in);
        const expiration = TimeUtils.now() + expiresIn;

        // Save access token in cache
        const accessTokenKey = new AccessTokenKey(authority, this.clientId, serverTokenResponse.scope, clientInfo.uid, clientInfo.utid, this.cryptoObj);
        const accessTokenValue = new AccessTokenValue(serverTokenResponse.access_token, serverTokenResponse.id_token, serverTokenResponse.refresh_token, expiresIn.toString(), tokenResponse.account.homeAccountIdentifier);
        this.cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

        // Save tokens in cache
        tokenResponse.accessToken = serverTokenResponse.access_token;
        tokenResponse.idToken = serverTokenResponse.id_token;
        tokenResponse.refreshToken = serverTokenResponse.refresh_token;
        tokenResponse.expiresOn = new Date(expiration * 1000);
        return tokenResponse;
    }

    private getCachedAccount(accountKey: string): Account {
        try {
            return JSON.parse(this.cacheStorage.getItem(accountKey)) as Account;
        } catch (e) {
            return null;
        }
    }
    
    public createTokenResponse(serverTokenResponse: ServerAuthorizationTokenResponse, state: string): TokenResponse {
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
            tokenResponse = this.setResponseIdToken(tokenResponse, idTokenObj);
        } else if (cachedIdToken) {
            idTokenObj = new IdToken(cachedIdToken, this.cryptoObj);
            tokenResponse = this.setResponseIdToken(tokenResponse, idTokenObj);
        } else {
            idTokenObj = null;
        }
    
        // check nonce integrity if idToken has nonce - throw an error if not matched
        const nonce = this.cacheStorage.getItem(this.cacheManager.generateNonceKey(state));
    
        if (!idTokenObj || !idTokenObj.claims.nonce) {
            throw ClientAuthError.createInvalidIdTokenError(idTokenObj);
        }
    
        if (idTokenObj.claims.nonce !== nonce) {
            throw ClientAuthError.createNonceMismatchError();
        }

        this.cacheStorage.setItem(PersistentCacheKeys.ID_TOKEN, idTokenObj.rawIdToken);

        const authorityKey: string = this.cacheManager.generateAuthorityKey(state);
        const cachedAuthority: string = this.cacheStorage.getItem(authorityKey);

        // Retrieve client info
        const clientInfo = buildClientInfo(this.cacheStorage.getItem(PersistentCacheKeys.CLIENT_INFO), this.cryptoObj);

        // Create account object for request
        tokenResponse.account = Account.createAccount(idTokenObj, clientInfo, this.cryptoObj);

        // Set token type
        tokenResponse.tokenType = serverTokenResponse.token_type;

        // Save the access token if it exists
        const accountKey = this.cacheManager.generateAcquireTokenAccountKey(tokenResponse.account.homeAccountIdentifier);
        const cachedAccount = this.getCachedAccount(accountKey);
        if (!cachedAccount || Account.compareAccounts(cachedAccount, tokenResponse.account)) {
            this.saveToken(tokenResponse, cachedAuthority, serverTokenResponse, clientInfo);
        } else if (cachedAccount) {
            throw ClientAuthError.createAccountMismatchError();
        }

        // Return user set state in the response
        tokenResponse.userRequestState = ProtocolUtils.getUserRequestState(state);
        
        this.cacheManager.resetTempCacheItems(state);
        return tokenResponse;
    }
}
