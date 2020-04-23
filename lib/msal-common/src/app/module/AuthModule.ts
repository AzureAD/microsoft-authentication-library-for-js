/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ModuleConfiguration, buildModuleConfiguration } from "../config/ModuleConfiguration";
import { AuthenticationParameters } from "../../request/AuthenticationParameters";
import { TokenRenewParameters } from "../../request/TokenRenewParameters";
import { CodeResponse } from "../../response/CodeResponse";
import { TokenResponse } from "../../response/TokenResponse";
import { ICacheStorage } from "../../cache/ICacheStorage";
import { CacheHelpers } from "../../cache/CacheHelpers";
import { INetworkModule } from "../../network/INetworkModule";
import { ICrypto } from "../../crypto/ICrypto";
import { Account } from "../../auth/Account";
import { Authority } from "../../auth/authority/Authority";
import { IdToken } from "../../auth/IdToken";
import { buildClientInfo } from "../../auth/ClientInfo";
import { StringUtils } from "../../utils/StringUtils";
import { Logger } from "../../logger/Logger";
import { PersistentCacheKeys } from "../../utils/Constants";

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
 * AuthModule class
 * 
 * Parent object instance which will construct requests to send to and handle responses from the Microsoft STS using the authorization code flow.
 * 
 */
export abstract class AuthModule {

    // Logger object
    public logger: Logger;

    // Application config
    private config: ModuleConfiguration;
    
    // Crypto Interface
    protected cryptoObj: ICrypto;

    // Storage Interface
    protected cacheStorage: ICacheStorage;

    // Network Interface
    protected networkClient: INetworkModule;

    // Helper API object for running cache functions
    protected cacheManager: CacheHelpers;

    // Account object
    protected account: Account;

    // Default authority object
    protected defaultAuthorityInstance: Authority;

    constructor(configuration: ModuleConfiguration) {
        // Set the configuration
        this.config = buildModuleConfiguration(configuration);

        // Initialize the logger
        this.logger = new Logger(this.config.loggerOptions);

        // Initialize crypto
        this.cryptoObj = this.config.cryptoInterface;

        // Initialize storage interface
        this.cacheStorage = this.config.storageInterface;

        // Initialize storage helper object
        this.cacheManager = new CacheHelpers(this.cacheStorage);

        // Set the network interface
        this.networkClient = this.config.networkInterface;
    }

    // #region Abstract Functions

    /**
     * Creates a url for logging in a user. This will by default append the client id to the list of scopes, 
     * allowing you to retrieve an id token in the subsequent code exchange. Also performs validation of the request parameters.
     * Including any SSO parameters (account, sid, login_hint) will short circuit the authentication and allow you to retrieve a code without interaction.
     * @param request 
     */
    abstract async createLoginUrl(request: AuthenticationParameters): Promise<string>;

    /**
     * Creates a url for logging in a user. Also performs validation of the request parameters.
     * Including any SSO parameters (account, sid, login_hint) will short circuit the authentication and allow you to retrieve a code without interaction.
     * @param request 
     */
    abstract async createAcquireTokenUrl(request: AuthenticationParameters): Promise<string>;

    /**
     * Handles the hash fragment response from public client code request. Returns a code response used by
     * the client to exchange for a token in acquireToken.
     * @param hashFragment 
     */
    abstract handleFragmentResponse(hashFragment: string): CodeResponse;

    /**
     * Given an authorization code, it will perform a token exchange using cached values from a previous call to
     * createLoginUrl() or createAcquireTokenUrl(). You must call this AFTER using one of those APIs first. You should
     * also use the handleFragmentResponse() API to pass the codeResponse to this function afterwards.
     * @param codeResponse 
     */
    abstract async acquireToken(codeResponse: CodeResponse): Promise<TokenResponse>;

    /**
     * Retrieves a token from cache if it is still valid, or uses the cached refresh token to renew
     * the given token and returns the renewed token. Will throw an error if login is not completed (unless
     * id tokens are not being renewed).
     * @param request 
     */
    abstract async getValidToken(request: TokenRenewParameters): Promise<TokenResponse>;

    /**
     * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     * @param authorityUri 
     */
    abstract async logout(authorityUri?: string): Promise<string>;

    // #endregion
    
    // #region Getters and Setters

    /**
     * Returns the signed in account
     * (the account object is created at the time of successful login)
     * or null when no state is found
     * @returns {@link Account} - the account object stored in MSAL
     */
    getAccount(): Account {
        if (this.account) {
            return this.account;
        }

        // Get id token and client info from cache
        const rawIdToken = this.cacheStorage.getItem(PersistentCacheKeys.ID_TOKEN);
        const rawClientInfo = this.cacheStorage.getItem(PersistentCacheKeys.CLIENT_INFO);

        if(!StringUtils.isEmpty(rawIdToken) && !StringUtils.isEmpty(rawClientInfo)) {
            const idToken = new IdToken(rawIdToken, this.cryptoObj);
            const clientInfo = buildClientInfo(rawClientInfo, this.cryptoObj);

            this.account = Account.createAccount(idToken, clientInfo, this.cryptoObj);
            return this.account;
        }

        // if login is not yet done, return null
        return null;
    }

    // #endregion
}
