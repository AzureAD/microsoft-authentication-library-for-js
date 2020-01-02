/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { IdToken } from "../auth/IdToken";
import { CacheHelpers } from "../cache/CacheHelpers";
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { ScopeSet } from "../auth/ScopeSet";
import { buildClientInfo } from "../auth/ClientInfo";
import { Account } from "../auth/Account";
import { ProtocolUtils } from "../utils/ProtocolUtils";
import { ICrypto } from "../crypto/ICrypto";
import { ICacheStorage } from "../cache/ICacheStorage";
import { TokenResponse } from "./TokenResponse";
import { PersistentCacheKeys } from "../utils/Constants";
import { ClientAuthError } from "../error/ClientAuthError";

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
    
        const exp = Number(idTokenObj.claims.exp);
        if (exp && !originalResponse.expiresOn) {
            originalResponse.expiresOn = new Date(exp * 1000);
        }
    
        return {
            ...originalResponse,
            idToken: idTokenObj.rawIdToken,
            idTokenClaims: idTokenObj.claims,
            uniqueId: idTokenObj.claims.oid || idTokenObj.claims.sub,
            tenantId: idTokenObj.claims.tid,
        };
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
        // Set consented scopes in response
        const requestScopes = ScopeSet.fromString(serverTokenResponse.scope, this.clientId, false);
        tokenResponse.scopes = requestScopes.asArray();
    
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
            // TODO: No account scenario?
        }
    
        // check nonce integrity if idToken has nonce - throw an error if not matched
        const nonce = this.cacheStorage.getItem(this.cacheManager.generateNonceKey(state));
    
        if (!idTokenObj || !idTokenObj.claims.nonce) {
            throw ClientAuthError.createInvalidIdTokenError(idTokenObj);
        }
    
        if (idTokenObj.claims.nonce !== nonce) {
            throw ClientAuthError.createNonceMismatchError();
        }
    
        // TODO: This will be used when saving tokens
        // const authorityKey: string = this.cacheManager.generateAuthorityKey(state);
        // const cachedAuthority: string = this.cacheStorage.getItem(authorityKey);
    
        // TODO: Save id token here
        
        // Retrieve client info
        const clientInfo = buildClientInfo(this.cacheStorage.getItem(PersistentCacheKeys.CLIENT_INFO), this.cryptoObj);
    
        // Create account object for request
        tokenResponse.account = Account.createAccount(idTokenObj, clientInfo, this.cryptoObj);
    
        // Set token type
        tokenResponse.tokenType = serverTokenResponse.token_type;
    
        // Save the access token if it exists
        if (serverTokenResponse.access_token) {
            const accountKey = this.cacheManager.generateAcquireTokenAccountKey(tokenResponse.account.homeAccountIdentifier);
            
            const cachedAccount = JSON.parse(this.cacheStorage.getItem(accountKey)) as Account;
    
            if (!cachedAccount || Account.compareAccounts(cachedAccount, tokenResponse.account)) {
                tokenResponse.accessToken = serverTokenResponse.access_token;
                tokenResponse.refreshToken = serverTokenResponse.refresh_token;
                // TODO: Save the access token
            } else {
                throw ClientAuthError.createAccountMismatchError();
            }
        }
    
        // Return user set state in the response
        tokenResponse.userRequestState = ProtocolUtils.getUserRequestState(state);
        return tokenResponse;
    }
}
