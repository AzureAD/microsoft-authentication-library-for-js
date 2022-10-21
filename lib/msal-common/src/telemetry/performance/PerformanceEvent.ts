/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Enumeration of operations that are instrumented by have their performance measured by the PerformanceClient.
 *
 * @export
 * @enum {number}
 */
export enum PerformanceEvents {

    /**
     * acquireTokenByCode API (msal-browser and msal-node).
     * Used to acquire tokens by trading an authorization code against the token endpoint.
     */
    AcquireTokenByCode = "acquireTokenByCode",

    /**
     * acquireTokenByRefreshToken API (msal-browser and msal-node).
     * Used to renew an access token using a refresh token against the token endpoint.
     */
    AcquireTokenByRefreshToken = "acquireTokenByRefreshToken",

    /**
     * acquireTokenSilent API (msal-browser and msal-node).
     * Used to silently acquire a new access token (from the cache or the network).
     */
    AcquireTokenSilent = "acquireTokenSilent",

    /**
     * acquireTokenSilentAsync (msal-browser).
     * Internal API for acquireTokenSilent.
     */
    AcquireTokenSilentAsync = "acquireTokenSilentAsync",

    /**
     * acquireTokenPopup (msal-browser).
     * Used to acquire a new access token interactively through pop ups
     */
    AcquireTokenPopup = "acquireTokenPopup",

    /**
     * getPublicKeyThumbprint API in CryptoOpts class (msal-browser).
     * Used to generate a public/private keypair and generate a public key thumbprint for pop requests.
     */
    CryptoOptsGetPublicKeyThumbprint = "cryptoOptsGetPublicKeyThumbprint",

    /**
     * signJwt API in CryptoOpts class (msal-browser).
     * Used to signed a pop token.
     */
    CryptoOptsSignJwt = "cryptoOptsSignJwt",

    /**
     * acquireToken API in the SilentCacheClient class (msal-browser).
     * Used to read access tokens from the cache.
     */
    SilentCacheClientAcquireToken = "silentCacheClientAcquireToken",

    /**
     * acquireToken API in the SilentIframeClient class (msal-browser).
     * Used to acquire a new set of tokens from the authorize endpoint in a hidden iframe.
     */
    SilentIframeClientAcquireToken = "silentIframeClientAcquireToken",

    /**
     * acquireToken API in SilentRereshClient (msal-browser).
     * Used to acquire a new set of tokens from the token endpoint using a refresh token.
     */
    SilentRefreshClientAcquireToken = "silentRefreshClientAcquireToken",

    /**
     * ssoSilent API (msal-browser).
     * Used to silently acquire an authorization code and set of tokens using a hidden iframe.
     */
    SsoSilent = "ssoSilent",

    /**
     * getDiscoveredAuthority API in StandardInteractionClient class (msal-browser).
     * Used to load authority metadata for a request.
     */
    StandardInteractionClientGetDiscoveredAuthority = "standardInteractionClientGetDiscoveredAuthority",

    /**
     * acquireToken APIs in msal-browser.
     * Used to make an /authorize endpoint call with native brokering enabled.
     */
    FetchAccountIdWithNativeBroker = "fetchAccountIdWithNativeBroker",

    /**
     * acquireToken API in NativeInteractionClient class (msal-browser).
     * Used to acquire a token from Native component when native brokering is enabled.
     */
    NativeInteractionClientAcquireToken = "nativeInteractionClientAcquireToken",
    /**
     * Time spent creating default headers for requests to token endpoint
     */
    BaseClientCreateTokenRequestHeaders = "baseClientCreateTokenRequestHeaders",
    /**
     * Used to measure the time taken for completing embedded-broker handshake (PW-Broker).
     */
    BrokerHandhshake = "brokerHandshake",
    /**
     * acquireTokenByRefreshToken API in BrokerClientApplication (PW-Broker) .
     */
    AcquireTokenByRefreshTokenInBroker = "acquireTokenByRefreshTokenInBroker",
    /**
     * Time taken for token acquisition by broker
     */
    AcquireTokenByBroker = "acquireTokenByBroker",

    /**
     * Time spent on the network for refresh token acquisition
     */
    RefreshTokenClientExecuteTokenRequest = "refreshTokenClientExecuteTokenRequest",

    /**
     * Time taken for acquiring refresh token , records RT size
     */
    RefreshTokenClientAcquireToken = "refreshTokenClientAcquireToken",

