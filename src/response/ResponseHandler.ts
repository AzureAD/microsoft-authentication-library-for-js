/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { IdToken } from "../account/IdToken";
import { CacheHelpers } from "../cache/CacheHelpers";
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { ScopeSet } from "../request/ScopeSet";
import { buildClientInfo, ClientInfo } from "../account/ClientInfo";
import { Account } from "../account/Account";
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
import { ServerAuthorizationCodeResponse } from "../server/ServerAuthorizationCodeResponse";
import { CodeResponse } from "./CodeResponse";
import { Logger } from "../logger/Logger";
import { ServerError } from "../error/ServerError";
import { InteractionRequiredAuthError } from "../error/InteractionRequiredAuthError";

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

    /**
     * Returns a new response with the data from original response filled with the relevant IdToken data.
     * - raw id token
     * - id token claims
     * - unique id (oid or sub claim of token)
     * - tenant id (tid claim of token)
     * @param originalResponse
     * @param idTokenObj
     */
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

    /**
     * Validates and handles a response from the server, and returns a constructed object with the authorization code and state.
     * @param serverParams
     */
    public handleServerCodeResponse(serverParams: ServerAuthorizationCodeResponse): CodeResponse {
        try {
            // Validate hash fragment response parameters
            this.validateServerAuthorizationCodeResponse(serverParams, this.cacheStorage.getItem(TemporaryCacheKeys.REQUEST_STATE), this.cryptoObj);

            // Cache client info
            if (serverParams.client_info) {
                this.cacheStorage.setItem(PersistentCacheKeys.CLIENT_INFO, serverParams.client_info);
            }

            // Create response object
            const response: CodeResponse = {
                code: serverParams.code,
                userRequestState: serverParams.state
            };

            return response;
        } catch(e) {
            this.cacheManager.resetTempCacheItems(serverParams && serverParams.state);
            throw e;
        }
    }

    /**
     * Function which validates server authorization code response.
     * @param serverResponseHash
     * @param cachedState
     * @param cryptoObj
     */
    private validateServerAuthorizationCodeResponse(serverResponseHash: ServerAuthorizationCodeResponse, cachedState: string, cryptoObj: ICrypto): void {
        if (serverResponseHash.state !== cachedState) {
            throw ClientAuthError.createStateMismatchError();
        }

        // Check for error
        if (serverResponseHash.error || serverResponseHash.error_description) {
            if (InteractionRequiredAuthError.isInteractionRequiredError(serverResponseHash.error, serverResponseHash.error_description)) {
                throw new InteractionRequiredAuthError(serverResponseHash.error, serverResponseHash.error_description);
            }

            throw new ServerError(serverResponseHash.error, serverResponseHash.error_description);
        }

        if (serverResponseHash.client_info) {
            buildClientInfo(serverResponseHash.client_info, cryptoObj);
        }
    }

    /**
     * Function which validates server authorization token response.
     * @param serverResponse
     */
    public validateServerAuthorizationTokenResponse(serverResponse: ServerAuthorizationTokenResponse): void {
        // Check for error
        if (serverResponse.error || serverResponse.error_description) {
            const errString = `${serverResponse.error_codes} - [${serverResponse.timestamp}]: ${serverResponse.error_description} - Correlation ID: ${serverResponse.correlation_id} - Trace ID: ${serverResponse.trace_id}`;
            throw new ServerError(serverResponse.error, errString);
        }
    }

    /**
     * Helper function which saves or updates the token in the cache and constructs the final token response to send back to the user.
     * @param originalTokenResponse
     * @param authority
     * @param resource
     * @param serverTokenResponse
     * @param clientInfo
     */
    private saveToken(originalTokenResponse: TokenResponse, authority: string, resource: string, serverTokenResponse: ServerAuthorizationTokenResponse, clientInfo: ClientInfo): TokenResponse {
        // Set consented scopes in response
        const responseScopes = ScopeSet.fromString(serverTokenResponse.scope, this.clientId, true);
        const responseScopeArray = responseScopes.asArray();

        // Expiration calculation
        const expiresIn = serverTokenResponse.expires_in;
        const expirationSec = TimeUtils.nowSeconds() + expiresIn;
        const extendedExpirationSec = expirationSec + serverTokenResponse.ext_expires_in;

        // Get id token
        if (!StringUtils.isEmpty(originalTokenResponse.idToken)) {
            this.cacheStorage.setItem(PersistentCacheKeys.ID_TOKEN, originalTokenResponse.idToken);
        }

        // Save access token in cache
        const newAccessTokenValue = new AccessTokenValue(serverTokenResponse.token_type, serverTokenResponse.access_token, originalTokenResponse.idToken, serverTokenResponse.refresh_token, expirationSec.toString(), extendedExpirationSec.toString());
        const homeAccountIdentifier = originalTokenResponse.account && originalTokenResponse.account.homeAccountIdentifier;
        const accessTokenCacheItems = this.cacheManager.getAllAccessTokens(this.clientId, authority || "", resource || "", homeAccountIdentifier || "");

        // If no items in cache with these parameters, set new item.
        if (accessTokenCacheItems.length < 1) {
            this.logger.info("No tokens found, creating new item.");
        } else {
            // Check if scopes are intersecting. If they are, combine scopes and replace cache item.
            accessTokenCacheItems.forEach(accessTokenCacheItem => {
                const cachedScopes = ScopeSet.fromString(accessTokenCacheItem.key.scopes, this.clientId, true);
                if(cachedScopes.intersectingScopeSets(responseScopes)) {
                    this.cacheStorage.removeItem(JSON.stringify(accessTokenCacheItem.key));
                    responseScopes.appendScopes(cachedScopes.asArray());
                    if (StringUtils.isEmpty(newAccessTokenValue.idToken)) {
                        newAccessTokenValue.idToken = accessTokenCacheItem.value.idToken;
                    }
                }
            });
        }

        const newTokenKey = new AccessTokenKey(
            authority, 
            this.clientId, 
            responseScopes.printScopes(), 
            resource, 
            clientInfo && clientInfo.uid, 
            clientInfo && clientInfo.utid, 
            this.cryptoObj
        );
        this.cacheStorage.setItem(JSON.stringify(newTokenKey), JSON.stringify(newAccessTokenValue));

        // Save tokens in response and return
        return {
            ...originalTokenResponse,
            tokenType: serverTokenResponse.token_type,
            scopes: responseScopeArray,
            accessToken: serverTokenResponse.access_token,
            refreshToken: serverTokenResponse.refresh_token,
            expiresOn: new Date(expirationSec * 1000)
        };
    }

    /**
     * Gets account cached with given key. Returns null if parsing could not be completed.
     * @param accountKey
     */
    private getCachedAccount(accountKey: string): Account {
        try {
            return JSON.parse(this.cacheStorage.getItem(accountKey)) as Account;
        } catch (e) {
            this.logger.warning(`Account could not be parsed: ${JSON.stringify(e)}`);
            return null;
        }
    }

    /**
     * Returns a constructed token response based on given string. Also manages the cache updates and cleanups.
     * @param serverTokenResponse
     * @param authorityString
     * @param resource
     * @param state
     */
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

            // If state is empty, refresh token is being used
            if (!StringUtils.isEmpty(state)) {
                this.logger.info("State was detected - nonce should be available.");
                // check nonce integrity if refresh token is not used - throw an error if not matched
                if (StringUtils.isEmpty(idTokenObj.claims.nonce)) {
                    throw ClientAuthError.createInvalidIdTokenError(idTokenObj);
                }

                const nonce = this.cacheStorage.getItem(this.cacheManager.generateNonceKey(state));
                if (idTokenObj.claims.nonce !== nonce) {
                    throw ClientAuthError.createNonceMismatchError();
                }
            }
        } else if (cachedIdToken) {
            idTokenObj = new IdToken(cachedIdToken, this.cryptoObj);
            tokenResponse = ResponseHandler.setResponseIdToken(tokenResponse, idTokenObj);
        } else {
            idTokenObj = null;
        }

        let clientInfo: ClientInfo = null;
        let cachedAccount: Account = null;
        if (idTokenObj) {
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
            this.logger.error("Accounts do not match.");
            this.logger.errorPii(`Cached Account: ${JSON.stringify(cachedAccount)}, New Account: ${JSON.stringify(tokenResponse.account)}`);
            throw ClientAuthError.createAccountMismatchError();
        }
    }
}
