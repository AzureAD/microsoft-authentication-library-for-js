/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @packageDocumentation
 * @module @azure/msal-common
 */

import * as AuthToken from "./account/AuthToken.js";
import * as AuthorityFactory from "./authority/AuthorityFactory.js";
import * as CacheHelpers from "./cache/utils/CacheHelpers.js";
import * as TimeUtils from "./utils/TimeUtils.js";
import * as UrlUtils from "./utils/UrlUtils.js";
import * as ClientAssertionUtils from "./utils/ClientAssertionUtils.js";
import * as AADServerParamKeys from "./constants/AADServerParamKeys.js";
export { AuthorizationCodeClient } from "./client/AuthorizationCodeClient.js";
export { RefreshTokenClient } from "./client/RefreshTokenClient.js";
export { SilentFlowClient } from "./client/SilentFlowClient.js";
export { BaseClient } from "./client/BaseClient.js";
export {
    AuthOptions,
    SystemOptions,
    LoggerOptions,
    CacheOptions,
    DEFAULT_SYSTEM_OPTIONS,
    AzureCloudOptions,
    ApplicationTelemetry,
} from "./config/ClientConfiguration.js";
export {
    IAppTokenProvider,
    AppTokenProviderParameters,
    AppTokenProviderResult,
} from "./config/AppTokenProvider.js";
export { ClientConfiguration } from "./config/ClientConfiguration.js";
// Account
export {
    AccountInfo,
    ActiveAccountFilters,
    TenantProfile,
    updateAccountTenantProfileData,
    tenantIdMatchesHomeTenant,
    buildTenantProfile,
} from "./account/AccountInfo.js";
export { AuthToken };
export {
    TokenClaims,
    getTenantIdFromIdTokenClaims,
} from "./account/TokenClaims.js";
export { TokenClaims as IdTokenClaims } from "./account/TokenClaims.js";
export { CcsCredential, CcsCredentialType } from "./account/CcsCredential.js";
export {
    ClientInfo,
    buildClientInfo,
    buildClientInfoFromHomeAccountId,
} from "./account/ClientInfo.js";
// Authority
export {
    Authority,
    formatAuthorityUri,
    buildStaticAuthorityOptions,
} from "./authority/Authority.js";
export {
    AuthorityOptions,
    AzureCloudInstance,
    StaticAuthorityOptions,
} from "./authority/AuthorityOptions.js";
export { AuthorityFactory };
export { AuthorityType } from "./authority/AuthorityType.js";
export { ProtocolMode } from "./authority/ProtocolMode.js";
export { OIDCOptions } from "./authority/OIDCOptions.js";
// Broker
export { INativeBrokerPlugin } from "./broker/nativeBroker/INativeBrokerPlugin.js";
// Cache
export { CacheManager, DefaultStorageClass } from "./cache/CacheManager.js";
export {
    AccountCache,
    AccountFilter,
    AccessTokenCache,
    IdTokenCache,
    RefreshTokenCache,
    AppMetadataCache,
    CredentialFilter,
    ValidCacheType,
    ValidCredentialType,
    TokenKeys,
} from "./cache/utils/CacheTypes.js";
export { CacheRecord } from "./cache/entities/CacheRecord.js";
export { CredentialEntity } from "./cache/entities/CredentialEntity.js";
export { CacheHelpers };
export { AppMetadataEntity } from "./cache/entities/AppMetadataEntity.js";
export { AccountEntity } from "./cache/entities/AccountEntity.js";
export { IdTokenEntity } from "./cache/entities/IdTokenEntity.js";
export { AccessTokenEntity } from "./cache/entities/AccessTokenEntity.js";
export { RefreshTokenEntity } from "./cache/entities/RefreshTokenEntity.js";
export { ServerTelemetryEntity } from "./cache/entities/ServerTelemetryEntity.js";
export { AuthorityMetadataEntity } from "./cache/entities/AuthorityMetadataEntity.js";
export { ThrottlingEntity } from "./cache/entities/ThrottlingEntity.js";
export { ICachePlugin } from "./cache/interface/ICachePlugin.js";
export { TokenCacheContext } from "./cache/persistence/TokenCacheContext.js";
export { ISerializableTokenCache } from "./cache/interface/ISerializableTokenCache.js";
// Network Interface
export {
    INetworkModule,
    NetworkRequestOptions,
    StubbedNetworkModule,
} from "./network/INetworkModule.js";
export {
    NetworkManager,
    NetworkResponse,
    UrlToHttpRequestOptions,
} from "./network/NetworkManager.js";
export { ThrottlingUtils } from "./network/ThrottlingUtils.js";
export { RequestThumbprint } from "./network/RequestThumbprint.js";
export { IUri } from "./url/IUri.js";
export { UrlString } from "./url/UrlString.js";
// Crypto Interface
export {
    ICrypto,
    PkceCodes,
    DEFAULT_CRYPTO_IMPLEMENTATION,
    SignedHttpRequestParameters,
} from "./crypto/ICrypto.js";
export { SignedHttpRequest, ShrOptions } from "./crypto/SignedHttpRequest.js";
export { IGuidGenerator } from "./crypto/IGuidGenerator.js";
export { JoseHeader } from "./crypto/JoseHeader.js";
// Request
export { BaseAuthRequest } from "./request/BaseAuthRequest.js";
export { CommonAuthorizationUrlRequest } from "./request/CommonAuthorizationUrlRequest.js";
export { CommonAuthorizationCodeRequest } from "./request/CommonAuthorizationCodeRequest.js";
export { CommonRefreshTokenRequest } from "./request/CommonRefreshTokenRequest.js";
export { CommonClientCredentialRequest } from "./request/CommonClientCredentialRequest.js";
export { CommonOnBehalfOfRequest } from "./request/CommonOnBehalfOfRequest.js";
export { CommonSilentFlowRequest } from "./request/CommonSilentFlowRequest.js";
export { CommonDeviceCodeRequest } from "./request/CommonDeviceCodeRequest.js";
export { CommonEndSessionRequest } from "./request/CommonEndSessionRequest.js";
export { CommonUsernamePasswordRequest } from "./request/CommonUsernamePasswordRequest.js";
export { NativeRequest } from "./request/NativeRequest.js";
export { NativeSignOutRequest } from "./request/NativeSignOutRequest.js";
export { RequestParameterBuilder } from "./request/RequestParameterBuilder.js";
export { StoreInCache } from "./request/StoreInCache.js";
export {
    ClientAssertion,
    ClientAssertionConfig,
    ClientAssertionCallback,
} from "./account/ClientCredentials.js";
// Response
export { AzureRegion } from "./authority/AzureRegion.js";
export { AzureRegionConfiguration } from "./authority/AzureRegionConfiguration.js";
export { AuthenticationResult } from "./response/AuthenticationResult.js";
export { AuthorizationCodePayload } from "./response/AuthorizationCodePayload.js";
export { ServerAuthorizationCodeResponse } from "./response/ServerAuthorizationCodeResponse.js";
export { ServerAuthorizationTokenResponse } from "./response/ServerAuthorizationTokenResponse.js";
export { ExternalTokenResponse } from "./response/ExternalTokenResponse.js";
export {
    DeviceCodeResponse,
    ServerDeviceCodeResponse,
} from "./response/DeviceCodeResponse.js";
export {
    ResponseHandler,
    buildAccountToCache,
} from "./response/ResponseHandler.js";
export { ScopeSet } from "./request/ScopeSet.js";
export { AuthenticationHeaderParser } from "./request/AuthenticationHeaderParser.js";
// Logger Callback
export { ILoggerCallback, LogLevel, Logger } from "./logger/Logger.js";
// Errors
export {
    InteractionRequiredAuthError,
    InteractionRequiredAuthErrorCodes,
    InteractionRequiredAuthErrorMessage,
    createInteractionRequiredAuthError,
} from "./error/InteractionRequiredAuthError.js";
export {
    AuthError,
    AuthErrorMessage,
    AuthErrorCodes,
    createAuthError,
} from "./error/AuthError.js";
export { ServerError } from "./error/ServerError.js";
export { CacheError, CacheErrorCodes } from "./error/CacheError.js";
export {
    ClientAuthError,
    ClientAuthErrorMessage,
    ClientAuthErrorCodes,
    createClientAuthError,
} from "./error/ClientAuthError.js";
export {
    ClientConfigurationError,
    ClientConfigurationErrorMessage,
    ClientConfigurationErrorCodes,
    createClientConfigurationError,
} from "./error/ClientConfigurationError.js";
// Constants and Utils
export { getClientAssertion } from "./utils/ClientAssertionUtils.js";
export {
    Constants,
    OIDC_DEFAULT_SCOPES,
    PromptValue,
    PersistentCacheKeys,
    ServerResponseType,
    ResponseMode,
    CacheOutcome,
    CredentialType,
    CacheType,
    CacheAccountType,
    AuthenticationScheme,
    CodeChallengeMethodValues,
    PasswordGrantConstants,
    ThrottlingConstants,
    ClaimsRequestKeys,
    HeaderNames,
    Errors,
    THE_FAMILY_ID,
    ONE_DAY_IN_MS,
    GrantType,
    AADAuthorityConstants,
    HttpStatus,
    DEFAULT_TOKEN_RENEWAL_OFFSET_SEC,
    JsonWebTokenTypes,
} from "./utils/Constants.js";
export { AADServerParamKeys };
export { StringUtils } from "./utils/StringUtils.js";
export { StringDict } from "./utils/MsalTypes.js";
export {
    ProtocolUtils,
    RequestStateObject,
    LibraryStateObject,
} from "./utils/ProtocolUtils.js";
export { TimeUtils, UrlUtils, ClientAssertionUtils };
export * from "./utils/FunctionWrappers.js";
// Server Telemetry
export { ServerTelemetryManager } from "./telemetry/server/ServerTelemetryManager.js";
export { ServerTelemetryRequest } from "./telemetry/server/ServerTelemetryRequest.js";

// Performance Telemetry
export {
    IPerformanceClient,
    PerformanceCallbackFunction,
    InProgressPerformanceEvent,
    QueueMeasurement,
} from "./telemetry/performance/IPerformanceClient.js";
export {
    IntFields,
    PerformanceEvent,
    PerformanceEvents,
    PerformanceEventStatus,
    SubMeasurement,
} from "./telemetry/performance/PerformanceEvent.js";
export { IPerformanceMeasurement } from "./telemetry/performance/IPerformanceMeasurement.js";
export {
    PerformanceClient,
    PreQueueEvent,
} from "./telemetry/performance/PerformanceClient.js";
export { StubPerformanceClient } from "./telemetry/performance/StubPerformanceClient.js";

export { PopTokenGenerator } from "./crypto/PopTokenGenerator.js";

export { version } from "./packageMetadata.js";
