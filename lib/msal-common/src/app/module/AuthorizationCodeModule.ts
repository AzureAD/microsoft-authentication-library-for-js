/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// inheritance
import { AuthModule } from "./AuthModule";
// app
import { PublicClientSPAConfiguration, buildPublicClientSPAConfiguration } from "../config/PublicClientSPAConfiguration";
// request
import { AuthenticationParameters } from "../../request/AuthenticationParameters";
import { TokenExchangeParameters } from "../../request/TokenExchangeParameters";
// response
import { TokenResponse } from "../../response/TokenResponse";
import { ClientConfigurationError } from "../../error/ClientConfigurationError";
import { AuthorityFactory } from "../../auth/authority/AuthorityFactory";

/**
 * AuthorizationCodeModule class
 * 
 * Object instance which will construct requests to send to and handle responses from the Microsoft STS using the authorization code flow.
 * 
 */
export class AuthorizationCodeModule extends AuthModule {

    // Application config
    private clientConfig: PublicClientSPAConfiguration;
    
    constructor(configuration: PublicClientSPAConfiguration) {
        super({
            storageInterface: configuration.storageInterface,
            networkInterface: configuration.networkInterface,
            cryptoInterface: configuration.cryptoInterface
        });
        this.clientConfig = buildPublicClientSPAConfiguration(configuration);
        this.defaultAuthorityInstance = AuthorityFactory.createInstance(this.clientConfig.auth.authority || AuthorityFactory.DEFAULT_AUTHORITY, this.networkClient);
    }

    async createLoginUrl(request: AuthenticationParameters): Promise<string> {
        // Initialize authority or use default, and perform discovery endpoint check
        let acquireTokenAuthority = (request && request.authority) ? AuthorityFactory.createInstance(request.authority, this.networkClient) : this.defaultAuthorityInstance;
        await acquireTokenAuthority.resolveEndpointsAsync();

        // Set the account object to the current session
        request.account = this.getAccount();
        return null;
    }    
    
    async createAcquireTokenUrl(request: AuthenticationParameters): Promise<string> {
        throw new Error("Method not implemented.");
    }

    async acquireToken(request: TokenExchangeParameters): Promise<TokenResponse> {
        throw new Error("Method not implemented.");
    }

    // #region Getters and setters

    /**
     *
     * Use to get the redirect uri configured in MSAL or null.
     * Evaluates redirectUri if its a function, otherwise simply returns its value.
     * @returns {string} redirect URL
     *
     */
    public getRedirectUri(): string {
        if (this.clientConfig.auth.redirectUri) {
            if (typeof this.clientConfig.auth.redirectUri === "function") {
                return this.clientConfig.auth.redirectUri();
            }
            return this.clientConfig.auth.redirectUri;
        } else {
            throw ClientConfigurationError.createRedirectUriEmptyError();
        }
    }

    /**
     * Use to get the post logout redirect uri configured in MSAL or null.
     * Evaluates postLogoutredirectUri if its a function, otherwise simply returns its value.
     *
     * @returns {string} post logout redirect URL
     */
    public getPostLogoutRedirectUri(): string {
        if (this.clientConfig.auth.postLogoutRedirectUri) {
            if (typeof this.clientConfig.auth.postLogoutRedirectUri === "function") {
                return this.clientConfig.auth.postLogoutRedirectUri();
            }
            return this.clientConfig.auth.postLogoutRedirectUri;
        } else {
            throw ClientConfigurationError.createPostLogoutRedirectUriEmptyError();
        }
    }

    // #endregion
}
