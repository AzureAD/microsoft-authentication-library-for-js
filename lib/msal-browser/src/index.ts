/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @packageDocumentation
 * @module @azure/msal-browser
 */

/**
 * Warning: This set of exports is purely intended to be used by other MSAL libraries, and should be considered potentially unstable. We strongly discourage using them directly, you do so at your own risk.
 * Breaking changes to these APIs will be shipped under a minor version, instead of a major version.
 */
import * as internals from "./internals";
export { internals };

export { PublicClientApplication } from "./app/PublicClientApplication";
export { Configuration, BrowserAuthOptions, CacheOptions, BrowserSystemOptions, BrowserConfiguration, DEFAULT_IFRAME_TIMEOUT_MS } from "./config/Configuration";
export { InteractionType, InteractionStatus, BrowserCacheLocation, WrapperSKU, ApiId, CacheLookupPolicy } from "./utils/BrowserConstants";
export { BrowserUtils } from "./utils/BrowserUtils";

// Browser Errors
export { BrowserAuthError, BrowserAuthErrorMessage } from "./error/BrowserAuthError";
export { BrowserConfigurationAuthError, BrowserConfigurationAuthErrorMessage } from "./error/BrowserConfigurationAuthError";

// Interfaces
export { IPublicClientApplication, stubbedPublicClientApplication } from "./app/IPublicClientApplication";
export { INavigationClient } from "./navigation/INavigationClient";
export { NavigationClient } from "./navigation/NavigationClient";
export { NavigationOptions } from "./navigation/NavigationOptions";
export { PopupRequest } from "./request/PopupRequest";
export { RedirectRequest } from "./request/RedirectRequest";
export { SilentRequest } from "./request/SilentRequest";
export { SsoSilentRequest } from "./request/SsoSilentRequest";
export { EndSessionRequest } from "./request/EndSessionRequest";
export { EndSessionPopupRequest } from "./request/EndSessionPopupRequest";
export { AuthorizationUrlRequest } from "./request/AuthorizationUrlRequest";
export { AuthorizationCodeRequest } from "./request/AuthorizationCodeRequest";

// Cache
export { LoadTokenOptions } from "./cache/TokenCache";

// Events
export { EventMessage, EventPayload, EventError, EventCallbackFunction, EventMessageUtils, PopupEvent } from "./event/EventMessage";
export { EventType } from "./event/EventType";

export { SignedHttpRequest, SignedHttpRequestOptions } from "./crypto/SignedHttpRequest";

// Common Object Formats
export {
    AuthenticationScheme,
    // Account
    AccountInfo,
    AccountEntity,
    // Response
    AuthenticationResult,
    // Error
    AuthError,
    AuthErrorMessage,
    ClientAuthError,
    ClientAuthErrorMessage,
    ClientConfigurationError,
    ClientConfigurationErrorMessage,
    InteractionRequiredAuthError,
    InteractionRequiredAuthErrorMessage,
    ServerError,
    // Network
    INetworkModule,
    NetworkResponse,
    NetworkRequestOptions,
    // Logger Object
    ILoggerCallback,
    Logger,
    LogLevel,
    // Protocol Mode
    ProtocolMode,
    // Server Response
    ExternalTokenResponse,
    // Utils
    StringUtils,
    UrlString,
    // AzureCloudInstance enum
    AzureCloudInstance,
    AzureCloudOptions,
    AuthenticationHeaderParser,
    OIDC_DEFAULT_SCOPES,
    PerformanceCallbackFunction, 
    PerformanceEvent, 
    PerformanceEvents
} from "@azure/msal-common";

export { version } from "./packageMetadata";
