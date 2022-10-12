/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SystemOptions, LoggerOptions, INetworkModule, DEFAULT_SYSTEM_OPTIONS, Constants, ProtocolMode, LogLevel, StubbedNetworkModule, AzureCloudInstance, AzureCloudOptions, ApplicationTelemetry } from "@azure/msal-common";
import { BrowserUtils } from "../utils/BrowserUtils";
import { BrowserCacheLocation, BrowserConstants } from "../utils/BrowserConstants";
import { INavigationClient } from "../navigation/INavigationClient";
import { NavigationClient } from "../navigation/NavigationClient";

// Default timeout for popup windows and iframes in milliseconds
export const DEFAULT_POPUP_TIMEOUT_MS = 60000;
export const DEFAULT_IFRAME_TIMEOUT_MS = 6000;
export const DEFAULT_REDIRECT_TIMEOUT_MS = 30000;
export const DEFAULT_NATIVE_BROKER_HANDSHAKE_TIMEOUT_MS = 2000;

/**
 * Use this to configure the auth options in the Configuration object
 */
export type BrowserAuthOptions = {
    /**
     * Client ID of your app registered with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview in Microsoft Identity Platform
     */
    clientId: string;
    /**
     * You can configure a specific authority, defaults to " " or "https://login.microsoftonline.com/common"
     */
    authority?: string;
    /**
     * An array of URIs that are known to be valid. Used in B2C scenarios.
     */
    knownAuthorities?: Array<string>;
    /**
     * A string containing the cloud discovery response. Used in AAD scenarios.
     */
    cloudDiscoveryMetadata?: string;
    /**
     * A string containing the .well-known/openid-configuration endpoint response
     */
    authorityMetadata?: string;
    /**
     * The redirect URI where authentication responses can be received by your application. It must exactly match one of the redirect URIs registered in the Azure portal.
     */
    redirectUri?: string;
    /**
     * The redirect URI where the window navigates after a successful logout.
     */
    postLogoutRedirectUri?: string | null;
    /**
     * Boolean indicating whether to navigate to the original request URL after the auth server navigates to the redirect URL.
     */
    navigateToLoginRequestUrl?: boolean;
    /**
     * Array of capabilities which will be added to the claims.access_token.xms_cc request property on every network request.
     */
    clientCapabilities?: Array<string>;
    /**
     * Enum that represents the protocol that msal follows. Used for configuring proper endpoints.
     */
    protocolMode?: ProtocolMode;
    /**
     * Enum that represents the Azure Cloud to use.
     */
    azureCloudOptions?: AzureCloudOptions;
    /**
     * Flag of whether to use the local metadata cache
     */
    skipAuthorityMetadataCache?: boolean;
};

/**
 * Use this to configure the below cache configuration options:
 */
export type CacheOptions = {
    /**
     * Used to specify the cacheLocation user wants to set. Valid values are "localStorage" and "sessionStorage"
     */
    cacheLocation?: BrowserCacheLocation | string;
    /**
     * If set, MSAL stores the auth request state required for validation of the auth flows in the browser cookies. By default this flag is set to false.
     */
    storeAuthStateInCookie?: boolean;
    /**
     * If set, MSAL sets the "Secure" flag on cookies so they can only be sent over HTTPS. By default this flag is set to false.
     */
    secureCookies?: boolean;
};

export type BrowserSystemOptions = SystemOptions & {
    /**
     * Used to initialize the Logger object (See ClientConfiguration.ts)
     */
    loggerOptions?: LoggerOptions;
    /**
     * Network interface implementation
     */
    networkClient?: INetworkModule;
    /**
     * Override the methods used to navigate to other webpages. Particularly useful if you are using a client-side router
     */
    navigationClient?: INavigationClient;
    /**
     * Sets the timeout for waiting for a response hash in a popup. Will take precedence over loadFrameTimeout if both are set.
     */
    windowHashTimeout?: number;
    /**
     * Sets the timeout for waiting for a response hash in an iframe. Will take precedence over loadFrameTimeout if both are set.
     */
    iframeHashTimeout?: number;
    /**
     * Sets the timeout for waiting for a response hash in an iframe or popup
     */
    loadFrameTimeout?: number;
    /**
     * Maximum time the library should wait for a frame to load
     */
    navigateFrameWait?: number;
    /**
     * Time to wait for redirection to occur before resolving promise
     */
    redirectNavigationTimeout?: number;
    /**
     * Sets whether popups are opened asynchronously. By default, this flag is set to false. When set to false, blank popups are opened before anything else happens. When set to true, popups are opened when making the network request.
     */
    asyncPopups?: boolean;
    /**
     * Flag to enable redirect opertaions when the app is rendered in an iframe (to support scenarios such as embedded B2C login).
     */
    allowRedirectInIframe?: boolean;
    /**
     * Flag to enable native broker support (e.g. acquiring tokens from WAM on Windows)
     */
    allowNativeBroker?: boolean;
    /**
     * Sets the timeout for waiting for the native broker handshake to resolve
     */
    nativeBrokerHandshakeTimeout?: number;
    /**
     * Options related to browser crypto APIs
     */
    cryptoOptions?: CryptoOptions;
    /**
     * Sets the interval length in milliseconds for polling the location attribute in popup windows (default is 30ms)
     */
    pollIntervalMilliseconds?: number;
};

