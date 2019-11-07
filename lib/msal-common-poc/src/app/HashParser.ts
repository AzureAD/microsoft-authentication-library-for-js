// App
import { ICacheStorage } from "../cache/ICacheStorage";
import { ResponseStateInfo } from "./module/ImplicitAuthModule";
// Auth
import { UrlString } from "../url/UrlString";
import { IdToken } from "../auth/IdToken";
import { ClientInfo } from "../auth/ClientInfo";
import { MsalAccount } from "../auth/MsalAccount";
// Utils
import { StringUtils } from "../utils/StringUtils";
import { ServerHashParamKeys, PersistentCacheKeys, Constants, TemporaryCacheKeys } from "../utils/Constants";
// Response
import { AuthResponse } from "../response/AuthResponse";
// Error
import { InteractionRequiredAuthError } from "../error/InteractionRequiredAuthError";
import { AuthError } from "../error/AuthError";
import { ServerError } from "../error/ServerError";
import { ClientAuthError } from "../error/ClientAuthError";
import { CacheUtils } from "../utils/CacheUtils";
import { ScopeSet } from "../auth/ScopeSet";
import { TimeUtils } from "../utils/TimeUtils";
import { AccessTokenKey } from "../cache/AccessTokenKey";
import { AccessTokenValue } from "../cache/AccessTokenValue";
import { ICrypto } from "../utils/crypto/ICrypto";
import { TokenResponse } from "../response/TokenResponse";
import { CodeResponse } from "../response/CodeResponse";

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export class HashParser {

    private cacheStorage: ICacheStorage;
    private account: MsalAccount;
    private clientId: string;
    private crypto: ICrypto;

    constructor(accountObj: MsalAccount, clientId: string, cacheStorageImpl: ICacheStorage, crypto: ICrypto) {
        this.cacheStorage = cacheStorageImpl;
        this.account = accountObj;
        this.clientId = clientId;
        this.crypto = crypto;
    }

    private parseErrorInHash(errCode: string, errDesc: string): AuthError {
        let error;

        // this.logger.infoPii("Error :" + hashParams[ServerHashParamKeys.ERROR] + "; Error description:" + hashParams[ServerHashParamKeys.ERROR_DESCRIPTION]);
        this.cacheStorage.setItem(PersistentCacheKeys.ERROR, errCode);
        this.cacheStorage.setItem(PersistentCacheKeys.ERROR_DESC, errDesc);

        if (InteractionRequiredAuthError.isInteractionRequiredError(errCode) ||
            InteractionRequiredAuthError.isInteractionRequiredError(errDesc)) {
            error = new InteractionRequiredAuthError(errCode, errDesc);
        } else {
            error = new ServerError(errCode, errDesc);
        }

        return error;
    }

    private parseSuccessfulAuthResponseFromHash(hashParams: any, responseState: ResponseStateInfo): TokenResponse {
        let response : TokenResponse = {
            uniqueId: "",
            tenantId: "",
            tokenType: "",
            idToken: null,
            idTokenClaims: null,
            accessToken: null,
            scopes: [],
            expiresOn: null,
            account: null,
            state: "",
        };

        // Verify the state from redirect and record tokens to storage if exists
        if (responseState.stateMatch) {
            // this.logger.info("State is right");
            if (hashParams.hasOwnProperty(ServerHashParamKeys.SESSION_STATE)) {
                this.cacheStorage.setItem(TemporaryCacheKeys.SESSION_STATE, hashParams[ServerHashParamKeys.SESSION_STATE]);
            }
            response.state = StringUtils.extractUserGivenState(responseState.state);

            // Process code
            if (hashParams.hasOwnProperty(ServerHashParamKeys.CODE)) {
                
            } 
            // Process tokens
            else {
                // Process id_token
                if (hashParams.hasOwnProperty(ServerHashParamKeys.ID_TOKEN)) {
                    response = this.parseIdTokenFromHash(hashParams, response, responseState);
                }

                // Process access_token
                if (hashParams.hasOwnProperty(ServerHashParamKeys.ACCESS_TOKEN)) {
                    response = this.parseAccessTokenFromHash(hashParams, response, responseState);
                }
            }
        }
        // State mismatch - unexpected/invalid state
        else {
            const expectedState = this.cacheStorage.getItem(TemporaryCacheKeys.REQUEST_STATE);
            // this.logger.error("State Mismatch.Expected State: " + expectedState + "," + "Actual State: " + responseState.state);
            throw ClientAuthError.createInvalidStateError(responseState.state, expectedState);
        }

        return response;
    }

    private parseAuthCodeFromHash(hashParams: any, responseState: ResponseStateInfo): CodeResponse {
        let authResponse: CodeResponse = {
            code: "",
            state: ""
        };

        authResponse.code = hashParams[ServerHashParamKeys.CODE];
        authResponse.state = responseState.state;

        return authResponse;
    }

    private parseIdTokenFromHash(hashParams: any, response: TokenResponse, responseState: ResponseStateInfo): TokenResponse {
        // this.logger.info("Fragment has id token");
        let authResponse = { ...response };

        // set the idToken
        const idTokenObj = new IdToken(hashParams[ServerHashParamKeys.ID_TOKEN], this.crypto);
        const clientInfo: string = hashParams[ServerHashParamKeys.CLIENT_INFO];

        authResponse = this.setResponseIdToken(authResponse, idTokenObj);
        if (!hashParams.hasOwnProperty(ServerHashParamKeys.CLIENT_INFO)) {
            // this.logger.warning("ClientInfo not received in the response from AAD");
            throw ClientAuthError.createClientInfoNotPopulatedError("ClientInfo not received in the response from the server");
        }

        // set authority
        const authority: string = this.populateAuthority(responseState.state, idTokenObj);
        const encodedClientInfo = new ClientInfo(clientInfo, this.crypto);
        this.account = MsalAccount.createAccount(idTokenObj, encodedClientInfo, this.crypto);
        authResponse.account = this.account;

        if (idTokenObj && idTokenObj.nonce) {
            // check nonce integrity if idToken has nonce - throw an error if not matched
            if (idTokenObj.nonce !== this.cacheStorage.getItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${responseState.state}`)) {
                this.account = null;
                // this.logger.error("Nonce Mismatch.Expected Nonce: " + this.cacheStorage.getItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${stateInfo.state}`, this.inCookie) + "," + "Actual Nonce: " + idTokenObj.nonce);
                throw ClientAuthError.createNonceMismatchError(this.cacheStorage.getItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${responseState.state}`), idTokenObj.nonce);
            }
            // Save the token
            else {
                this.cacheStorage.setItem(PersistentCacheKeys.ID_TOKEN, hashParams[ServerHashParamKeys.ID_TOKEN]);
                this.cacheStorage.setItem(PersistentCacheKeys.CLIENT_INFO, clientInfo);

                // Save idToken as access token for app itself
                this.saveToken(authResponse, authority, hashParams, clientInfo, idTokenObj);
            }
        } else {
            // this.logger.error("Invalid id_token received in the response");
            throw ClientAuthError.createInvalidIdTokenError(idTokenObj);
        }
        return authResponse;
    }

    private parseAccessTokenFromHash(hashParams: any, response: TokenResponse, responseState: ResponseStateInfo): TokenResponse {
        // this.logger.info("Fragment has access token");
        let authResponse = { ...response };

        // set the idToken
        const idTokenStr = authResponse.idToken ? authResponse.idToken : this.cacheStorage.getItem(PersistentCacheKeys.ID_TOKEN);
        const idTokenObj = new IdToken(idTokenStr, this.crypto);

        authResponse = this.setResponseIdToken(authResponse, idTokenObj);
        if (!hashParams.hasOwnProperty(ServerHashParamKeys.CLIENT_INFO)) {
            // this.logger.warning("ClientInfo not received in the response from AAD");
            throw ClientAuthError.createClientInfoNotPopulatedError("ClientInfo not received in the response from the server");
        }

        // set authority
        const authority: string = this.populateAuthority(responseState.state, idTokenObj);
        const encodedClientInfo = new ClientInfo(hashParams[ServerHashParamKeys.CLIENT_INFO], this.crypto);
        this.account = MsalAccount.createAccount(idTokenObj, encodedClientInfo, this.crypto);
        authResponse.account = this.account;

        let accountKey: string;
        if (authResponse.account && !StringUtils.isEmpty(authResponse.account.homeAccountIdentifier)) {
            accountKey = authResponse.account.homeAccountIdentifier;
        }
        else {
            accountKey = Constants.NO_ACCOUNT;
        }

        const acquireTokenAccountKey = CacheUtils.generateAcquireTokenAccountKey(accountKey, responseState.state);
        const acquireTokenAccountKey_noaccount = CacheUtils.generateAcquireTokenAccountKey(Constants.NO_ACCOUNT, responseState.state);

        const cachedAccount: string = this.cacheStorage.getItem(acquireTokenAccountKey);
        let acquireTokenAccount: MsalAccount;

        // Check with the account in the Cache
        if (!StringUtils.isEmpty(cachedAccount)) {
            acquireTokenAccount = JSON.parse(cachedAccount);
            if (authResponse.account && acquireTokenAccount && MsalAccount.compareAccounts(authResponse.account, acquireTokenAccount)) {
                authResponse = this.saveToken(authResponse, authority, hashParams, hashParams[ServerHashParamKeys.CLIENT_INFO], idTokenObj);
                // this.logger.info("The user object received in the response is the same as the one passed in the acquireToken request");
            }
            else {
                // this.logger.warning("The account object created from the response is not the same as the one passed in the acquireToken request");
            }
        }
        else if (!StringUtils.isEmpty(this.cacheStorage.getItem(acquireTokenAccountKey_noaccount))) {
            authResponse = this.saveToken(authResponse, authority, hashParams, hashParams[ServerHashParamKeys.CLIENT_INFO], idTokenObj);
        }
        return authResponse;
    }

    parseResponseFromHash(hashString: UrlString, responseState: ResponseStateInfo): TokenResponse {
        // this.logger.info("State status:" + stateInfo.stateMatch + "; Request type:" + stateInfo.requestType);
        let error: AuthError;
        let response: TokenResponse;
        const hashParams = hashString.getDeserializedHash();

        // If server returns an error
        if (hashParams.hasOwnProperty(ServerHashParamKeys.ERROR_DESCRIPTION) || hashParams.hasOwnProperty(ServerHashParamKeys.ERROR)) {
            error = this.parseErrorInHash(hashParams[ServerHashParamKeys.ERROR], hashParams[ServerHashParamKeys.ERROR_DESCRIPTION]);
        }
        // If the server returns "Success"
        else {
            try {
                response = this.parseSuccessfulAuthResponseFromHash(hashParams, responseState);
            } catch (authErr) {
                error = authErr;
            }
        }

        // Remove all temp cache entries for this request
        CacheUtils.removeAcquireTokenEntries(this.cacheStorage, responseState.state);

        // Return result
        if (error) {
            throw error;
        }

        if (!response) {
            throw AuthError.createUnexpectedError("Response is null");
        }

        return response;
    }

    /**
     * @hidden
     *
     * This method must be called for processing the response received from AAD. It extracts the hash, processes the token or error, saves it in the cache and calls the registered callbacks with the result.
     * @param {string} authority authority received in the redirect response from AAD.
     * @param {TokenResponse} requestInfo an object created from the redirect response from AAD comprising of the keys - parameters, requestType, stateMatch, stateResponse and valid.
     * @param {MsalAccount} account account object for which scopes are consented for. The default account is the logged in account.
     * @param {ClientInfo} clientInfo clientInfo received as part of the response comprising of fields uid and utid.
     * @param {IdToken} idToken idToken received as part of the response.
     * @ignore
     * @private
     */
    /* tslint:disable:no-string-literal */
    private saveToken(response: TokenResponse, authority: string, parameters: any, clientInfo: string, idTokenObj: IdToken): TokenResponse {
        let scope: string;
        const accessTokenResponse = { ...response };
        const clientObj: ClientInfo = new ClientInfo(clientInfo, this.crypto);
        let expiration: number;
        const accessTokenString = parameters[ServerHashParamKeys.ACCESS_TOKEN];
        const expiresInStr = parameters[ServerHashParamKeys.EXPIRES_IN];

        // if the response contains "scope"
        if (parameters.hasOwnProperty(ServerHashParamKeys.SCOPE)) {
            scope = parameters[ServerHashParamKeys.SCOPE];
            const consentedScopes = scope.split(" ");
            
            // retrieve all access tokens from the cache, remove the dupe tokens
            const accessTokenCacheItems = CacheUtils.getAllAccessTokens(this.cacheStorage, this.clientId, authority);

            for (let i = 0; i < accessTokenCacheItems.length; i++) {
                const cacheItem = accessTokenCacheItems[i];

                if (cacheItem.key.homeAccountIdentifier === response.account.homeAccountIdentifier) {
                    const cachedScopes = ScopeSet.fromString(cacheItem.key.scopes, this.clientId, false);
                    if (cachedScopes.intersectingScopeSets(consentedScopes)) {
                        this.cacheStorage.removeItem(JSON.stringify(cacheItem.key));
                    }
                }
            }

            // Generate and cache access token key and value
            expiration = TimeUtils.now() + TimeUtils.parseExpiresIn(expiresInStr);
            const accessTokenKey = new AccessTokenKey(authority, this.clientId, scope, clientObj.uid, clientObj.utid, this.crypto);
            const accessTokenValue = new AccessTokenValue(accessTokenString, idTokenObj.rawIdToken, expiration.toString(), clientInfo);

            this.cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

            accessTokenResponse.accessToken = accessTokenString;
            accessTokenResponse.scopes = consentedScopes;
        }
        // if the response does not contain "scope" - scope is usually client_id and the token will be id_token
        else {
            scope = this.clientId;

            // Generate and cache access token key and value
            const accessTokenKey = new AccessTokenKey(authority, this.clientId, scope, clientObj.uid, clientObj.utid, this.crypto);
            expiration = expiresInStr ? TimeUtils.now() + TimeUtils.parseExpiresIn(expiresInStr) : Number(idTokenObj.expiration);
            const accessTokenValue = new AccessTokenValue(parameters[ServerHashParamKeys.ID_TOKEN], parameters[ServerHashParamKeys.ID_TOKEN], expiration.toString(), clientInfo);
            this.cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            accessTokenResponse.scopes = [scope];
            accessTokenResponse.idToken = parameters[ServerHashParamKeys.ID_TOKEN];
        }

        if (expiration) {
            accessTokenResponse.expiresOn = new Date(expiration * 1000);
        } else {
            // this.logger.error("Could not parse expiresIn parameter");
        }

        return accessTokenResponse;
    }

    /**
     * Set Authority when saving Token from the hash
     * @param state
     * @param inCookie
     * @param cacheStorage
     * @param idTokenObj
     * @param response
     */
    private populateAuthority(state: string, idTokenObj: IdToken): string {
        const authorityKey: string = CacheUtils.generateAuthorityKey(state);
        const cachedAuthority: string = this.cacheStorage.getItem(authorityKey);
        const authorityString = new UrlString(cachedAuthority);

        // retrieve the authority from cache and replace with tenantID
        return StringUtils.isEmpty(cachedAuthority) ? cachedAuthority : authorityString.replaceTenantPath(idTokenObj.tenantId).getUrlString();
    }

    private setResponseIdToken(originalResponse: TokenResponse, idTokenObj: IdToken) : TokenResponse {
        if (!originalResponse) {
            return null;
        } else if (!idTokenObj) {
            return originalResponse;
        }

        const exp = Number(idTokenObj.expiration);
        if (exp && !originalResponse.expiresOn) {
            originalResponse.expiresOn = new Date(exp * 1000);
        }
    
        return {
            ...originalResponse,
            idToken: idTokenObj.rawIdToken,
            idTokenClaims: idTokenObj.claims,
            uniqueId: idTokenObj.objectId || idTokenObj.subject,
            tenantId: idTokenObj.tenantId,
        };
    }

}
