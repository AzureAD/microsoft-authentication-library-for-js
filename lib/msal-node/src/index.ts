/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export { PublicClientApplication } from "./client/PublicClientApplication";
export { ConfidentialClientApplication } from "./client/ConfidentialClientApplication";
export { Configuration, buildAppConfiguration } from "./config/Configuration";
export { Storage } from "./cache/Storage";
export { Serializer } from "./cache/serializer/Serializer";
export { Deserializer } from "./cache/serializer/Deserializer";
export { TokenCache } from "./cache/TokenCache";
export { BrokerManager } from "./broker/BrokerManager";

// crypto
export { CryptoProvider } from "./crypto/CryptoProvider";

// Common Object Formats
export {
    // Request
    AuthorizationCodeRequest,
    AuthorizationUrlRequest,
    SilentFlowRequest,
    DeviceCodeRequest,
    RefreshTokenRequest,
    ClientCredentialRequest,
    OnBehalfOfRequest,
    PromptValue,
    ResponseMode,
    // Response
    AuthenticationResult,
    // Cache
    AccountInfo,
    // Error
    AuthError,
    AuthErrorMessage,
    InteractionRequiredAuthError,
    ServerError,
    ClientAuthError,
    ClientAuthErrorMessage,
    ClientConfigurationError,
    ClientConfigurationErrorMessage,
    // Network Interface
    INetworkModule,
    NetworkRequestOptions,
    NetworkResponse,
    // Logger
    Logger,
    LogLevel,
    // ProtocolMode enum
    ProtocolMode,
    ICachePlugin,
    TokenCacheContext,
    ISerializableTokenCache
} from "@azure/msal-common";
