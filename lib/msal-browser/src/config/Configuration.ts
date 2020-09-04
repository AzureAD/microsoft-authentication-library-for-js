/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { SystemOptions, LoggerOptions, INetworkModule, DEFAULT_SYSTEM_OPTIONS, Constants } from "@azure/msal-common";
import { BrowserUtils } from "../utils/BrowserUtils";
import { BrowserConstants } from "../utils/BrowserConstants";
import { IWindowStorage } from "../cache/IWindowStorage";

// Default timeout for popup windows and iframes in milliseconds
const DEFAULT_POPUP_TIMEOUT_MS = 60000;
const DEFAULT_IFRAME_TIMEOUT_MS = 6000;

/**
 * Use this to configure the auth options in the Configuration object
 *
 * - clientId                    - Client ID of your app registered with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview in Microsoft Identity Platform
 * - authority                   - You can configure a specific authority, defaults to " " or "https://login.microsoftonline.com/common"
 * - knownAuthorities            - An array of URIs that are known to be valid. Used in B2C scenarios.
 * - cloudDiscoveryMetadata      - A string containing the cloud discovery response. Used in AAD scenarios.
 * - redirectUri                - The redirect URI where authentication responses can be received by your application. It must exactly match one of the redirect URIs registered in the Azure portal.
 * - postLogoutRedirectUri      - The redirect URI where the window navigates after a successful logout.
 * - navigateToLoginRequestUrl  - Boolean indicating whether to navigate to the original request URL after the auth server navigates to the redirect URL.
 * - clientCapabilities         - Array of capabilities which will be added to the claims.access_token.xms_cc request property on every network request.
 */
export type BrowserAuthOptions = {
    clientId: string;
    authority?: string;
    knownAuthorities?: Array<string>;
    cloudDiscoveryMetadata?: string;
    redirectUri?: string;
    postLogoutRedirectUri?: string;
    navigateToLoginRequestUrl?: boolean;
    clientCapabilities?: Array<string>;
};

/**
 * Use this to configure the below cache configuration options:
 *
 * - cacheLocation            - Used to specify the cacheLocation user wants to set. Valid values are "localStorage" and "sessionStorage"
 * - storeAuthStateInCookie   - If set, MSAL store's the auth request state required for validation of the auth flows in the browser cookies. By default this flag is set to false.
 */
export type CacheOptions = {
    cacheLocation?: string;
    storeAuthStateInCookie?: boolean;
    customStorage?: IWindowStorage;
};

/**
 * Library Specific Options
 *
 * - tokenRenewalOffsetSeconds    - Sets the window of offset needed to renew the token before expiry
 * - loggerOptions                - Used to initialize the Logger object (See ClientConfiguration.ts)
 * - networkClient                - Network interface implementation
 * - windowHashTimeout            - Sets the timeout for waiting for a response hash in a popup
 * - iframeHashTimeout            - Sets the timeout for waiting for a response hash in an iframe
 * - loadFrameTimeout             - Maximum time the library should wait for a frame to load
 * - asyncPopups                  - Sets whether popups are opened asynchronously. By default, this flag is set to false. When set to false, blank popups are opened before anything else happens. When set to true, popups are opened when making the network request.
 */
export type BrowserSystemOptions = SystemOptions & {
    loggerOptions?: LoggerOptions;
    networkClient?: INetworkModule;
    windowHashTimeout?: number;
    iframeHashTimeout?: number;
    loadFrameTimeout?: number;
    asyncPopups?: boolean;
};

/**
 * Use the configuration object to configure MSAL and initialize the UserAgentApplication.
 *
 * This object allows you to configure important elements of MSAL functionality:
 * - auth: this is where you configure auth elements like clientID, authority used for authenticating against the Microsoft Identity Platform
 * - cache: this is where you configure cache location and whether to store cache in cookies
 * - system: this is where you can configure the network client, logger, token renewal offset
 */
export type Configuration = {
    auth?: BrowserAuthOptions,
    cache?: CacheOptions,
    system?: BrowserSystemOptions
};

// Default auth options for browser
const DEFAULT_AUTH_OPTIONS: BrowserAuthOptions = {
    clientId: "",
    authority: `${Constants.DEFAULT_AUTHORITY}`,
    knownAuthorities: [],
    cloudDiscoveryMetadata: "",
    redirectUri: "",
    postLogoutRedirectUri: "",
    navigateToLoginRequestUrl: true,
    clientCapabilities: []
};

// Default cache options for browser
const DEFAULT_CACHE_OPTIONS: CacheOptions = {
    cacheLocation: BrowserConstants.CACHE_LOCATION_SESSION,
    storeAuthStateInCookie: false,
    customStorage: null
};

// Default logger options for browser
const DEFAULT_LOGGER_OPTIONS: LoggerOptions = {
    loggerCallback: (): void => {},
    piiLoggingEnabled: false
};

// Default system options for browser
const DEFAULT_BROWSER_SYSTEM_OPTIONS: BrowserSystemOptions = {
    ...DEFAULT_SYSTEM_OPTIONS,
    loggerOptions: DEFAULT_LOGGER_OPTIONS,
    networkClient: BrowserUtils.getBrowserNetworkClient(),
    windowHashTimeout: DEFAULT_POPUP_TIMEOUT_MS,
    iframeHashTimeout: DEFAULT_IFRAME_TIMEOUT_MS,
    loadFrameTimeout: BrowserUtils.detectIEOrEdge() ? 500 : 0,
    asyncPopups: false
};

/**
 * MSAL function that sets the default options when not explicitly configured from app developer
 *
 * @param auth
 * @param cache
 * @param system
 *
 * @returns Configuration object
 */
export function buildConfiguration({ auth: userInputAuth, cache: userInputCache, system: userInputSystem }: Configuration): Configuration {
    const overlayedConfig: Configuration = {
        auth: { ...DEFAULT_AUTH_OPTIONS, ...userInputAuth },
        cache: { ...DEFAULT_CACHE_OPTIONS, ...userInputCache },
        system: { ...DEFAULT_BROWSER_SYSTEM_OPTIONS, ...userInputSystem }
    };
    return overlayedConfig;
}
