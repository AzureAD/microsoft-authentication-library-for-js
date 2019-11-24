/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// import { Logger } from "./Logger";
import { BrowserUtils } from "../utils/BrowserUtils";
import { AuthOptions } from "msal-common";
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
    // logger?: Logger;
    loadFrameTimeout?: number;
    tokenRenewalOffsetSeconds?: number;
    navigateFrameWait?: number;
    telemetry?: TelemetryOptions
};

/**
 * App/Framework specific environment support
 *
 * - isAngular                - flag set to determine if it is Angular Framework. MSAL uses this to broadcast tokens. More to come here: detangle this dependency from core.
 * - unprotectedResources     - Array of URI's which are unprotected resources. MSAL will not attach a token to outgoing requests that have these URI. Defaults to 'null'.
 * - protectedResourceMap     - This is mapping of resources to scopes used by MSAL for automatically attaching access tokens in web API calls.A single access token is obtained for the resource. So you can map a specific resource path as follows: {"https://graph.microsoft.com/v1.0/me", ["user.read"]}, or the app URL of the resource as: {"https://graph.microsoft.com/", ["user.read", "mail.send"]}. This is required for CORS calls.
 *
 */
export type FrameworkOptions = {
    isAngular?: boolean;
    unprotectedResources?: Array<string>;
    protectedResourceMap?: Map<string, Array<string>>;
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
    auth: AuthOptions,
    cache?: CacheOptions,
    system?: SystemOptions,
    framework?: FrameworkOptions
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
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false
};

const DEFAULT_SYSTEM_OPTIONS: SystemOptions = {
    // logger: new Logger(null),
    loadFrameTimeout: FRAME_TIMEOUT,
    tokenRenewalOffsetSeconds: OFFSET,
    navigateFrameWait: NAVIGATE_FRAME_WAIT
};

const DEFAULT_FRAMEWORK_OPTIONS: FrameworkOptions = {
    isAngular: false,
    unprotectedResources: new Array<string>(),
    protectedResourceMap: new Map<string, Array<string>>()
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

export function buildConfiguration({ auth, cache = {}, system = {}, framework = {}}: Configuration): Configuration {
    const overlayedConfig: Configuration = {
        auth: { ...DEFAULT_AUTH_OPTIONS, ...auth },
        cache: { ...DEFAULT_CACHE_OPTIONS, ...cache },
        system: { ...DEFAULT_SYSTEM_OPTIONS, ...system },
        framework: { ...DEFAULT_FRAMEWORK_OPTIONS, ...framework }
    };
    return overlayedConfig;
}
