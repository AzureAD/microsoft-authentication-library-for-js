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
import * as internals from "./internals.js";
import * as CommonConstants from "./common/utils/Constants.js";
export { internals };

// Interfaces
export { IConfidentialClientApplication } from "./client/IConfidentialClientApplication.js";
export { ITokenCache } from "./cache/ITokenCache.js";
export { ICacheClient } from "./cache/distributed/ICacheClient.js";
export { IPartitionManager } from "./cache/distributed/IPartitionManager.js";

// Clients and Configuration
export { ConfidentialClientApplication } from "./client/ConfidentialClientApplication.js";
export { ManagedIdentityApplication } from "./client/ManagedIdentityApplication.js";

export {
    Configuration,
    ManagedIdentityConfiguration,
    ManagedIdentityIdParams,
    NodeAuthOptions,
    NodeSystemOptions,
    NodeTelemetryOptions,
    CacheOptions,
} from "./config/Configuration.js";
export { ClientAssertion } from "./client/ClientAssertion.js";

// Cache and Storage
export { TokenCache } from "./cache/TokenCache.js";
export {
    CacheKVStore,
    JsonCache,
    InMemoryCache,
    SerializedAccountEntity,
    SerializedIdTokenEntity,
    SerializedAccessTokenEntity,
    SerializedAppMetadataEntity,
    SerializedRefreshTokenEntity,
} from "./cache/serializer/SerializerTypes.js";
export { DistributedCachePlugin } from "./cache/distributed/DistributedCachePlugin.js";

// Constants
export { ManagedIdentitySourceNames } from "./utils/Constants.js";

// Request objects
export type { AuthorizationCodeRequest } from "./request/AuthorizationCodeRequest.js";
export type { AuthorizationUrlRequest } from "./request/AuthorizationUrlRequest.js";
export type { ClientCredentialRequest } from "./request/ClientCredentialRequest.js";
export type { OnBehalfOfRequest } from "./request/OnBehalfOfRequest.js";
export type { UserFederatedIdentityCredentialRequest } from "./request/UserFederatedIdentityCredentialRequest.js";
export type { UsernamePasswordRequest } from "./request/UsernamePasswordRequest.js";
export type { RefreshTokenRequest } from "./request/RefreshTokenRequest.js";
export type { SilentFlowRequest } from "./request/SilentFlowRequest.js";
export type { ManagedIdentityRequestParams } from "./request/ManagedIdentityRequestParams.js";

const PromptValue = CommonConstants.PromptValue;
const ResponseMode = CommonConstants.ResponseMode;
export { PromptValue, ResponseMode };

export { CryptoProvider } from "./crypto/CryptoProvider.js";

// Common Object Formats
export { AuthorizationCodePayload } from "./common/response/AuthorizationCodePayload.js";
export { AuthenticationResult } from "./common/response/AuthenticationResult.js";
export { AuthorizeResponse } from "./common/response/AuthorizeResponse.js";
export { TokenClaims as IdTokenClaims } from "./common/account/TokenClaims.js";
export { AccountInfo } from "./common/account/AccountInfo.js";
export { ValidCacheType } from "./common/cache/utils/CacheTypes.js";
export { AuthError, AuthErrorCodes } from "./common/error/AuthError.js";
export {
    ClientAuthError,
    ClientAuthErrorCodes,
} from "./common/error/ClientAuthError.js";
export {
    ClientConfigurationError,
    ClientConfigurationErrorCodes,
} from "./common/error/ClientConfigurationError.js";
export {
    InteractionRequiredAuthError,
    InteractionRequiredAuthErrorCodes,
} from "./common/error/InteractionRequiredAuthError.js";
export { ServerError } from "./common/error/ServerError.js";
export {
    INetworkModule,
    NetworkRequestOptions,
} from "./common/network/INetworkModule.js";
export { NetworkResponse } from "./common/network/NetworkResponse.js";
export { Logger, LogLevel } from "./common/logger/Logger.js";
export { ProtocolMode } from "./common/authority/ProtocolMode.js";
export { ICachePlugin } from "./common/cache/interface/ICachePlugin.js";
export { TokenCacheContext } from "./common/cache/persistence/TokenCacheContext.js";
export { ISerializableTokenCache } from "./common/cache/interface/ISerializableTokenCache.js";
export { AzureCloudInstance } from "./common/authority/AuthorityOptions.js";
export { AzureCloudOptions } from "./common/config/ClientConfiguration.js";
export {
    IAppTokenProvider,
    AppTokenProviderParameters,
    AppTokenProviderResult,
} from "./common/config/AppTokenProvider.js";
export { ClientAssertionCallback } from "./common/account/ClientCredentials.js";

export { version } from "./packageMetadata.js";
