/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// app
import { MsalConfiguration } from "./MsalConfiguration";
// auth
import { IdToken } from "../auth/IdToken";
import { ClientInfo } from "../auth/ClientInfo";
import { Account } from "../auth/Account";
// authority
import { Authority } from "../auth/authority/Authority";
import { AuthorityFactory } from "../auth/authority/AuthorityFactory";
// request
import { AuthenticationParameters } from "../request/AuthenticationParameters";
import { ServerRequestParameters } from "../request/ServerRequestParameters";
// response
import { AuthResponse } from "../response/AuthResponse";
// cache
import { ICacheStorage } from "../cache/ICacheStorage";
// network
import { INetworkModule } from "./INetworkModule";
// constants
import { ResponseTypes, PersistentCacheKeys, TemporaryCacheKeys, Constants } from "../utils/Constants";
// error
import { ClientAuthError } from "../error/ClientAuthError";
// utils
import { StringUtils } from "../utils/StringUtils";

/**
 * ImplicitAuthModule class
 * 
 * Object instance which will construct requests to send to and handle responses from the Microsoft STS.
 * 
 */
export class ImplicitAuthModule {

    // Application config
    private config: MsalConfiguration;

    // Interface implementations
    private cacheStorage: ICacheStorage;
    private networkClient: INetworkModule;

    // Authority variables
    private defaultAuthorityInstance: Authority;
    public get defaultAuthorityUri(): string {
        if (this.defaultAuthorityInstance) {
            return this.defaultAuthorityInstance.canonicalAuthority;
        }
        return "";
    }

    // Account fields
    private account: Account;

    /**
     * @constructor
     * Constructor for the UserAgentApplication used to instantiate the UserAgentApplication object
     *
     * Important attributes in the Configuration object for auth are:
     * - clientID: the application ID of your application.
     * You can obtain one by registering your application with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview
     * - authority: the authority URL for your application.
     *
     * In Azure AD, authority is a URL indicating the Azure active directory that MSAL uses to obtain tokens.
     * It is of the form https://login.microsoftonline.com/&lt;Enter_the_Tenant_Info_Here&gt;.
     * If your application supports Accounts in one organizational directory, replace "Enter_the_Tenant_Info_Here" value with the Tenant Id or Tenant name (for example, contoso.microsoft.com).
     * If your application supports Accounts in any organizational directory, replace "Enter_the_Tenant_Info_Here" value with organizations.
     * If your application supports Accounts in any organizational directory and personal Microsoft accounts, replace "Enter_the_Tenant_Info_Here" value with common.
     * To restrict support to Personal Microsoft accounts only, replace "Enter_the_Tenant_Info_Here" value with consumers.
     *
     *
     * In Azure B2C, authority is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/&lt;policyName&gt;/
     *
     * @param {@link (Configuration:type)} configuration object for the MSAL UserAgentApplication instance
     */
    constructor(configuration: MsalConfiguration) {
        // Set the configuration
        this.config = configuration;
        
        // Set the cache
        this.cacheStorage = this.config.storageInterface;
        
        // Set the network interface
        this.networkClient = this.config.networkInterface;

        // Initialize authority
        this.defaultAuthorityInstance = AuthorityFactory.createInstance(this.config.auth.authority || AuthorityFactory.DEFAULT_AUTHORITY, this.networkClient);
    }

    /**
     * This function validates and returns a navigation uri based on a given request object. See request/AuthenticationParameters.ts for more information on how to construct the request object.
     * @param request 
     */
    async createLoginUrl(request: AuthenticationParameters): Promise<string> {
        // Initialize authority or use default, and perform discovery endpoint check
        let acquireTokenAuthority = (request && request.authority) ? AuthorityFactory.createInstance(request.authority, this.networkClient) : this.defaultAuthorityInstance;
        acquireTokenAuthority = await acquireTokenAuthority.resolveEndpointsAsync();

        // Set the account object to the current session
        request.account = this.getAccount();

        // Create and validate request parameters
        const serverRequestParameters = new ServerRequestParameters(
            acquireTokenAuthority,
            this.config.auth.clientId,
            request,
            true,
            false,
            this.getAccount(),
            this.getRedirectUri()
        );

        // if extraScopesToConsent is passed in loginCall, append them to the login request
        serverRequestParameters.appendExtraScopes();

        if (!serverRequestParameters.isSSOParam(request.account)) {
            // TODO: Add ADAL Token SSO
            return "";
        }

        // if the user sets the login start page - angular only??
        const loginStartPage = window.location.href;

        // Update entries for start of request event
        this.updateCacheEntries(serverRequestParameters, request.account, loginStartPage);

        // populate query parameters (sid/login_hint/domain_hint) and any other extraQueryParameters set by the developer
        serverRequestParameters.populateQueryParams();

        // Construct and return navigation url
        return serverRequestParameters.createNavigateUrl();
    }

