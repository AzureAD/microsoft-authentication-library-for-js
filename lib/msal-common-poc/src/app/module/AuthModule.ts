/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// app
import { MsalConfiguration } from "../MsalConfiguration";
// auth
import { IdToken } from "../../auth/IdToken";
import { ClientInfo } from "../../auth/ClientInfo";
import { MsalAccount } from "../../auth/MsalAccount";
// authority
import { Authority } from "../../auth/authority/Authority";
import { AuthorityFactory } from "../../auth/authority/AuthorityFactory";
// request
import { AuthenticationParameters } from "../../request/AuthenticationParameters";
// response
import { AuthResponse } from "../../response/AuthResponse";
// cache
import { ICacheStorage } from "../../cache/ICacheStorage";
// network
import { INetworkModule } from "../INetworkModule";
// constants
import { Constants, PersistentCacheKeys, TemporaryCacheKeys } from "../../utils/Constants";
// error
import { ClientAuthError } from "../../error/ClientAuthError";
// utils
import { StringUtils } from "../../utils/StringUtils";
import { UrlString } from "../../url/UrlString";
import { AuthError } from "../../error/AuthError";
import { ICrypto } from "../../utils/crypto/ICrypto";

/**
 * @hidden
 * @ignore
 * Data type to hold information about state returned from the server
 */
export type ResponseStateInfo = {
    state: string;
    stateMatch: boolean;
};

/**
 * CodeAuthModule class
 * 
 * Object instance which will construct requests to send to and handle responses from the Microsoft STS using the authorization code flow.
 * 
 */
export abstract class AuthModule {

    // Application config
    protected config: MsalConfiguration;

    // Interface implementations
    protected cacheStorage: ICacheStorage;
    protected networkClient: INetworkModule;
    protected crypto: ICrypto;

    // Authority variables
    protected defaultAuthorityInstance: Authority;
    public get defaultAuthorityUri(): string {
        if (this.defaultAuthorityInstance) {
            return this.defaultAuthorityInstance.canonicalAuthority;
        }
        return "";
    }

    // Account fields
    protected account: MsalAccount;

    constructor(configuration: MsalConfiguration) {
        // Set the configuration
        this.config = configuration;
        
        // Initialize crypto
        this.crypto = this.config.cryptoInterface;

        // Set the cache
        this.cacheStorage = this.config.storageInterface;
        
        // Set the network interface
        this.networkClient = this.config.networkInterface;

        // Initialize authority
        this.defaultAuthorityInstance = AuthorityFactory.createInstance(this.config.auth.authority || AuthorityFactory.DEFAULT_AUTHORITY, this.networkClient);
    }

    abstract async createLoginUrl(request: AuthenticationParameters): Promise<string>;
    abstract async createAcquireTokenUrl(request: AuthenticationParameters): Promise<string>;
    abstract handleResponse(hash: string): AuthResponse;

    // #region General Helpers

    /**
     * @hidden
     * Creates a stateInfo object from the URL fragment and returns it.
     * @param {string} hash  -  Hash passed from redirect page
     * @returns {TokenResponse} an object created from the redirect response from AAD comprising of the keys - parameters, requestType, stateMatch, stateResponse and valid.
     * @ignore
     */
    extractResponseState(hash: string): ResponseStateInfo {
        const hashString = new UrlString(hash);
        const parameters = hashString.getDeserializedHash();
        let responseState: ResponseStateInfo;
        if (!parameters) {
            throw AuthError.createUnexpectedError("Hash was parsed incorrectly.");
        }
        if (parameters.hasOwnProperty("state")) {
            responseState = {
                state: parameters.state,
                stateMatch: false
            };
        } else {
            throw AuthError.createUnexpectedError("Hash does not contain state.");
        }
        
        const requestState = this.cacheStorage.getItem(TemporaryCacheKeys.REQUEST_STATE);
        if (responseState.state === requestState) {
            responseState.stateMatch = true;
        }

        return responseState;
    }

    /**
     * Returns the unique identifier for the logged in account
     * @param account
     * @hidden
     * @ignore
     */
    protected getAccountId(account: MsalAccount): any {
        // return `${account.accountIdentifier}` + Constants.resourceDelimiter + `${account.homeAccountIdentifier}`;
        let accountId: string;
        if (!StringUtils.isEmpty(account.homeAccountIdentifier)) {
            accountId = account.homeAccountIdentifier;
        }
        else {
            accountId = Constants.NO_ACCOUNT;
        }

        return accountId;
    }

    // #endregion

    // #region Getters and setters

    /**
     * Returns the signed in account
     * (the account object is created at the time of successful login)
     * or null when no state is found
     * @returns {@link Account} - the account object stored in MSAL
     */
    getAccount(): MsalAccount {
        // if a session already exists, get the account from the session
        if (this.account) {
            return this.account;
        }

        // frame is used to get idToken and populate the account for the given session
        const rawIdToken = this.cacheStorage.getItem(PersistentCacheKeys.ID_TOKEN);
        const rawClientInfo = this.cacheStorage.getItem(PersistentCacheKeys.CLIENT_INFO);

        if (!StringUtils.isEmpty(rawIdToken) && !StringUtils.isEmpty(rawClientInfo)) {
            const idToken = new IdToken(rawIdToken, this.crypto);
            const clientInfo = new ClientInfo(rawClientInfo, this.crypto);
            this.account = MsalAccount.createAccount(idToken, clientInfo, this.crypto);
            return this.account;
        }
        // if login not yet done, return null
        return null;
    }

    /**
     *
     * Use to get the redirect uri configured in MSAL or null.
     * Evaluates redirectUri if its a function, otherwise simply returns its value.
     * @returns {string} redirect URL
     *
     */
    public getRedirectUri(): string {
        if (this.config.auth.redirectUri) {
            if (typeof this.config.auth.redirectUri === "function") {
                return this.config.auth.redirectUri();
            }
            return this.config.auth.redirectUri;
        } else {
            throw ClientAuthError.createRedirectUriEmptyError();
        }
    }

    /**
     * Use to get the post logout redirect uri configured in MSAL or null.
     * Evaluates postLogoutredirectUri if its a function, otherwise simply returns its value.
     *
     * @returns {string} post logout redirect URL
     */
    public getPostLogoutRedirectUri(): string {
        if (this.config.auth.postLogoutRedirectUri) {
            if (typeof this.config.auth.postLogoutRedirectUri === "function") {
                return this.config.auth.postLogoutRedirectUri();
            }
            return this.config.auth.postLogoutRedirectUri;
        } else {
            throw ClientAuthError.createPostLogoutRedirectUriEmptyError();
        }
    }

    // #endregion

}
