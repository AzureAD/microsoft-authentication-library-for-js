/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// import { Logger } from "./Logger";
import { AuthOptions, INetworkModule, ILoggerCallback, LogLevel } from "msal-common";
import { BrowserUtils } from "../utils/BrowserUtils";
import { BrowserConstants } from "../utils/BrowserConstants";
// import { TelemetryEmitter } from "./telemetry/TelemetryTypes";

/**
 * Defaults for the Configuration Options
 */
const FRAME_TIMEOUT = 6000;
const OFFSET = 300;
const NAVIGATE_FRAME_WAIT = 500;

/**
 * Use this to configure the below cache configuration options:
 *
 * - cacheLocation            - Used to specify the cacheLocation user wants to set. Valid values are "localStorage" and "sessionStorage"
 * - storeAuthStateInCookie   - If set, MSAL store's the auth request state required for validation of the auth flows in the browser cookies. By default this flag is set to false.
 */
export type CacheOptions = {
    cacheLocation?: string;
    storeAuthStateInCookie?: boolean;
};

/**
 * Telemetry Config Options
 * - applicationName              - Name of the consuming apps application
 * - applicationVersion           - Verison of the consuming application
 * - telemetryEmitter             - Function where telemetry events are flushed to
 */
export type TelemetryOptions = {
    applicationName: string;
    applicationVersion: string;
    // TODO, add onlyAddFailureTelemetry option
};

/**
 * Library Specific Options
 *
 * - logger                       - Used to initialize the Logger object; TODO: Expand on logger details or link to the documentation on logger
 * - loadFrameTimeout             - maximum time the library should wait for a frame to load
 * - tokenRenewalOffsetSeconds    - sets the window of offset needed to renew the token before expiry
 * - navigateFrameWait            - sets the wait time for hidden iFrame navigation
 */
export type SystemOptions = {
    loggerOptions?: BrowserLoggerOptions;
    networkClient?: INetworkModule;
    loadFrameTimeout?: number;
    tokenRenewalOffsetSeconds?: number;
    navigateFrameWait?: number;
    telemetry?: TelemetryOptions
};

/**
 * Logger options
 * 
 * - piiLoggingEnabled          - Used to configure whether piiLogging is enabled. Defaults to false.
 * - loggerCallback             - Callback for logger that determines how message is broadcast. Defaults to console.
 */
export type BrowserLoggerOptions = {
    piiLoggingEnabled?: boolean,
    loggerCallback?: ILoggerCallback
};

/**
 * Use the configuration object to configure MSAL and initialize the UserAgentApplication.
 *
 * This object allows you to configure important elements of MSAL functionality:
 * - auth: this is where you configure auth elements like clientID,  authority used for authenticating against the Microsoft Identity Platform
 * - cache: this is where you configure cache location and whether to store cache in cookies
 * - system: this is where you can configure the logger, frame timeout etc.
 * - framework: this is where you can configure the running mode of angular. More to come here soon.
 */
export type Configuration = {
    auth?: AuthOptions,
    cache?: CacheOptions,
    system?: SystemOptions
};

const DEFAULT_AUTH_OPTIONS: AuthOptions = {
    clientId: "",
    clientSecret: "",
    authority: null,
    validateAuthority: true,
    redirectUri: () => BrowserUtils.getDefaultRedirectUri(),
    postLogoutRedirectUri: () => BrowserUtils.getDefaultRedirectUri(),
    navigateToLoginRequestUrl: true
};

const DEFAULT_CACHE_OPTIONS: CacheOptions = {
    cacheLocation: BrowserConstants.CACHE_LOCATION_SESSION,
    storeAuthStateInCookie: false
};

const DEFAULT_LOGGER_OPTIONS: BrowserLoggerOptions = {
    loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
        if (containsPii) {
            return;
        }
        switch (level) {
            case LogLevel.Error:
                console.error(message);
            case LogLevel.Info:
                console.info(message);
            case LogLevel.Verbose:
                console.debug(message);
            case LogLevel.Warning:
                console.warn(message);
        }
    },
    piiLoggingEnabled: false
};

const DEFAULT_SYSTEM_OPTIONS: SystemOptions = {
    loggerOptions: DEFAULT_LOGGER_OPTIONS,
    networkClient: BrowserUtils.getBrowserNetworkClient(),
    loadFrameTimeout: FRAME_TIMEOUT,
    tokenRenewalOffsetSeconds: OFFSET,
    navigateFrameWait: NAVIGATE_FRAME_WAIT,
    telemetry: null
};

/**
 * MSAL function that sets the default options when not explicitly configured from app developer
 *
 * @param TAuthOptions
 * @param TCacheOptions
 * @param TSystemOptions
 * @param TFrameworkOptions
 *
 * @returns TConfiguration object
 */

export function buildConfiguration({ auth, cache = {}, system = {}}: Configuration): Configuration {
    const overlayedConfig: Configuration = {
        auth: { ...DEFAULT_AUTH_OPTIONS, ...auth },
        cache: { ...DEFAULT_CACHE_OPTIONS, ...cache },
        system: { ...DEFAULT_SYSTEM_OPTIONS, ...system }
    };
    return overlayedConfig;
}
