/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @packageDocumentation
 * @module @azure/msal-node
 */

/**
 * Warning: This set of exports is purely intended to be used by other MSAL libraries, and should be considered potentially unstable. We strongly discourage using them directly, you do so at your own risk.
 * Breaking changes to these APIs will be shipped under a minor version, instead of a major version.
 */

import * as internals from "./internals";
export { internals };

// Interfaces
export { IPublicClientApplication } from "./client/IPublicClientApplication";
export { IConfidentialClientApplication } from "./client/IConfidentialClientApplication";
export { ITokenCache } from "./cache/ITokenCache";
export { ICacheClient } from "./cache/distributed/ICacheClient";
export { IPartitionManager } from "./cache/distributed/IPartitionManager";
export { ILoopbackClient } from "./network/ILoopbackClient";

// Clients and Configuration
export { PublicClientApplication } from "./client/PublicClientApplication";
export { ConfidentialClientApplication } from "./client/ConfidentialClientApplication";
export { ClientApplication } from "./client/ClientApplication";
export { ClientCredentialClient } from "./client/ClientCredentialClient";
export { DeviceCodeClient } from "./client/DeviceCodeClient";
export { OnBehalfOfClient } from "./client/OnBehalfOfClient";
export { UsernamePasswordClient } from "./client/UsernamePasswordClient";

export {
    Configuration,
    buildAppConfiguration,
    NodeAuthOptions,
    NodeSystemOptions,
    CacheOptions,
} from "./config/Configuration";
export { ClientAssertion } from "./client/ClientAssertion";

// Cache and Storage
export { TokenCache } from "./cache/TokenCache";
export { NodeStorage } from "./cache/NodeStorage";
export {
    CacheKVStore,
    JsonCache,
    InMemoryCache,
    SerializedAccountEntity,
    SerializedIdTokenEntity,
    SerializedAccessTokenEntity,
    SerializedAppMetadataEntity,
    SerializedRefreshTokenEntity,
} from "./cache/serializer/SerializerTypes";
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
    AppTokenProviderResult,
} from "@azure/msal-common";

export { version } from "./packageMetadata";
