/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as msalAuth from "msal-common";

// Configuration
import { Configuration } from "./Configuration";

// Network
import { IXhrClient } from "../network/IXHRClient";
import { XhrClient } from "../network/XHRClient";

// Cache
import { CacheManager } from "../cache/CacheManager";

// Errors
import { ClientBrowserConfigurationError } from "../error/ClientBrowserConfigurationError";

/**
 * A type alias for an authResponseCallback function.
 * {@link (authResponseCallback:type)}
 * @param authErr error created for failure cases
 * @param response response containing token strings in success cases, or just state value in error cases
 */
export type authCallback = (authErr: msalAuth.AuthError, response?: msalAuth.AuthResponse) => void;

/**
 * Key-Value type to support queryParams, extraQueryParams and claims
 */
export type StringDict = {[key: string]: string};

/**
 * UserAgentApplication class
 *
 * Object Instance that the developer can use to make loginXX OR acquireTokenXX functions
 */
export class UserAgentApplication {

    // input configuration by the developer/user
    private config: Configuration;

    // auth functions imported from msal-common package
    private authModule: msalAuth.ImplicitAuthModule;
    
    // callback for error/token response
    private authCallback: authCallback = null;
    
    // App State Fields
    private redirectCallbacksSet: boolean;
    private interactionInProgress: boolean;

    // Cache manager
    private cacheMgr: CacheManager;

    // Network Client
    private networkClient: IXhrClient;

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
    constructor(configuration: Configuration) {
        // Set the configuration
        this.config = configuration;

        // Create browser storage
        this.cacheMgr = new CacheManager(this.config.auth.clientId, this.config.cache);

        // Initialize the network module
        this.networkClient = new XhrClient();

        // Create the auth module
        this.authModule = new msalAuth.ImplicitAuthModule({ 
            auth: this.config.auth,
            storageInterface: this.cacheMgr.storage,
            networkInterface: {
                sendRequestAsync: this.networkClient.sendRequestAsync
            }
        } as msalAuth.MsalConfiguration);

        // Set initial state vars
        this.redirectCallbacksSet = false;
        this.interactionInProgress = false;
    }

    // #region Redirect Flow
    /**
     * @hidden
     * @ignore
     * Set the callback functions for the redirect flow to send back the success or error object.
     * @param {@link (tokenReceivedCallback:type)} authCallback - Callback which contains
     * an AuthError object, containing error data from either the server
     * or the library, depending on the origin of the error, or the AuthResponse object 
     * containing data from the server (returned with a null or non-blocking error).
     */
    handleRedirectCallback(authCallback: authCallback): void {
        if (!authCallback) {
            this.redirectCallbacksSet = false;
            throw ClientBrowserConfigurationError.createInvalidCallbackObjectError(authCallback);
        }
        
        this.authCallback = authCallback;
        this.redirectCallbacksSet = true;
    }

    async loginRedirect(request: msalAuth.AuthenticationParameters) {
        // Throw error if callbacks are not set before redirect
        if (!this.redirectCallbacksSet) {
            throw ClientBrowserConfigurationError.createRedirectCallbacksNotSetError();
        }

        // Check if interaction is in progress
        if (this.interactionInProgress) {
            const thrownError = msalAuth.ClientAuthError.createLoginInProgressError();
            const stateOnlyResponse = msalAuth.buildResponseStateOnly(this.parseResponseState(request && request.state));
            this.authCallback(thrownError, stateOnlyResponse);
            return;
        }
        let urlNavigate;
        try {
            urlNavigate = await this.authModule.createLoginUrl(request || {});
        } catch(e) {
            const stateOnlyResponse = msalAuth.buildResponseStateOnly(this.parseResponseState(request && request.state));
            this.authCallback(new msalAuth.AuthError(e), stateOnlyResponse);
        }
        console.log(urlNavigate);
    }

    private parseResponseState(state: string) {
        if (state) {
            const splitIndex = state.indexOf("|");
            if (splitIndex > -1 && splitIndex + 1 < state.length) {
                return state.substring(splitIndex + 1);
            }
        }
        return state;
    }
}