    /**
     * Time taken for acquiring cached refresh token 
     */
    RefreshTokenClientAcquireTokenWithCachedRefreshToken = "refreshTokenClientAcquireTokenWithCachedRefreshToken",
}

/**
 * State of the performance event.
 *
 * @export
 * @enum {number}
 */
export enum PerformanceEventStatus {
    NotStarted,
    InProgress,
    Completed
}

/**
 * Fields whose value will not change throughout a request
 */
export type StaticFields = { 
    /**
     * The Silent Token Cache Lookup Policy
     *
     * @type {?(number | undefined)}
     */
    cacheLookupPolicy?: number | undefined,

    /**
     * Size of the id token
     *
     * @type {number}
     */
    idTokenSize?: number,
 
    /**
     * 
     * Size of the access token
     *
     * @type {number}
     */
 
    accessTokenSize?: number,

    /**
     * 
     * Size of the refresh token
     *
     * @type {number}
     */

    refreshTokenSize?: number | undefined,
 
    /**
     * Application name as specified by the app.
     *
     * @type {?string}
     */
    appName?: string,
 
    /**
     * Application version as specified by the app.
     *
     * @type {?string}
     */
    appVersion?: string,

    /**
     * The following are fields that may be emitted in native broker scenarios
     */
    extensionId?: string,
    extensionVersion?: string
    matsBrokerVersion?: string;
    matsAccountJoinOnStart?: string;
    matsAccountJoinOnEnd?: string;
    matsDeviceJoin?: string;
    matsPromptBehavior?: string;
    matsApiErrorCode?: number;
    matsUiVisible?: boolean;
    matsSilentCode?: number;
    matsSilentBiSubCode?: number;
    matsSilentMessage?: string;
    matsSilentStatus?: number;
    matsHttpStatus?: number
    matsHttpEventCount?: number;
};

/**
 * Performance measurement taken by the library, including metadata about the request and application.
 *
 * @export
 * @typedef {PerformanceEvent}
 */
export type PerformanceEvent = StaticFields & {
    /**
     * Unique id for the event
     *
     * @type {string}
     */
    eventId: string,

    /**
     * State of the perforance measure.
     *
     * @type {PerformanceEventStatus}
     */
    status: PerformanceEventStatus,

    /**
     * Login authority used for the request
     *
     * @type {string}
     */
    authority: string,

    /**
     * Client id for the application
     *
     * @type {string}
     */
    clientId: string

    /**
     * Correlation ID used for the request
     *
     * @type {string}
     */
    correlationId: string,

    /**
     * End-to-end duration in milliseconds.
     * @date 3/22/2022 - 3:40:05 PM
     *
     * @type {number}
     */
    durationMs?: number,

    /**
     * Visibility of the page when the event completed.
     * Read from: https://developer.mozilla.org/docs/Web/API/Page_Visibility_API
     *
     * @type {?(string | null)}
     */
    endPageVisibility?: string | null,

    /**
     * Whether the result was retrieved from the cache.
     *
     * @type {(boolean | null)}
     */
    fromCache?: boolean | null,

    /**
     * Event name (usually in the form of classNameFunctionName)
     *
     * @type {PerformanceEvents}
     */
    name: PerformanceEvents,

    /**
     * Visibility of the page when the event completed.
     * Read from: https://developer.mozilla.org/docs/Web/API/Page_Visibility_API
     *
     * @type {?(string | null)}
     */
    startPageVisibility?: string | null,

    /**
     * Unix millisecond timestamp when the event was initiated.
     *
     * @type {number}
     */
    startTimeMs: number,

    /**
     * Whether or the operation completed successfully.
     *
     * @type {(boolean | null)}
     */
    success?: boolean | null,

    /**
     * Add specific error code in case of failure
     *
     * @type {string}
     */
    errorCode?: string,

    /**
     * Add specific sub error code in case of failure
     *
     * @type {string}
     */
    subErrorCode?: string,

    /**
     * Name of the library used for the operation.
     *
     * @type {string}
     */
    libraryName: string,

    /**
     * Version of the library used for the operation.
     *
     * @type {string}
     */
    libraryVersion: string,

    /**
     * Whether the response is from a native component (e.g., WAM)
     *
     * @type {?boolean}
     */
    isNativeBroker?: boolean,

    /**
     * Request ID returned from the response
     * 
     * @type {?string}
     */
    requestId?: string
};
