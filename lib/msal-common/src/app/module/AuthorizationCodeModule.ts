/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// inheritance
import { AuthModule } from "./AuthModule";
// app
import { MsalPublicClientSPAConfiguration } from "../config/MsalPublicClientSPAConfiguration";
// request
import { AuthenticationParameters } from "../../request/AuthenticationParameters";
import { TokenExchangeParameters } from "../../request/TokenExchangeParameters";
// response
import { TokenResponse } from "../../response/TokenResponse";
import { ClientConfigurationError } from "../../error/ClientConfigurationError";

/**
 * AuthorizationCodeModule class
 * 
 * Object instance which will construct requests to send to and handle responses from the Microsoft STS using the authorization code flow.
 * 
 */
export class AuthorizationCodeModule extends AuthModule {

    // Application config
    protected config: MsalPublicClientSPAConfiguration;
    
    constructor(configuration: MsalPublicClientSPAConfiguration) {
        super({
            storageInterface: configuration.storageInterface,
            networkInterface: configuration.networkInterface,
            cryptoInterface: configuration.cryptoInterface
        });
        this.config = configuration;
    }

    async createLoginUrl(request: AuthenticationParameters): Promise<string> {
        throw new Error("Method not implemented.");
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
        if (this.config.auth.redirectUri) {
            if (typeof this.config.auth.redirectUri === "function") {
                return this.config.auth.redirectUri();
            }
            return this.config.auth.redirectUri;
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
        if (this.config.auth.postLogoutRedirectUri) {
            if (typeof this.config.auth.postLogoutRedirectUri === "function") {
                return this.config.auth.postLogoutRedirectUri();
            }
            return this.config.auth.postLogoutRedirectUri;
        } else {
            throw ClientConfigurationError.createPostLogoutRedirectUriEmptyError();
        }
    }

    // #endregion
}
