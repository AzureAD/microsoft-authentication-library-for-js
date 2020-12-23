/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo, AuthenticationResult } from "@azure/msal-common";
import { Configuration } from "../config/Configuration";
import { DEFAULT_REQUEST } from "../utils/BrowserConstants";
import { IPublicClientApplication } from "./IPublicClientApplication";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";
import { ClientApplication } from "./ClientApplication";
import { ExperimentalClientAPI } from "./ExperimentalClientAPI";

/**
 * The PublicClientApplication class is the object exposed by the library to perform authentication and authorization functions in Single Page Applications
 * to obtain JWT tokens as described in the OAuth 2.0 Authorization Code Flow with PKCE specification.
 */
export class PublicClientApplication extends ClientApplication implements IPublicClientApplication {

    // Experimental object API
    experimental: ExperimentalClientAPI;

    /**
     * @constructor
     * Constructor for the PublicClientApplication used to instantiate the PublicClientApplication object
     *
     * Important attributes in the Configuration object for auth are:
     * - clientID: the application ID of your application. You can obtain one by registering your application with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview
     * - authority: the authority URL for your application.
     * - redirect_uri: the uri of your application registered in the portal.
     *
     * In Azure AD, authority is a URL indicating the Azure active directory that MSAL uses to obtain tokens.
     * It is of the form https://login.microsoftonline.com/{Enter_the_Tenant_Info_Here}
     * If your application supports Accounts in one organizational directory, replace "Enter_the_Tenant_Info_Here" value with the Tenant Id or Tenant name (for example, contoso.microsoft.com).
     * If your application supports Accounts in any organizational directory, replace "Enter_the_Tenant_Info_Here" value with organizations.
     * If your application supports Accounts in any organizational directory and personal Microsoft accounts, replace "Enter_the_Tenant_Info_Here" value with common.
     * To restrict support to Personal Microsoft accounts only, replace "Enter_the_Tenant_Info_Here" value with consumers.
     *
     * In Azure B2C, authority is of the form https://{instance}/tfp/{tenant}/{policyName}/
     * Full B2C functionality will be available in this library in future versions.
     *
     * @param {@link (Configuration:type)} configuration object for the MSAL PublicClientApplication instance
     */
    constructor(configuration: Configuration) {
        super(configuration);

        this.checkExperimentalConfig(configuration);
    }

    /**
     * 
     * @param userConfig 
     */
    private checkExperimentalConfig(userConfig: Configuration): void {
        if (userConfig.experimental) {
            this.logger.warning("Experimental features are subject to changes or removal without warning.");
            if (!userConfig.experimental.enableExperimentalApi) {
                this.logger.warning("Experimental features were detected but the experimental API was not enabled. Please set enableExperimentalApi to true in the configuration object.");
                return;
            }
            
            this.experimental = new ExperimentalClientAPI(this.config, this);
        }
    }

    /**
     * Event handler function which allows users to fire events after the PublicClientApplication object
     * has loaded during redirect flows. This should be invoked on all page loads involved in redirect
     * auth flows.
     * @param hash Hash to process. Defaults to the current value of window.location.hash. Only needs to be provided explicitly if the response to be handled is not contained in the current value.
     * @returns {Promise.<AuthenticationResult | null>} token response or null. If the return value is null, then no auth redirect was detected.
     */
    async handleRedirectPromise(hash?: string): Promise<AuthenticationResult | null> {
        if (this.experimental) {
            return this.experimental.handleRedirectPromise();
        }
        return super.handleRedirectPromise(hash);
    }

    /**
     * Use when initiating the login process by redirecting the user's browser to the authorization endpoint. This function redirects the page, so
     * any code that follows this function will not execute.
     *
     * IMPORTANT: It is NOT recommended to have code that is dependent on the resolution of the Promise. This function will navigate away from the current
     * browser window. It currently returns a Promise in order to reflect the asynchronous nature of the code running in this function.
     *
     * @param {@link (RedirectRequest:type)}
     */
    async loginRedirect(request?: RedirectRequest): Promise<void> {
        return this.acquireTokenRedirect(request || DEFAULT_REQUEST);
    }

    // #endregion

    // #region Popup Flow

    /**
     * Use when initiating the login process via opening a popup window in the user's browser
     *
     * @param {@link (PopupRequest:type)}
     *
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    loginPopup(request?: PopupRequest): Promise<AuthenticationResult> {
        return this.acquireTokenPopup(request || DEFAULT_REQUEST);
    }

    // #endregion

    /**
     * Sets the account to use as the active account. If no account is passed to the acquireToken APIs, then MSAL will use this active account.
     * @param account 
     */
    setActiveAccount(account: AccountInfo | null): void {
        if (this.experimental) {
            this.experimental.setActiveAccount(account);
        }
        super.setActiveAccount(account);
    }

    /**
     * Gets the currently active account
     */
    getActiveAccount(asBroker?: boolean): AccountInfo | null {
        if (this.experimental) {
            return this.experimental.getActiveAccount(asBroker);
        }

        return super.getActiveAccount();
    }
}