export type CryptoOptions = {
    
    /**
     * Enables the application to use the MSR Crypto interface, if available (and other interfaces are not)
     * @type {?boolean}
     */
    useMsrCrypto?: boolean;
     
    /**
     * Entropy to seed browser crypto API (needed for MSR Crypto). Must be cryptographically strong random numbers (e.g. crypto.randomBytes(48) from Node)
     * @type {?Uint8Array}
     */
    entropy?: Uint8Array;
};

/**
 * Telemetry Options
 */
export type BrowserTelemetryOptions = {
    /**
     * Telemetry information sent on request
     * - appName: Unique string name of an application
     * - appVersion: Version of the application using MSAL
     */
    application?: ApplicationTelemetry;
};

/**
 * This object allows you to configure important elements of MSAL functionality and is passed into the constructor of PublicClientApplication
 */
export type Configuration = {
    /**
     * This is where you configure auth elements like clientID, authority used for authenticating against the Microsoft Identity Platform
     */
    auth: BrowserAuthOptions,
    /**
     * This is where you configure cache location and whether to store cache in cookies
     */
    cache?: CacheOptions,
    /**
     * This is where you can configure the network client, logger, token renewal offset
     */
    system?: BrowserSystemOptions,
    /**
     * This is where you can configure telemetry data and options
     */
    telemetry?: BrowserTelemetryOptions
};

export type BrowserConfiguration = {
    auth: Required<BrowserAuthOptions>,
    cache: Required<CacheOptions>,
    system: Required<BrowserSystemOptions>,
    telemetry: Required<BrowserTelemetryOptions>
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
export function buildConfiguration({ auth: userInputAuth, cache: userInputCache, system: userInputSystem, telemetry: userInputTelemetry }: Configuration, isBrowserEnvironment: boolean): BrowserConfiguration {

    // Default auth options for browser
    const DEFAULT_AUTH_OPTIONS: Required<BrowserAuthOptions> = {
        clientId: Constants.EMPTY_STRING,
        authority: `${Constants.DEFAULT_AUTHORITY}`,
        knownAuthorities: [],
        cloudDiscoveryMetadata: Constants.EMPTY_STRING,
        authorityMetadata: Constants.EMPTY_STRING,
        redirectUri: Constants.EMPTY_STRING,
        postLogoutRedirectUri: Constants.EMPTY_STRING,
        navigateToLoginRequestUrl: true,
        clientCapabilities: [],
        protocolMode: ProtocolMode.AAD,
        azureCloudOptions: {
            azureCloudInstance: AzureCloudInstance.None,
            tenant: Constants.EMPTY_STRING
        },
        skipAuthorityMetadataCache: false,
    };

    // Default cache options for browser
    const DEFAULT_CACHE_OPTIONS: Required<CacheOptions> = {
        cacheLocation: BrowserCacheLocation.SessionStorage,
        storeAuthStateInCookie: false,
        secureCookies: false
    };

    // Default logger options for browser
    const DEFAULT_LOGGER_OPTIONS: LoggerOptions = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        loggerCallback: (): void => {},
        logLevel: LogLevel.Info,
        piiLoggingEnabled: false
    };

    // Default system options for browser
    const DEFAULT_BROWSER_SYSTEM_OPTIONS: Required<BrowserSystemOptions> = {
        ...DEFAULT_SYSTEM_OPTIONS,
        loggerOptions: DEFAULT_LOGGER_OPTIONS,
        networkClient: isBrowserEnvironment ? BrowserUtils.getBrowserNetworkClient() : StubbedNetworkModule,
        navigationClient: new NavigationClient(),
        loadFrameTimeout: 0,
        // If loadFrameTimeout is provided, use that as default.
        windowHashTimeout: userInputSystem?.loadFrameTimeout || DEFAULT_POPUP_TIMEOUT_MS,
        iframeHashTimeout: userInputSystem?.loadFrameTimeout || DEFAULT_IFRAME_TIMEOUT_MS,
        navigateFrameWait: isBrowserEnvironment && BrowserUtils.detectIEOrEdge() ? 500 : 0,
        redirectNavigationTimeout: DEFAULT_REDIRECT_TIMEOUT_MS,
        asyncPopups: false,
        allowRedirectInIframe: false,
        allowNativeBroker: false,
        nativeBrokerHandshakeTimeout: userInputSystem?.nativeBrokerHandshakeTimeout || DEFAULT_NATIVE_BROKER_HANDSHAKE_TIMEOUT_MS,
        pollIntervalMilliseconds: BrowserConstants.DEFAULT_POLL_INTERVAL_MS,
        cryptoOptions: {
            useMsrCrypto: false,
            entropy: undefined
        }
    };

    const DEFAULT_TELEMETRY_OPTIONS: Required<BrowserTelemetryOptions> = {
        application: {
            appName: Constants.EMPTY_STRING,
            appVersion: Constants.EMPTY_STRING
        }
    };

    const overlayedConfig: BrowserConfiguration = {
        auth: { ...DEFAULT_AUTH_OPTIONS, ...userInputAuth },
        cache: { ...DEFAULT_CACHE_OPTIONS, ...userInputCache },
        system: { ...DEFAULT_BROWSER_SYSTEM_OPTIONS, ...userInputSystem },
        telemetry: { ...DEFAULT_TELEMETRY_OPTIONS, ...userInputTelemetry }
    };
    return overlayedConfig;
}

