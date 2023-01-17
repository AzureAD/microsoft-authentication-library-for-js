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
export { ITokenCache } from "./cache/ITokenCache";
export { ICacheClient } from "./cache/distributed/ICacheClient";
export { IPartitionManager } from "./cache/distributed/IPartitionManager";

// Clients and Configuration
export { PublicClientApplication } from "./client/PublicClientApplication";
export { ConfidentialClientApplication } from "./client/ConfidentialClientApplication";
export { ClientApplication } from "./client/ClientApplication";
export { Configuration, buildAppConfiguration, NodeAuthOptions, NodeSystemOptions, CacheOptions } from "./config/Configuration";
export { ClientAssertion } from "./client/ClientAssertion";

// Cache and Storage
export { TokenCache } from "./cache/TokenCache";
export { NodeStorage } from "./cache/NodeStorage";
export { CacheKVStore, JsonCache, InMemoryCache, SerializedAccountEntity, SerializedIdTokenEntity, SerializedAccessTokenEntity, SerializedAppMetadataEntity, SerializedRefreshTokenEntity } from "./cache/serializer/SerializerTypes";
export { DistributedCachePlugin } from "./cache/distributed/DistributedCachePlugin";

// Crypto
export { CryptoProvider } from "./crypto/CryptoProvider";

// Request objects
export type { AuthorizationCodeRequest } from "./request/AuthorizationCodeRequest";
export type { AuthorizationUrlRequest } from "./request/AuthorizationUrlRequest";
export type { ClientCredentialRequest } from "./request/ClientCredentialRequest";
export type { DeviceCodeRequest } from "./request/DeviceCodeRequest";
export type { OnBehalfOfRequest } from "./request/OnBehalfOfRequest";
export type { UsernamePasswordRequest } from "./request/UsernamePasswordRequest";
export type { RefreshTokenRequest } from "./request/RefreshTokenRequest";
export type { SilentFlowRequest } from "./request/SilentFlowRequest";
export type { InteractiveRequest } from "./request/InteractiveRequest";

// Common Object Formats
export {
    // Request
    PromptValue,
    ResponseMode,
    AuthorizationCodePayload,
    // Response
    AuthenticationResult,
    // Cache
    AccountInfo,
    ValidCacheType,
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
    ISerializableTokenCache,
    // AzureCloudInstance enum
    AzureCloudInstance,
    AzureCloudOptions,
    // IAppTokenProvider
    IAppTokenProvider,
    AppTokenProviderParameters,
    AppTokenProviderResult
} from "@azure/msal-common";

export { version } from "./packageMetadata";
