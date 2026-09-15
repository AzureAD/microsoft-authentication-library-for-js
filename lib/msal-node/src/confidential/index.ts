/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @packageDocumentation
 * @module @azure/msal-node/confidential
 */

import { Constants as CommonConstants } from "@azure/msal-common/node";

// Interfaces
export { IConfidentialClientApplication } from "../client/IConfidentialClientApplication.js";
export { ITokenCache } from "../cache/ITokenCache.js";
export { ICacheClient } from "../cache/distributed/ICacheClient.js";
export { IPartitionManager } from "../cache/distributed/IPartitionManager.js";

// Clients and Configuration
export { ConfidentialClientApplication } from "../client/ConfidentialClientApplication.js";
export { ManagedIdentityApplication } from "../client/ManagedIdentityApplication.js";
export {
    Configuration,
    ManagedIdentityConfiguration,
    ManagedIdentityIdParams,
    NodeAuthOptions,
    NodeSystemOptions,
    NodeTelemetryOptions,
    CacheOptions,
} from "../config/Configuration.js";
export { ClientAssertion } from "../client/ClientAssertion.js";

// Cache and Storage
export { TokenCache } from "../cache/TokenCache.js";
export {
    CacheKVStore,
    JsonCache,
    InMemoryCache,
    SerializedAccountEntity,
    SerializedIdTokenEntity,
    SerializedAccessTokenEntity,
    SerializedAppMetadataEntity,
    SerializedRefreshTokenEntity,
} from "../cache/serializer/SerializerTypes.js";
export { DistributedCachePlugin } from "../cache/distributed/DistributedCachePlugin.js";

// Constants
export { ManagedIdentitySourceNames } from "../utils/Constants.js";

// Request objects
export type { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest.js";
export type { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest.js";
export type { ClientCredentialRequest } from "../request/ClientCredentialRequest.js";
export type { OnBehalfOfRequest } from "../request/OnBehalfOfRequest.js";
export type { UserFederatedIdentityCredentialRequest } from "../request/UserFederatedIdentityCredentialRequest.js";
export type { UsernamePasswordRequest } from "../request/UsernamePasswordRequest.js";
export type { RefreshTokenRequest } from "../request/RefreshTokenRequest.js";
export type { SilentFlowRequest } from "../request/SilentFlowRequest.js";
export type { ManagedIdentityRequestParams } from "../request/ManagedIdentityRequestParams.js";

const PromptValue = CommonConstants.PromptValue;
const ResponseMode = CommonConstants.ResponseMode;
export { PromptValue, ResponseMode };

export { CryptoProvider } from "../crypto/CryptoProvider.js";

// Common Object Formats
export {
    AuthorizationCodePayload,
    // Response
    AuthenticationResult,
    AuthorizeResponse,
    IdTokenClaims,
    // Cache
    AccountInfo,
    ValidCacheType,
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
    ClientAssertionCallback,
} from "@azure/msal-common/node";

export { version } from "../packageMetadata.js";
