/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @packageDocumentation
 * @module @azure/msal-browser
 */

import * as BrowserUtils from "./utils/BrowserUtils";
export { BrowserUtils };

export { PublicClientApplication } from "./app/PublicClientApplication";
export { PublicClientNext } from "./app/PublicClientNext";
export { IController } from "./controllers/IController";
export {
    Configuration,
    BrowserAuthOptions,
    CacheOptions,
    BrowserSystemOptions,
    BrowserTelemetryOptions,
    BrowserConfiguration,
    DEFAULT_IFRAME_TIMEOUT_MS,
} from "./config/Configuration";
export {
    InteractionType,
    InteractionStatus,
    BrowserCacheLocation,
    WrapperSKU,
    ApiId,
    CacheLookupPolicy,
} from "./utils/BrowserConstants";

// Browser Errors
export {
    BrowserAuthError,
    BrowserAuthErrorMessage,
    BrowserAuthErrorCodes,
} from "./error/BrowserAuthError";
export {
    BrowserConfigurationAuthError,
    BrowserConfigurationAuthErrorCodes,
    BrowserConfigurationAuthErrorMessage,
} from "./error/BrowserConfigurationAuthError";

// Interfaces
export {
    IPublicClientApplication,
    stubbedPublicClientApplication,
} from "./app/IPublicClientApplication";
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
export { AuthenticationResult } from "./response/AuthenticationResult";
export { ClearCacheRequest } from "./request/ClearCacheRequest";

// Cache
export { LoadTokenOptions } from "./cache/TokenCache";
export { ITokenCache } from "./cache/ITokenCache";

// Storage
export { MemoryStorage } from "./cache/MemoryStorage";
export { BrowserStorage } from "./cache/BrowserStorage";

// Events
export {
    EventMessage,
    EventPayload,
    EventError,
    EventCallbackFunction,
    EventMessageUtils,
    PopupEvent,
} from "./event/EventMessage";
export { EventType } from "./event/EventType";

export {
    SignedHttpRequest,
    SignedHttpRequestOptions,
} from "./crypto/SignedHttpRequest";

export {
    PopupWindowAttributes,
    PopupSize,
    PopupPosition,
} from "./request/PopupWindowAttributes";

// Telemetry
export { BrowserPerformanceClient } from "./telemetry/BrowserPerformanceClient";
export { BrowserPerformanceMeasurement } from "./telemetry/BrowserPerformanceMeasurement";

// Common Object Formats
export {
    AuthenticationScheme,
    // Account
    AccountInfo,
    AccountEntity,
    IdTokenClaims,
    // Error
    AuthError,
    AuthErrorCodes,
    AuthErrorMessage,
    ClientAuthError,
    ClientAuthErrorCodes,
    ClientAuthErrorMessage,
    ClientConfigurationError,
    ClientConfigurationErrorCodes,
    ClientConfigurationErrorMessage,
    InteractionRequiredAuthError,
    InteractionRequiredAuthErrorCodes,
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
    ServerResponseType,
    PromptValue,
    // Server Response
    ExternalTokenResponse,
    // Utils
    StringUtils,
    UrlString,
    JsonWebTokenTypes,
    // AzureCloudInstance enum
    AzureCloudInstance,
    AzureCloudOptions,
    AuthenticationHeaderParser,
    OIDC_DEFAULT_SCOPES,
    PerformanceCallbackFunction,
    PerformanceEvent,
    PerformanceEvents,
    // Telemetry
    InProgressPerformanceEvent,
    TenantProfile,
    IPerformanceClient,
    StubPerformanceClient,
} from "@azure/msal-common";

export { version } from "./packageMetadata";
