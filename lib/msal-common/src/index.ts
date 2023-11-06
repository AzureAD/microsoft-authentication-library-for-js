/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @packageDocumentation
 * @module @azure/msal-common
 */

export { AuthorizationCodeClient } from "./client/AuthorizationCodeClient";
export { RefreshTokenClient } from "./client/RefreshTokenClient";
export { SilentFlowClient } from "./client/SilentFlowClient";
export { BaseClient } from "./client/BaseClient";
export {
    AuthOptions,
    SystemOptions,
    LoggerOptions,
    CacheOptions,
    DEFAULT_SYSTEM_OPTIONS,
    AzureCloudOptions,
    ApplicationTelemetry,
} from "./config/ClientConfiguration";
export {
    IAppTokenProvider,
    AppTokenProviderParameters,
    AppTokenProviderResult,
} from "./config/AppTokenProvider";
export { ClientConfiguration } from "./config/ClientConfiguration";
// Account
export { AccountInfo, ActiveAccountFilters } from "./account/AccountInfo";
export * as AuthToken from "./account/AuthToken";
export { TokenClaims } from "./account/TokenClaims";
export { TokenClaims as IdTokenClaims } from "./account/TokenClaims";
export { CcsCredential, CcsCredentialType } from "./account/CcsCredential";
export {
    ClientInfo,
    buildClientInfo,
    buildClientInfoFromHomeAccountId,
} from "./account/ClientInfo";
// Authority
export {
    Authority,
    formatAuthorityUri,
    buildStaticAuthorityOptions,
} from "./authority/Authority";
export {
    AuthorityOptions,
    AzureCloudInstance,
    StaticAuthorityOptions,
} from "./authority/AuthorityOptions";
export { AuthorityFactory } from "./authority/AuthorityFactory";
export { AuthorityType } from "./authority/AuthorityType";
export { ProtocolMode } from "./authority/ProtocolMode";
export { OIDCOptions } from "./authority/OIDCOptions";
// Broker
export { INativeBrokerPlugin } from "./broker/nativeBroker/INativeBrokerPlugin";
// Cache
export { CacheManager, DefaultStorageClass } from "./cache/CacheManager";
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
} from "./cache/utils/CacheTypes";
export { CacheRecord } from "./cache/entities/CacheRecord";
export { CredentialEntity } from "./cache/entities/CredentialEntity";
export * as CacheHelpers from "./cache/utils/CacheHelpers";
export { AppMetadataEntity } from "./cache/entities/AppMetadataEntity";
export { AccountEntity } from "./cache/entities/AccountEntity";
export { IdTokenEntity } from "./cache/entities/IdTokenEntity";
export { AccessTokenEntity } from "./cache/entities/AccessTokenEntity";
export { RefreshTokenEntity } from "./cache/entities/RefreshTokenEntity";
export { ServerTelemetryEntity } from "./cache/entities/ServerTelemetryEntity";
export { AuthorityMetadataEntity } from "./cache/entities/AuthorityMetadataEntity";
export { ThrottlingEntity } from "./cache/entities/ThrottlingEntity";
export { ICachePlugin } from "./cache/interface/ICachePlugin";
export { TokenCacheContext } from "./cache/persistence/TokenCacheContext";
export { ISerializableTokenCache } from "./cache/interface/ISerializableTokenCache";
// Network Interface
export {
    INetworkModule,
    NetworkRequestOptions,
    StubbedNetworkModule,
} from "./network/INetworkModule";
export {
    NetworkManager,
    NetworkResponse,
    UrlToHttpRequestOptions,
} from "./network/NetworkManager";
export { ThrottlingUtils } from "./network/ThrottlingUtils";
export { RequestThumbprint } from "./network/RequestThumbprint";
export { IUri } from "./url/IUri";
export { UrlString } from "./url/UrlString";
// Crypto Interface
export {
    ICrypto,
    PkceCodes,
    DEFAULT_CRYPTO_IMPLEMENTATION,
    SignedHttpRequestParameters,
} from "./crypto/ICrypto";
export { SignedHttpRequest, ShrOptions } from "./crypto/SignedHttpRequest";
export { IGuidGenerator } from "./crypto/IGuidGenerator";
export { JoseHeader } from "./crypto/JoseHeader";
// Request
export { BaseAuthRequest } from "./request/BaseAuthRequest";
export { CommonAuthorizationUrlRequest } from "./request/CommonAuthorizationUrlRequest";
export { CommonAuthorizationCodeRequest } from "./request/CommonAuthorizationCodeRequest";
export { CommonRefreshTokenRequest } from "./request/CommonRefreshTokenRequest";
export { CommonClientCredentialRequest } from "./request/CommonClientCredentialRequest";
export { CommonOnBehalfOfRequest } from "./request/CommonOnBehalfOfRequest";
export { CommonSilentFlowRequest } from "./request/CommonSilentFlowRequest";
export { CommonDeviceCodeRequest } from "./request/CommonDeviceCodeRequest";
export { CommonEndSessionRequest } from "./request/CommonEndSessionRequest";
export { CommonUsernamePasswordRequest } from "./request/CommonUsernamePasswordRequest";
export { NativeRequest } from "./request/NativeRequest";
export { NativeSignOutRequest } from "./request/NativeSignOutRequest";
export { RequestParameterBuilder } from "./request/RequestParameterBuilder";
export { StoreInCache } from "./request/StoreInCache";
export { ClientAssertion } from "./account/ClientCredentials";
// Response
export { AzureRegion } from "./authority/AzureRegion";
export { AzureRegionConfiguration } from "./authority/AzureRegionConfiguration";
export { AuthenticationResult } from "./response/AuthenticationResult";
export { AuthorizationCodePayload } from "./response/AuthorizationCodePayload";
export { ServerAuthorizationCodeResponse } from "./response/ServerAuthorizationCodeResponse";
export { ServerAuthorizationTokenResponse } from "./response/ServerAuthorizationTokenResponse";
export { ExternalTokenResponse } from "./response/ExternalTokenResponse";
export {
    DeviceCodeResponse,
    ServerDeviceCodeResponse,
} from "./response/DeviceCodeResponse";
export { ResponseHandler } from "./response/ResponseHandler";
export { ScopeSet } from "./request/ScopeSet";
export { AuthenticationHeaderParser } from "./request/AuthenticationHeaderParser";
// Logger Callback
export { ILoggerCallback, LogLevel, Logger } from "./logger/Logger";
// Errors
export {
    InteractionRequiredAuthError,
    InteractionRequiredAuthErrorCodes,
    InteractionRequiredAuthErrorMessage,
    createInteractionRequiredAuthError,
} from "./error/InteractionRequiredAuthError";
export {
    AuthError,
    AuthErrorMessage,
    AuthErrorCodes,
    createAuthError,
} from "./error/AuthError";
export { ServerError } from "./error/ServerError";
export {
    ClientAuthError,
    ClientAuthErrorMessage,
    ClientAuthErrorCodes,
    createClientAuthError,
} from "./error/ClientAuthError";
export {
    ClientConfigurationError,
    ClientConfigurationErrorMessage,
    ClientConfigurationErrorCodes,
    createClientConfigurationError,
} from "./error/ClientConfigurationError";
// Constants and Utils
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
    SSOTypes,
    PasswordGrantConstants,
    ThrottlingConstants,
    ClaimsRequestKeys,
    HeaderNames,
    AADServerParamKeys,
    Errors,
    THE_FAMILY_ID,
    ONE_DAY_IN_MS,
    GrantType,
    AADAuthorityConstants,
    HttpStatus,
    JsonWebTokenTypes,
} from "./utils/Constants";
export { StringUtils } from "./utils/StringUtils";
export { StringDict } from "./utils/MsalTypes";
export {
    ProtocolUtils,
    RequestStateObject,
    LibraryStateObject,
} from "./utils/ProtocolUtils";
export { TimeUtils } from "./utils/TimeUtils";
export * as UrlUtils from "./utils/UrlUtils";
export * from "./utils/FunctionWrappers";
// Server Telemetry
export { ServerTelemetryManager } from "./telemetry/server/ServerTelemetryManager";
export { ServerTelemetryRequest } from "./telemetry/server/ServerTelemetryRequest";

// Performance Telemetry
export {
    IPerformanceClient,
    PerformanceCallbackFunction,
    InProgressPerformanceEvent,
    QueueMeasurement,
} from "./telemetry/performance/IPerformanceClient";
export {
    IntFields,
    PerformanceEvent,
    PerformanceEvents,
    PerformanceEventStatus,
    SubMeasurement,
} from "./telemetry/performance/PerformanceEvent";
export { IPerformanceMeasurement } from "./telemetry/performance/IPerformanceMeasurement";
export {
    PerformanceClient,
    PreQueueEvent,
} from "./telemetry/performance/PerformanceClient";
export { StubPerformanceClient } from "./telemetry/performance/StubPerformanceClient";

export { PopTokenGenerator } from "./crypto/PopTokenGenerator";

export { version } from "./packageMetadata";
