/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Warning: This set of exports is purely intended to be used by other MSAL libraries, and should be considered potentially unstable. We strongly discourage using them directly, you do so at your own risk.
 * Breaking changes to these APIs will be shipped under a minor version, instead of a major version.
 */

// Cache
export { BrowserCacheManager } from "./cache/BrowserCacheManager";
export { CacheRecord } from "./cache/entities/CacheRecord";
export { ICachePlugin, ISerializableTokenCache, TokenCacheContext, CacheManager } from "@azure/msal-common";

// Clients
export { StandardInteractionClient } from "./interaction_client/StandardInteractionClient";
export { RedirectClient } from "./interaction_client/RedirectClient";
export { PopupClient } from "./interaction_client/PopupClient";
export { SilentIframeClient } from "./interaction_client/SilentIframeClient";
export { SilentCacheClient } from "./interaction_client/SilentCacheClient";
export { SilentRefreshClient } from "./interaction_client/SilentRefreshClient";
export { NativeInteractionClient } from "./interaction_client/NativeInteractionClient";
export { AuthorizationCodeClient, RefreshTokenClient } from "@azure/msal-common";

// Handlers
export { RedirectHandler } from "./interaction_handler/RedirectHandler";
export { EventHandler } from "./event/EventHandler";
export { NativeMessageHandler } from "./broker/nativeBroker/NativeMessageHandler";

// Utilities
export { BrowserStateObject } from "./utils/BrowserProtocolUtils";
export { BrowserConstants, TemporaryCacheKeys } from "./utils/BrowserConstants";

// Crypto
export { CryptoOps } from "./crypto/CryptoOps";
export { ICrypto, PopTokenGenerator } from "@azure/msal-common";

// Browser Errors
export { NativeAuthError } from "./error/NativeAuthError";

// Telemetry
export { BrowserPerformanceClient } from "./telemetry/BrowserPerformanceClient";
export { BrowserPerformanceMeasurement } from "./telemetry/BrowserPerformanceMeasurement";
export {
    ServerTelemetryManager, IPerformanceClient, InProgressPerformanceEvent, StaticFields, ScopeSet
} from "@azure/msal-common";

// Native request and response
export { NativeTokenRequest } from "./broker/nativeBroker/NativeRequest";
export { NativeResponse, MATS } from "./broker/nativeBroker/NativeResponse";

// Requests
export {
    BaseAuthRequest,
    CommonAuthorizationCodeRequest,
    CommonRefreshTokenRequest,
    CommonSilentFlowRequest,
    RequestThumbprint
} from "@azure/msal-common";

// Utils
export {
    RequestStateObject,
    ClaimsRequestKeys,
    ProtocolUtils,
    TimeUtils,
    AADServerParamKeys,
    SSOTypes,
    StringDict,
    ResponseMode,
    LibraryStateObject,
    HeaderNames,
    PasswordGrantConstants,
    ThrottlingConstants,
    THE_FAMILY_ID,
    Errors
} from "@azure/msal-common";

// Client info
export { buildClientInfo, buildClientInfoFromHomeAccountId, ClientInfo } from "@azure/msal-common";

// Account
export { CcsCredential, CcsCredentialType, TokenClaims, AuthToken } from "@azure/msal-common";

// Authority
export { Authority, AuthorityType } from "@azure/msal-common";

// Entities
export {
    AccessTokenEntity, IdTokenEntity, AppMetadataEntity, RefreshTokenEntity, AuthorityMetadataEntity
} from "@azure/msal-common";

// Responses
export {
    ServerAuthorizationTokenResponse, ServerAuthorizationCodeResponse, AuthorizationCodePayload
} from "@azure/msal-common";

