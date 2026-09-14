import { PublicClientApplication } from "@azure/msal-node";
import {
    ConfidentialClientApplication,
    ManagedIdentityApplication,
    ClientAssertion,
    TokenCache,
    DistributedCachePlugin,
    ManagedIdentitySourceNames,
    CryptoProvider,
    PromptValue,
    ResponseMode,
    version,
} from "@azure/msal-node/confidential";
import type {
    IConfidentialClientApplication,
    ITokenCache,
    ICacheClient,
    IPartitionManager,
    Configuration,
    ManagedIdentityConfiguration,
    ManagedIdentityIdParams,
    NodeAuthOptions,
    NodeSystemOptions,
    NodeTelemetryOptions,
    CacheOptions,
    CacheKVStore,
    JsonCache,
    InMemoryCache,
    SerializedAccountEntity,
    SerializedIdTokenEntity,
    SerializedAccessTokenEntity,
    SerializedAppMetadataEntity,
    SerializedRefreshTokenEntity,
    AuthorizationCodeRequest,
    AuthorizationUrlRequest,
    ClientCredentialRequest,
    OnBehalfOfRequest,
    UserFederatedIdentityCredentialRequest,
    UsernamePasswordRequest,
    RefreshTokenRequest,
    SilentFlowRequest,
    ManagedIdentityRequestParams,
    AuthenticationResult,
    AuthorizationCodePayload,
    AuthorizeResponse,
    IdTokenClaims,
    AccountInfo,
    ValidCacheType,
    AuthError,
    AuthErrorCodes,
    ClientAuthError,
    ClientAuthErrorCodes,
    ClientConfigurationError,
    ClientConfigurationErrorCodes,
    InteractionRequiredAuthError,
    InteractionRequiredAuthErrorCodes,
    ServerError,
    INetworkModule,
    NetworkRequestOptions,
    NetworkResponse,
    Logger,
    LogLevel,
    ProtocolMode,
    ICachePlugin,
    TokenCacheContext,
    ISerializableTokenCache,
    AzureCloudInstance,
    AzureCloudOptions,
    IAppTokenProvider,
    AppTokenProviderParameters,
    AppTokenProviderResult,
    ClientAssertionCallback,
} from "@azure/msal-node/confidential";

// @ts-expect-error PCA-only class must not be exported from the confidential entry point.
import { PublicClientApplication as ConfidentialPca } from "@azure/msal-node/confidential";
// @ts-expect-error PCA-only interface must not be exported from the confidential entry point.
import type { IPublicClientApplication } from "@azure/msal-node/confidential";
// @ts-expect-error PCA-only request must not be exported from the confidential entry point.
import type { DeviceCodeRequest } from "@azure/msal-node/confidential";
// @ts-expect-error PCA-only request must not be exported from the confidential entry point.
import type { InteractiveRequest } from "@azure/msal-node/confidential";
// @ts-expect-error PCA-only request must not be exported from the confidential entry point.
import type { SignOutRequest } from "@azure/msal-node/confidential";
// @ts-expect-error PCA-only configuration must not be exported from the confidential entry point.
import type { BrokerOptions } from "@azure/msal-node/confidential";
// @ts-expect-error PCA-only broker interface must not be exported from the confidential entry point.
import type { INativeBrokerPlugin } from "@azure/msal-node/confidential";
// @ts-expect-error PCA-only loopback interface must not be exported from the confidential entry point.
import type { ILoopbackClient } from "@azure/msal-node/confidential";

void PublicClientApplication;
void ConfidentialClientApplication;
void ManagedIdentityApplication;
void ClientAssertion;
void TokenCache;
void DistributedCachePlugin;
void ManagedIdentitySourceNames;
void CryptoProvider;
void PromptValue;
void ResponseMode;
void version;
void (undefined as
    | IConfidentialClientApplication
    | ITokenCache
    | ICacheClient
    | IPartitionManager
    | Configuration
    | ManagedIdentityConfiguration
    | ManagedIdentityIdParams
    | NodeAuthOptions
    | NodeSystemOptions
    | NodeTelemetryOptions
    | CacheOptions
    | CacheKVStore
    | JsonCache
    | InMemoryCache
    | SerializedAccountEntity
    | SerializedIdTokenEntity
    | SerializedAccessTokenEntity
    | SerializedAppMetadataEntity
    | SerializedRefreshTokenEntity
    | AuthorizationCodeRequest
    | AuthorizationUrlRequest
    | ClientCredentialRequest
    | OnBehalfOfRequest
    | UserFederatedIdentityCredentialRequest
    | UsernamePasswordRequest
    | RefreshTokenRequest
    | SilentFlowRequest
    | ManagedIdentityRequestParams
    | AuthenticationResult
    | AuthorizationCodePayload
    | AuthorizeResponse
    | IdTokenClaims
    | AccountInfo
    | ValidCacheType
    | AuthError
    | AuthErrorCodes
    | ClientAuthError
    | ClientAuthErrorCodes
    | ClientConfigurationError
    | ClientConfigurationErrorCodes
    | InteractionRequiredAuthError
    | InteractionRequiredAuthErrorCodes
    | ServerError
    | INetworkModule
    | NetworkRequestOptions
    | NetworkResponse<unknown>
    | Logger
    | LogLevel
    | ProtocolMode
    | ICachePlugin
    | TokenCacheContext
    | ISerializableTokenCache
    | AzureCloudInstance
    | AzureCloudOptions
    | IAppTokenProvider
    | AppTokenProviderParameters
    | AppTokenProviderResult
    | ClientAssertionCallback);
void ConfidentialPca;
void (undefined as
    | IPublicClientApplication
    | DeviceCodeRequest
    | InteractiveRequest
    | SignOutRequest
    | BrokerOptions
    | INativeBrokerPlugin
    | ILoopbackClient);
