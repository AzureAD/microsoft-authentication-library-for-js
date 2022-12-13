/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @packageDocumentation
 * @module @azure/msal-common
 */

export { AuthorizationCodeClient} from "./client/AuthorizationCodeClient";
export { DeviceCodeClient } from "./client/DeviceCodeClient";
export { RefreshTokenClient } from "./client/RefreshTokenClient";
export { ClientCredentialClient } from "./client/ClientCredentialClient";
export { OnBehalfOfClient } from "./client/OnBehalfOfClient";
export { SilentFlowClient } from "./client/SilentFlowClient";
export { UsernamePasswordClient } from "./client/UsernamePasswordClient";
export { AuthOptions, SystemOptions, LoggerOptions, DEFAULT_SYSTEM_OPTIONS, AzureCloudOptions, ApplicationTelemetry } from "./config/ClientConfiguration";
export { IAppTokenProvider, AppTokenProviderParameters, AppTokenProviderResult } from "./config/AppTokenProvider";
export { ClientConfiguration } from "./config/ClientConfiguration";
// Account
export { AccountInfo, ActiveAccountFilters } from "./account/AccountInfo";
export { AuthToken } from "./account/AuthToken";
export { AuthToken as IdToken } from "./account/AuthToken";
export { TokenClaims } from "./account/TokenClaims";
export { TokenClaims as IdTokenClaims } from "./account/TokenClaims";
export { CcsCredential, CcsCredentialType } from "./account/CcsCredential";
export { ClientInfo, buildClientInfo, buildClientInfoFromHomeAccountId } from "./account/ClientInfo";
// Authority
export { Authority } from "./authority/Authority";
export { AuthorityOptions, AzureCloudInstance } from "./authority/AuthorityOptions";
export { AuthorityFactory } from "./authority/AuthorityFactory";
export { AuthorityType } from "./authority/AuthorityType";
export { ProtocolMode } from "./authority/ProtocolMode";
// Cache
export { CacheManager, DefaultStorageClass } from "./cache/CacheManager";
export { AccountCache, AccessTokenCache, IdTokenCache, RefreshTokenCache, AppMetadataCache, ValidCacheType, ValidCredentialType } from "./cache/utils/CacheTypes";
export { CacheRecord } from "./cache/entities/CacheRecord";
export { CredentialEntity } from "./cache/entities/CredentialEntity";
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
export { INetworkModule, NetworkRequestOptions, StubbedNetworkModule } from "./network/INetworkModule";
export { NetworkManager, NetworkResponse } from "./network/NetworkManager";
export { ThrottlingUtils } from "./network/ThrottlingUtils";
export { RequestThumbprint } from "./network/RequestThumbprint";
export { IUri } from "./url/IUri";
export { UrlString } from "./url/UrlString";
// Crypto Interface
export { ICrypto, PkceCodes, DEFAULT_CRYPTO_IMPLEMENTATION, SignedHttpRequestParameters } from "./crypto/ICrypto";
export { SignedHttpRequest } from "./crypto/SignedHttpRequest";
export { IGuidGenerator } from "./crypto/IGuidGenerator";
export { JoseHeader } from "./crypto/JoseHeader";
// Request and Response
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
export { AzureRegion } from "./authority/AzureRegion";
export { AzureRegionConfiguration } from "./authority/AzureRegionConfiguration";
export { AuthenticationResult } from "./response/AuthenticationResult";
export { AuthorizationCodePayload } from "./response/AuthorizationCodePayload";
export { ServerAuthorizationCodeResponse } from "./response/ServerAuthorizationCodeResponse";
export { ServerAuthorizationTokenResponse } from "./response/ServerAuthorizationTokenResponse";
export { ExternalTokenResponse } from "./response/ExternalTokenResponse";
export { DeviceCodeResponse } from "./response/DeviceCodeResponse";
export { ScopeSet } from "./request/ScopeSet";
export { AuthenticationHeaderParser } from "./request/AuthenticationHeaderParser";
// Logger Callback
export { ILoggerCallback, LogLevel, Logger } from "./logger/Logger";
// Errors
export { InteractionRequiredAuthError, InteractionRequiredAuthErrorMessage } from "./error/InteractionRequiredAuthError";
export { AuthError, AuthErrorMessage } from "./error/AuthError";
export { ServerError } from "./error/ServerError";
export { ClientAuthError, ClientAuthErrorMessage } from "./error/ClientAuthError";
export { ClientConfigurationError, ClientConfigurationErrorMessage } from "./error/ClientConfigurationError";
// Constants and Utils
export { Constants, OIDC_DEFAULT_SCOPES, PromptValue, PersistentCacheKeys, ResponseMode, CacheSchemaType, CredentialType, CacheType, CacheAccountType, AuthenticationScheme, CodeChallengeMethodValues, SSOTypes, PasswordGrantConstants, ThrottlingConstants, ClaimsRequestKeys, HeaderNames, AADServerParamKeys, Errors, THE_FAMILY_ID, ONE_DAY_IN_MS } from "./utils/Constants";
export { StringUtils } from "./utils/StringUtils";
export { StringDict } from "./utils/MsalTypes";
export { ProtocolUtils, RequestStateObject, LibraryStateObject } from "./utils/ProtocolUtils";
export { TimeUtils } from "./utils/TimeUtils";
// Server Telemetry
export { ServerTelemetryManager } from "./telemetry/server/ServerTelemetryManager";
export { ServerTelemetryRequest } from "./telemetry/server/ServerTelemetryRequest";

// Performance Telemetry
export { IPerformanceClient, PerformanceCallbackFunction, InProgressPerformanceEvent } from "./telemetry/performance/IPerformanceClient";
export { PerformanceEvent, PerformanceEvents, PerformanceEventStatus, StaticFields } from "./telemetry/performance/PerformanceEvent";
export { IPerformanceMeasurement } from "./telemetry/performance/IPerformanceMeasurement";
export { PerformanceClient } from "./telemetry/performance/PerformanceClient";
export { StubPerformanceClient } from "./telemetry/performance/StubPerformanceClient";

export { PopTokenGenerator } from "./crypto/PopTokenGenerator";

export { version } from "./packageMetadata";
