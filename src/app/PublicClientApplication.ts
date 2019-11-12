/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as msalAuth from "msal-common";
import { Configuration, buildConfiguration } from "./Configuration";

/**
 * Interface to handle iFrame generation, Popup Window creation and redirect handling
 */
declare global {
    interface Window {
        openedWindows: Array<Window>;
    }
}

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

export class PublicClientApplication {

    // input configuration by developer/user
    private config: Configuration;

    // auth functions imported from msal-common module
    private authModule: msalAuth.AuthorizationCodeModule;

    // callback for error/token response
    private authCallback: authCallback = null;

    constructor(configuration: Configuration) {
        // Set the configuration
        this.config = buildConfiguration(configuration);

        this.authModule = new msalAuth.AuthorizationCodeModule({
            auth: this.config.auth,
            cryptoInterface: null,
            networkInterface: null,
            storageInterface: null
        });
    }

    // #region Redirect Flow

    handleRedirectCallback(authCallback: authCallback): void {
        throw new Error("Method not implemented.");
    }

    loginRedirect(request: msalAuth.AuthenticationParameters): void {
        throw new Error("Method not implemented.");
    }

    acquireTokenRedirect(request: msalAuth.AuthenticationParameters): void {
        throw new Error("Method not implemented.");
    }

    // #endregion

    // #region Popup Flow 

    loginPopup(request: msalAuth.AuthenticationParameters): Promise<msalAuth.TokenResponse> {
        throw new Error("Method not implemented.");
    }

    acquireTokenPopup(request: msalAuth.AuthenticationParameters): Promise<msalAuth.TokenResponse> {
        throw new Error("Method not implemented.");
    }

    // #region Silent Flow

    acquireTokenSilent(request: msalAuth.AuthenticationParameters): Promise<msalAuth.TokenResponse> {
        throw new Error("Method not implemented."); 
    }

    // #endregion

    // #region Window Navigation

    private navigateWindow(urlNavigate: string) {
        throw new Error("Method not implemented.");
    }

    // #endregion
}
