/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @packageDocumentation
 * @module @azure/msal-browser
 */

export { PublicClientApplication } from "./app/PublicClientApplication";
export { Configuration, BrowserAuthOptions, CacheOptions, BrowserSystemOptions, BrowserConfiguration } from "./config/Configuration";
export { InteractionType, InteractionStatus, BrowserCacheLocation, WrapperSKU, ApiId } from "./utils/BrowserConstants";
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
    AuthenticationHeaderParser,
    OIDC_DEFAULT_SCOPES
} from "@azure/msal-common";

export { version } from "./packageMetadata";
