/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { SystemOptions, LoggerOptions, INetworkModule, LogLevel, DEFAULT_SYSTEM_OPTIONS, Constants } from "@azure/msal-common";
import { BrowserUtils } from "../utils/BrowserUtils";
import { BrowserConstants } from "../utils/BrowserConstants";

// Default timeout for popup windows and iframes in milliseconds
const DEFAULT_POPUP_TIMEOUT_MS = 60000;
const DEFAULT_IFRAME_TIMEOUT_MS = 6000;

export type BrowserAuthOptions = {
    clientId: string;
    authority?: string;
    knownAuthorities?: Array<string>;
    redirectUri?: string | (() => string);
    postLogoutRedirectUri?: string | (() => string);
    navigateToLoginRequestUrl?: boolean;
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
    storeInMemory?: boolean;
};

/**
 * Library Specific Options
 *
 * - logger                       - Used to initialize the Logger object; TODO: Expand on logger details or link to the documentation on logger
 * - loadFrameTimeout             - maximum time the library should wait for a frame to load
 * - windowHashTimeout            - sets the wait time for hidden iFrame navigation
 * - tokenRenewalOffsetSeconds    - sets the window of offset needed to renew the token before expiry
 * - telemetry                    - Telemetry options for library network requests
 */
export type BrowserSystemOptions = SystemOptions & {
    loggerOptions?: LoggerOptions;
    networkClient?: INetworkModule;
    windowHashTimeout?: number;
    iframeHashTimeout?: number;
    loadFrameTimeout?: number;
};

/**
 * Use the configuration object to configure MSAL and initialize the UserAgentApplication.
 *
 * This object allows you to configure important elements of MSAL functionality:
 * - auth: this is where you configure auth elements like clientID, authority used for authenticating against the Microsoft Identity Platform
 * - cache: this is where you configure cache location and whether to store cache in cookies
 * - system: this is where you can configure the network client, logger, token renewal offset, and telemetry
 */
export type Configuration = {
    auth?: BrowserAuthOptions,
    cache?: CacheOptions,
    system?: BrowserSystemOptions
};

// Default auth options for browser
const DEFAULT_AUTH_OPTIONS: BrowserAuthOptions = {
    clientId: "",
    authority: `${Constants.DEFAULT_AUTHORITY}/`,
    knownAuthorities: [],
    redirectUri: () => BrowserUtils.getCurrentUri(),
    postLogoutRedirectUri: () => BrowserUtils.getCurrentUri(),
    navigateToLoginRequestUrl: true
};

// Default cache options for browser
const DEFAULT_CACHE_OPTIONS: CacheOptions = {
    cacheLocation: BrowserConstants.CACHE_LOCATION_SESSION,
    storeAuthStateInCookie: false
};

// Default logger options for browser
const DEFAULT_LOGGER_OPTIONS: LoggerOptions = {
    loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
        if (containsPii) {
            return;
        }
        switch (level) {
            case LogLevel.Error:
                console.error(message);
                return;
            case LogLevel.Info:
                console.info(message);
                return;
            case LogLevel.Verbose:
                console.debug(message);
                return;
            case LogLevel.Warning:
                console.warn(message);
                return;
        }
    },
    piiLoggingEnabled: false
};

// Default system options for browser
const DEFAULT_BROWSER_SYSTEM_OPTIONS: BrowserSystemOptions = {
    ...DEFAULT_SYSTEM_OPTIONS,
    loggerOptions: DEFAULT_LOGGER_OPTIONS,
    networkClient: BrowserUtils.getBrowserNetworkClient(),
    windowHashTimeout: DEFAULT_POPUP_TIMEOUT_MS,
    iframeHashTimeout: DEFAULT_IFRAME_TIMEOUT_MS,
    loadFrameTimeout: BrowserUtils.detectIEOrEdge() ? 500 : 0
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
