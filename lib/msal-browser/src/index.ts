/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @packageDocumentation
 * @module @azure/msal-browser
 */

import * as BrowserUtils from "./utils/BrowserUtils.js";
import { Constants } from "@azure/msal-common/browser";
export { BrowserUtils };

export {
    PublicClientApplication,
    createNestablePublicClientApplication,
    createStandardPublicClientApplication,
} from "./app/PublicClientApplication.js";
export { PublicClientNext } from "./app/PublicClientNext.js";
export { IController } from "./controllers/IController.js";
export {
    Configuration,
    BrowserAuthOptions,
    CacheOptions,
    BrowserSystemOptions,
    BrowserTelemetryOptions,
    BrowserConfiguration,
    DEFAULT_IFRAME_TIMEOUT_MS,
} from "./config/Configuration.js";
export {
    InteractionType,
    InteractionStatus,
    BrowserCacheLocation,
    WrapperSKU,
    ApiId,
    CacheLookupPolicy,
} from "./utils/BrowserConstants.js";

// Browser Errors
export {
    BrowserAuthError,
    BrowserAuthErrorCodes,
} from "./error/BrowserAuthError.js";
export { BrowserConfigurationAuthError } from "./error/BrowserConfigurationAuthError.js";

// Interfaces
export {
    IPublicClientApplication,
    stubbedPublicClientApplication,
} from "./app/IPublicClientApplication.js";
export { INavigationClient } from "./navigation/INavigationClient.js";
export { NavigationClient } from "./navigation/NavigationClient.js";
export { NavigationOptions } from "./navigation/NavigationOptions.js";
export { PopupRequest } from "./request/PopupRequest.js";
export { RedirectRequest } from "./request/RedirectRequest.js";
export { SilentRequest } from "./request/SilentRequest.js";
export { SsoSilentRequest } from "./request/SsoSilentRequest.js";
export { EndSessionRequest } from "./request/EndSessionRequest.js";
export { EndSessionPopupRequest } from "./request/EndSessionPopupRequest.js";
export { AuthorizationCodeRequest } from "./request/AuthorizationCodeRequest.js";
export { AuthenticationResult } from "./response/AuthenticationResult.js";
export { ClearCacheRequest } from "./request/ClearCacheRequest.js";
export { InitializeApplicationRequest } from "./request/InitializeApplicationRequest.js";

// Cache
export { LoadTokenOptions } from "./cache/TokenCache.js";
export { ITokenCache } from "./cache/ITokenCache.js";

// Storage
export { MemoryStorage } from "./cache/MemoryStorage.js";
export { LocalStorage } from "./cache/LocalStorage.js";
export { SessionStorage } from "./cache/SessionStorage.js";
export { IWindowStorage } from "./cache/IWindowStorage.js";

// Events
export {
    EventMessage,
    EventPayload,
    EventError,
    EventCallbackFunction,
    EventMessageUtils,
    PopupEvent,
    BrokerConnectionEvent,
} from "./event/EventMessage.js";
export { EventType } from "./event/EventType.js";
export { EventHandler } from "./event/EventHandler.js";

export {
    SignedHttpRequest,
    SignedHttpRequestOptions,
} from "./crypto/SignedHttpRequest.js";

export {
    PopupWindowAttributes,
    PopupSize,
    PopupPosition,
} from "./request/PopupWindowAttributes.js";

// Telemetry
export { BrowserPerformanceClient } from "./telemetry/BrowserPerformanceClient.js";
export { BrowserPerformanceMeasurement } from "./telemetry/BrowserPerformanceMeasurement.js";

// Common constants
const AuthenticationScheme = Constants.AuthenticationScheme;
const ResponseMode = Constants.ResponseMode;
const PromptValue = Constants.PromptValue;
const JsonWebTokenTypes = Constants.JsonWebTokenTypes;
const OIDC_DEFAULT_SCOPES = Constants.OIDC_DEFAULT_SCOPES;
export {
    AuthenticationScheme,
    ResponseMode,
    PromptValue,
    JsonWebTokenTypes,
    OIDC_DEFAULT_SCOPES,
};

// Common Object Formats
export {
    // Account
    AccountInfo,
    AccountEntity,
    AccountEntityUtils,
    IdTokenClaims,
    // Error
    AuthError,
    AuthErrorCodes,
    ClientAuthError,
    ClientAuthErrorCodes,
    ClientConfigurationError,
    ClientConfigurationErrorCodes,
    InteractionRequiredAuthError,
    InteractionRequiredAuthErrorCodes,
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
    PerformanceCallbackFunction,
    PerformanceEvent,
    PerformanceEvents,
    // Telemetry
    InProgressPerformanceEvent,
    TenantProfile,
    IPerformanceClient,
    StubPerformanceClient,
} from "@azure/msal-common/browser";

export { version } from "./packageMetadata.js";

export { isPlatformBrokerAvailable } from "./broker/nativeBroker/PlatformAuthProvider.js";
