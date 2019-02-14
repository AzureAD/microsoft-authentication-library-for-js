/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { Logger } from "./Logger";

// make CacheStorage a fixed type to limit it to specific inputs
type storage = "localStorage" | "sessionStorage";

/**
 * Authentication Options
 */
export type TAuthOptions = {

  /**
   * Client ID assigned to your app by Azure Active Directory.
   */
  clientId: string;

  /**
   * Follow up with the authority discussion with the PMs
   * Until then this is a placeholder
   */
  authority?: string;

  /**
   * Used to turn authority validation on/off.
   * When set to true (default), MSAL will compare the application"s authority against well-known URLs templates representing well-formed authorities. It is useful when the authority is obtained at run time to prevent MSAL from displaying authentication prompts from malicious pages.
   */
  validateAuthority?: boolean;

  /**
   * The redirect URI of the application, this should be same as the value in the application registration portal.
   * Defaults to `window.location.href`.
   */
  redirectUri?: string | (() => string);

  /**
   * Used to redirect the user to this location after logout.
   * Defaults to `window.location.href`.
   */
  postLogoutRedirectUri?: string | (() => string);

  /**
   * Use to send the state parameter with authentication request
   */
  state?: string;

  /**
   * Used to turn off default navigation to start page after login. Default is true. This is used only for redirect flows.
   */
  navigateToLoginRequestUrl?: boolean;
};

/**
 * Cache Options
 */
export type TCacheOptions = {

    /**
     * Used to specify the cacheLocation user wants to set: Valid values are "localStorage" and "sessionStorage"
     */
    cacheLocation?: string;

    /**
     * If set, the library will store the auth request state required for validation of the auth flows in the browser cookies. By default this flag is set to false.
     */
    storeAuthStateInCookie?: boolean;
};

/**
 * Library Specific Options
 */
export type TSystemOptions = {

    /**
     * Used to initialize the Logger object;
     * TODO: Expand on logger details
     */
    logger?: Logger;

    /**
     * maximum time the library should wait for a frame to load
     */
    loadFrameTimeout?: number;

    /**
     * sets the window of offset needed to renew the token before expiry?
     * TODO: Get the exact description for this variable
     * TODO: Clarify clockSkew, we may need clockSkew too which serves a different purpose (ref: Aashima's discussion)
     */
    tokenRenewalOffsetSeconds?: number;
};

/**
 * App/Framework specific environment Support
 */
export type TFrameworkOptions = {

    /**
     * flag set to determine if it is Angular Framework
     */
    isAngular?: boolean;

    /**
     * Array of URI's which are unprotected resources. MSAL will not attach a token to outgoing requests that have these URI. Defaults to 'null'.
     */
    unprotectedResources?: Array<string>;

    /**
     * This is mapping of resources to scopes used by MSAL for automatically attaching access tokens in web API calls.
     * A single access token is obtained for the resource. So you can map a specific resource path as follows:
     * {"https://graph.microsoft.com/v1.0/me", ["user.read"]}, or the app URL of the resource as: {"https://graph.microsoft.com/", ["user.read", "mail.send"]}.
     * This is required for CORS calls.
     */
    protectedResourceMap?: Map<string, Array<string>>;
};

/**
 * Configuration Object
 */
export type TConfiguration = {
    auth: TAuthOptions,
    cache?: TCacheOptions,
    system?: TSystemOptions,
    framework?: TFrameworkOptions
};

/**
 * Function to set the default options when not explicitly set
 *
 * @param TAuthOptions
 * @param TCacheOptions
 * @param TSystemOptions
 * @param TFrameworkOptions
 *
 * @returns TConfiguration object
 */

export class Configuration {
    static buildConfiguration(
        // destructure with default setting
        {clientId = "", authority = null, validateAuthority = true, redirectUri = () => window.location.href.split("?")[0].split("#")[0], postLogoutRedirectUri = () => window.location.href.split("?")[0].split("#")[0], state = "", navigateToLoginRequestUrl = true}: TAuthOptions = {clientId},
        {cacheLocation = "localStorage", storeAuthStateInCookie = false}: TCacheOptions = {},
        {logger = new Logger(null), loadFrameTimeout = 6000, tokenRenewalOffsetSeconds = 300}: TSystemOptions = {},
        {isAngular = false, unprotectedResources = new Array<string>(), protectedResourceMap = new Map<string, Array<string>>()}: TFrameworkOptions = {}
    ) {
        // restructure
        let config = {
            auth: {
                clientId,
                authority,
                validateAuthority,
                redirectUri,
                postLogoutRedirectUri,
                state,
                navigateToLoginRequestUrl
            },
            cache: {cacheLocation, storeAuthStateInCookie},
            system: {logger, loadFrameTimeout, tokenRenewalOffsetSeconds},
            framework: {isAngular, unprotectedResources, protectedResourceMap}
        };

        return config;
    }
}

/**
 * Test Code
 * var c:TConfiguration = buildConfiguration({clientId: "TestClient "}, {}, {}, {isAngular: true});
 * console.log(c);
*/
