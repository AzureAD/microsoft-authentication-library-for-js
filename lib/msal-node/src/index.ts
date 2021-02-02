/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @packageDocumentation
 * @module @azure/msal-node
 */

// Interfaces
export { IPublicClientApplication } from "./client/IPublicClientApplication";
export { IConfidentialClientApplication } from "./client/IConfidentialClientApplication";

// Clients and Configuration
export { PublicClientApplication } from "./client/PublicClientApplication";
export { ConfidentialClientApplication } from "./client/ConfidentialClientApplication";
export { Configuration, buildAppConfiguration } from "./config/Configuration";

// Cache and Scetorage
export { Storage } from "./cache/Storage";
export { Serializer } from "./cache/serializer/Serializer";
export { Deserializer } from "./cache/serializer/Deserializer";
export { TokenCache } from "./cache/TokenCache";
export { CacheKVStore } from "./cache/serializer/SerializerTypes";

// crypto
export { CryptoProvider } from "./crypto/CryptoProvider";

// Request objects
export type { AuthorizationCodeRequest } from "./request/AuthorizationCodeRequest";
export type { AuthorizationUrlRequest } from "./request/AuthorizationUrlRequest";
export type { ClientCredentialRequest } from "./request/ClientCredentialRequest";
export type { DeviceCodeRequest } from "./request/DeviceCodeRequest";
export type { OnBehalfOfRequest } from "./request/OnBehalfOfRequest";
export type { RefreshTokenRequest } from "./request/RefreshTokenRequest";
export type { SilentFlowRequest } from "./request/SilentFlowRequest";

// Common Object Formats
export {
    // Request
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