    /**
     * This function validates and returns a navigation uri based on a given request object. See request/AuthenticationParameters.ts for more information on how to construct the request object.
     * @param request 
     */
    async createAcquireTokenUrl(request: AuthenticationParameters): Promise<string> {
        return "";
    }

    /**
     * This function parses the response from the Microsoft STS and returns a response in the form of the AuthResponse object. See response/AuthResponse.ts for more information on that object.
     * @param hash 
     */
    handleResponse(hash: string): AuthResponse {
        
        return null;
    }

    // #region General Helpers

    /**
     * @hidden
     * @ignore
     *
     * Sets the cachekeys for and stores the account information in cache
     * @param account
     * @param state
     * @hidden
     */
    private setAccountCache(account: Account, state: string) {
        // Cache acquireTokenAccountKey
        const accountId = this.getAccountId(account);

        const acquireTokenAccountKey = `${TemporaryCacheKeys.ACQUIRE_TOKEN_ACCOUNT}${Constants.RESOURCE_DELIM}${accountId}${Constants.RESOURCE_DELIM}${state}`;
        this.cacheStorage.setItem(acquireTokenAccountKey, JSON.stringify(account));
    }

    /**
     * @hidden
     * @ignore
     *
     * Sets the cacheKey for and stores the authority information in cache
     * @param state
     * @param authority
     * @hidden
     */
    private setAuthorityCache(state: string, authority: Authority) {
        // Cache authorityKey
        const authorityKey = `${TemporaryCacheKeys.AUTHORITY}${Constants.RESOURCE_DELIM}${state}`;
        this.cacheStorage.setItem(authorityKey, authority.canonicalAuthority);
    }

    /**
     * Updates account, authority, and nonce in cache
     * @param serverAuthenticationRequest
     * @param account
     * @hidden
     * @ignore
     */
    private updateCacheEntries(serverAuthenticationRequest: ServerRequestParameters, account: Account, loginStartPage?: any) {
        // Cache account and authority
        if (loginStartPage) {
            // Cache the state, nonce, and login request data
            this.cacheStorage.setItem(TemporaryCacheKeys.LOGIN_REQUEST, loginStartPage);
            this.cacheStorage.setItem(TemporaryCacheKeys.STATE_LOGIN, serverAuthenticationRequest.state);
        } else {
            this.setAccountCache(account, serverAuthenticationRequest.state);
        }
        // Cache authorityKey
        this.setAuthorityCache(serverAuthenticationRequest.state, serverAuthenticationRequest.authorityInstance);

        // Cache nonce
        this.cacheStorage.setItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${serverAuthenticationRequest.state}`, serverAuthenticationRequest.nonce);
    }

    /**
     * Returns the unique identifier for the logged in account
     * @param account
     * @hidden
     * @ignore
     */
    private getAccountId(account: Account): any {
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
    getAccount(): Account {
        // if a session already exists, get the account from the session
        if (this.account) {
            return this.account;
        }

        // frame is used to get idToken and populate the account for the given session
        const rawIdToken = this.cacheStorage.getItem(PersistentCacheKeys.IDTOKEN);
        const rawClientInfo = this.cacheStorage.getItem(PersistentCacheKeys.CLIENT_INFO);

        if (!StringUtils.isEmpty(rawIdToken) && !StringUtils.isEmpty(rawClientInfo)) {
            const idToken = new IdToken(rawIdToken);
            const clientInfo = new ClientInfo(rawClientInfo);
            this.account = Account.createAccount(idToken, clientInfo);
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
