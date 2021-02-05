/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SystemOptions, LoggerOptions, INetworkModule, DEFAULT_SYSTEM_OPTIONS, Constants, ProtocolMode, LogLevel, StubbedNetworkModule } from "@azure/msal-common";
import { BrowserUtils } from "../utils/BrowserUtils";
import { BrowserCacheLocation } from "../utils/BrowserConstants";

// Default timeout for popup windows and iframes in milliseconds
export const DEFAULT_POPUP_TIMEOUT_MS = 60000;
export const DEFAULT_IFRAME_TIMEOUT_MS = 6000;
export const DEFAULT_REDIRECT_TIMEOUT_MS = 30000;

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
 * - protocolMode               - Enum that represents the protocol that msal follows. Used for configuring proper endpoints.
 */
export type BrowserAuthOptions = {
    clientId: string;
    authority?: string;
    knownAuthorities?: Array<string>;
    cloudDiscoveryMetadata?: string;
    authorityMetadata?: string;
    redirectUri?: string;
    postLogoutRedirectUri?: string | null;
    navigateToLoginRequestUrl?: boolean;
    clientCapabilities?: Array<string>;
    protocolMode?: ProtocolMode;
};

/**
 * Use this to configure the below cache configuration options:
 *
 * - cacheLocation            - Used to specify the cacheLocation user wants to set. Valid values are "localStorage" and "sessionStorage"
 * - storeAuthStateInCookie   - If set, MSAL store's the auth request state required for validation of the auth flows in the browser cookies. By default this flag is set to false.
 */
export type CacheOptions = {
    cacheLocation?: BrowserCacheLocation | string;
    storeAuthStateInCookie?: boolean;
};

/**
 * Library Specific Options
 *
 * - tokenRenewalOffsetSeconds    - Sets the window of offset needed to renew the token before expiry
 * - loggerOptions                - Used to initialize the Logger object (See ClientConfiguration.ts)
 * - networkClient                - Network interface implementation
 * - windowHashTimeout            - Sets the timeout for waiting for a response hash in a popup. Will take precedence over loadFrameTimeout if both are set.
 * - iframeHashTimeout            - Sets the timeout for waiting for a response hash in an iframe. Will take precedence over loadFrameTimeout if both are set.
 * - loadFrameTimeout             - Sets the timeout for waiting for a response hash in an iframe or popup
 * - navigateFrameWait            - Maximum time the library should wait for a frame to load
 * - redirectNavigationTimeout    - Time to wait for redirection to occur before resolving promise
 * - asyncPopups                  - Sets whether popups are opened asynchronously. By default, this flag is set to false. When set to false, blank popups are opened before anything else happens. When set to true, popups are opened when making the network request.
 * - allowRedirectInIframe        - Flag to enable redirect opertaions when the app is rendered in an iframe (to support scenarios such as embedded B2C login).
 */
export type BrowserSystemOptions = SystemOptions & {
    loggerOptions?: LoggerOptions;
    networkClient?: INetworkModule;
    windowHashTimeout?: number;
    iframeHashTimeout?: number;
    loadFrameTimeout?: number;
    navigateFrameWait?: number;
    redirectNavigationTimeout?: number;
    asyncPopups?: boolean;
    allowRedirectInIframe?: boolean;
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
    auth: BrowserAuthOptions,
    cache?: CacheOptions,
    system?: BrowserSystemOptions
};

export type BrowserConfiguration = {
    auth: Required<BrowserAuthOptions>,
    cache: Required<CacheOptions>,
    system: Required<BrowserSystemOptions>
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
export function buildConfiguration({ auth: userInputAuth, cache: userInputCache, system: userInputSystem }: Configuration, isBrowserEnvironment: boolean): BrowserConfiguration {

    // Default auth options for browser
    const DEFAULT_AUTH_OPTIONS: Required<BrowserAuthOptions> = {
        clientId: "",
        authority: `${Constants.DEFAULT_AUTHORITY}`,
        knownAuthorities: [],
        cloudDiscoveryMetadata: "",
        authorityMetadata: "",
        redirectUri: "",
        postLogoutRedirectUri: "",
        navigateToLoginRequestUrl: true,
        clientCapabilities: [],
        protocolMode: ProtocolMode.AAD
    };

    // Default cache options for browser
    const DEFAULT_CACHE_OPTIONS: Required<CacheOptions> = {
        cacheLocation: BrowserCacheLocation.SessionStorage,
        storeAuthStateInCookie: false
    };

    // Default logger options for browser
    const DEFAULT_LOGGER_OPTIONS: LoggerOptions = {
        loggerCallback: (): void => {},
        logLevel: LogLevel.Info,
        piiLoggingEnabled: false
    };

    // Default system options for browser
    const DEFAULT_BROWSER_SYSTEM_OPTIONS: Required<BrowserSystemOptions> = {
        ...DEFAULT_SYSTEM_OPTIONS,
        loggerOptions: DEFAULT_LOGGER_OPTIONS,
        networkClient: isBrowserEnvironment ? BrowserUtils.getBrowserNetworkClient() : StubbedNetworkModule,
        loadFrameTimeout: 0,
        // If loadFrameTimeout is provided, use that as default.
        windowHashTimeout: (userInputSystem && userInputSystem.loadFrameTimeout) || DEFAULT_POPUP_TIMEOUT_MS,
        iframeHashTimeout: (userInputSystem && userInputSystem.loadFrameTimeout) || DEFAULT_IFRAME_TIMEOUT_MS,
        navigateFrameWait: isBrowserEnvironment && BrowserUtils.detectIEOrEdge() ? 500 : 0,
        redirectNavigationTimeout: DEFAULT_REDIRECT_TIMEOUT_MS,
        asyncPopups: false,
        allowRedirectInIframe: false
    };

    const overlayedConfig: BrowserConfiguration = {
        auth: { ...DEFAULT_AUTH_OPTIONS, ...userInputAuth },
        cache: { ...DEFAULT_CACHE_OPTIONS, ...userInputCache },
        system: { ...DEFAULT_BROWSER_SYSTEM_OPTIONS, ...userInputSystem }
    };
    return overlayedConfig;
}
