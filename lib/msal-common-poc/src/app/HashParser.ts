// App
import { ICacheStorage } from "../cache/ICacheStorage";
import { ResponseStateInfo } from "./ImplicitAuthModule";
// Auth
import { UrlString } from "../url/UrlString";
import { IdToken } from "../auth/IdToken";
import { ClientInfo } from "../auth/ClientInfo";
import { Account } from "../auth/Account";
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

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export class HashParser {

    private cacheStorage: ICacheStorage;
    private account: Account;

    constructor(accountObj: Account, cacheStorageImpl: ICacheStorage) {
        this.cacheStorage = cacheStorageImpl;
        this.account = accountObj;
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

    private parseSuccessfulAuthResponseFromHash(hashParams: any, responseState: ResponseStateInfo): AuthResponse {
        let response : AuthResponse = {
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

            // Process id_token
            if (hashParams.hasOwnProperty(ServerHashParamKeys.ID_TOKEN)) {
                this.parseIdTokenFromHash(hashParams, response, responseState);
            }

            // Process access_token
            if (hashParams.hasOwnProperty(ServerHashParamKeys.ACCESS_TOKEN)) {
                this.parseAccessTokenFromHash(hashParams, response, responseState);
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

    private parseIdTokenFromHash(hashParams: any, response: AuthResponse, responseState: ResponseStateInfo): AuthResponse {
        // this.logger.info("Fragment has id token");
        let clientInfo: string;
        
        // set the idToken
        let idTokenObj = new IdToken(hashParams[ServerHashParamKeys.ID_TOKEN]);

        response = this.setResponseIdToken(response, idTokenObj);
        if (!hashParams.hasOwnProperty(ServerHashParamKeys.CLIENT_INFO)) {
            // this.logger.warning("ClientInfo not received in the response from AAD");
            throw ClientAuthError.createClientInfoNotPopulatedError("ClientInfo not received in the response from the server");
        }

        // set authority
        const authority: string = this.populateAuthority(responseState.state, idTokenObj);

        this.account = Account.createAccount(idTokenObj, new ClientInfo(hashParams[ServerHashParamKeys.CLIENT_INFO]));
        response.account = this.account;

        if (idTokenObj && idTokenObj.nonce) {
            // check nonce integrity if idToken has nonce - throw an error if not matched
            if (idTokenObj.nonce !== this.cacheStorage.getItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${responseState.state}`)) {
                this.account = null;
                // this.logger.error("Nonce Mismatch.Expected Nonce: " + this.cacheStorage.getItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${stateInfo.state}`, this.inCookie) + "," + "Actual Nonce: " + idTokenObj.nonce);
                throw ClientAuthError.createNonceMismatchError(this.cacheStorage.getItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${responseState.state}`), idTokenObj.nonce);
            }
            // Save the token
            else {
                this.cacheStorage.setItem(PersistentCacheKeys.IDTOKEN, hashParams[ServerHashParamKeys.ID_TOKEN]);
                this.cacheStorage.setItem(PersistentCacheKeys.CLIENT_INFO, clientInfo);

                // Save idToken as access token for app itself
                this.saveAccessToken(response, authority, hashParams, clientInfo, idTokenObj);
            }
        } else {
            // this.logger.error("Invalid id_token received in the response");
            throw ClientAuthError.createInvalidIdTokenError(idTokenObj);
        }
        return response;
    }

    private parseAccessTokenFromHash(hashParams: any, response: AuthResponse, responseState: ResponseStateInfo): AuthResponse {
        // this.logger.info("Fragment has access token");
        let clientInfo: string;
        
        // set the idToken
        let idTokenObj = new IdToken(hashParams[ServerHashParamKeys.ID_TOKEN]);

        response = this.setResponseIdToken(response, idTokenObj);
        if (!hashParams.hasOwnProperty(ServerHashParamKeys.CLIENT_INFO)) {
            // this.logger.warning("ClientInfo not received in the response from AAD");
            throw ClientAuthError.createClientInfoNotPopulatedError("ClientInfo not received in the response from the server");
        }

        // set authority
        const authority: string = this.populateAuthority(responseState.state, idTokenObj);

        this.account = Account.createAccount(idTokenObj, new ClientInfo(hashParams[ServerHashParamKeys.CLIENT_INFO]));
        response.account = this.account;

        let accountKey: string;
        if (response.account && !StringUtils.isEmpty(response.account.homeAccountIdentifier)) {
            accountKey = response.account.homeAccountIdentifier;
        }
        else {
            accountKey = Constants.NO_ACCOUNT;
        }

        const acquireTokenAccountKey = CacheUtils.generateAcquireTokenAccountKey(accountKey, responseState.state);
        const acquireTokenAccountKey_noaccount = CacheUtils.generateAcquireTokenAccountKey(Constants.NO_ACCOUNT, responseState.state);

        const cachedAccount: string = this.cacheStorage.getItem(acquireTokenAccountKey);
        let acquireTokenAccount: Account;

        // Check with the account in the Cache
        if (!StringUtils.isEmpty(cachedAccount)) {
            acquireTokenAccount = JSON.parse(cachedAccount);
            if (response.account && acquireTokenAccount && Account.compareAccounts(response.account, acquireTokenAccount)) {
                response = this.saveAccessToken(response, authority, hashParams, hashParams[ServerHashParamKeys.CLIENT_INFO], idTokenObj);
                // this.logger.info("The user object received in the response is the same as the one passed in the acquireToken request");
            }
            else {
                // this.logger.warning("The account object created from the response is not the same as the one passed in the acquireToken request");
            }
        }
        else if (!StringUtils.isEmpty(this.cacheStorage.getItem(acquireTokenAccountKey_noaccount))) {
            response = this.saveAccessToken(response, authority, hashParams, hashParams[ServerHashParamKeys.CLIENT_INFO], idTokenObj);
        }
        return response;
    }

    parseResponseFromHash(hashString: UrlString, responseState: ResponseStateInfo): AuthResponse {
        // this.logger.info("State status:" + stateInfo.stateMatch + "; Request type:" + stateInfo.requestType);
        let error: AuthError;
        let response: AuthResponse;
        const hashParams = hashString.getDeserializedHash();

        // If server returns an error
        if (hashParams.hasOwnProperty(ServerHashParamKeys.ERROR_DESCRIPTION) || hashParams.hasOwnProperty(ServerHashParamKeys.ERROR)) {
            error = this.parseErrorInHash(hashParams[ServerHashParamKeys.ERROR], hashParams[ServerHashParamKeys.ERROR_DESCRIPTION], responseState);
        }
        // If the server returns "Success"
        else {
            try {
                response = this.parseSuccessfulAuthResponseFromHash(hashParams, responseState);
            } catch (authErr) {
                error = authErr;
            }
        }

        // Set status to completed
        this.cacheStorage.removeItem(TemporaryCacheKeys.INTERACTION_STATUS);
        this.cacheStorage.removeItem(TemporaryCacheKeys.RENEW_STATUS + responseState.state);
        CacheUtils.removeAcquireTokenEntries(this.cacheStorage, responseState.state);

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
     * @param {Account} account account object for which scopes are consented for. The default account is the logged in account.
     * @param {ClientInfo} clientInfo clientInfo received as part of the response comprising of fields uid and utid.
     * @param {IdToken} idToken idToken received as part of the response.
     * @ignore
     * @private
     */
    /* tslint:disable:no-string-literal */
    private saveAccessToken(response: AuthResponse, authority: string, parameters: any, clientInfo: string, idTokenObj: IdToken): AuthResponse {
        let scope: string;
        const accessTokenResponse = { ...response };
        const clientObj: ClientInfo = new ClientInfo(clientInfo);
        let expiration: number;

        // if the response contains "scope"
        if (parameters.hasOwnProperty(ServerHashParamKeys.SCOPE)) {

        }
        // if the response does not contain "scope" - scope is usually client_id and the token will be id_token
        else {

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

    private setResponseIdToken(originalResponse: AuthResponse, idTokenObj: IdToken) : AuthResponse {
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
