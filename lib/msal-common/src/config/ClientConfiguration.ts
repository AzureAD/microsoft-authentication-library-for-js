/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule } from "../network/INetworkModule";
import { DEFAULT_CRYPTO_IMPLEMENTATION, ICrypto } from "../crypto/ICrypto";
import { AuthError } from "../error/AuthError";
import { ILoggerCallback, LogLevel } from "../logger/Logger";
import { Constants } from "../utils/Constants";
import { version } from "../packageMetadata";
import { Authority } from "../authority/Authority";
import { AzureCloudInstance } from "../authority/AuthorityOptions";
import { CacheManager, DefaultStorageClass } from "../cache/CacheManager";
import { ServerTelemetryManager } from "../telemetry/server/ServerTelemetryManager";
import { ICachePlugin } from "../cache/interface/ICachePlugin";
import { ISerializableTokenCache } from "../cache/interface/ISerializableTokenCache";

// Token renewal offset default in seconds
const DEFAULT_TOKEN_RENEWAL_OFFSET_SEC = 300;

/**
 * Use the configuration object to configure MSAL Modules and initialize the base interfaces for MSAL.
 *
 * This object allows you to configure important elements of MSAL functionality:
 * - authOptions                - Authentication for application
 * - cryptoInterface            - Implementation of crypto functions
 * - libraryInfo                - Library metadata
 * - telemetry                  - Telemetry options and data
 * - loggerOptions              - Logging for application
 * - networkInterface           - Network implementation
 * - storageInterface           - Storage implementation
 * - systemOptions              - Additional library options
 * - clientCredentials          - Credentials options for confidential clients
 */
export type ClientConfiguration = {
    authOptions: AuthOptions,
    systemOptions?: SystemOptions,
    loggerOptions?: LoggerOptions,
    storageInterface?: CacheManager,
    networkInterface?: INetworkModule,
    cryptoInterface?: ICrypto,
    clientCredentials?: ClientCredentials,
    libraryInfo?: LibraryInfo
    telemetry?: TelemetryOptions,
    serverTelemetryManager?: ServerTelemetryManager | null,
    persistencePlugin?: ICachePlugin | null,
    serializableCache?: ISerializableTokenCache | null,    
    appTokenProvider?: IAppTokenProvider | null
};

export type CommonClientConfiguration = {
    authOptions: Required<AuthOptions>,
    systemOptions: Required<SystemOptions>,
    loggerOptions : Required<LoggerOptions>,
    storageInterface: CacheManager,
    networkInterface : INetworkModule,
    cryptoInterface : Required<ICrypto>,
    libraryInfo : LibraryInfo,
    telemetry: Required<TelemetryOptions>,
    serverTelemetryManager: ServerTelemetryManager | null,
    clientCredentials: ClientCredentials,
    persistencePlugin: ICachePlugin | null,
    serializableCache: ISerializableTokenCache | null, 
    appTokenProvider: IAppTokenProvider | null,
};

/**
 * Extensibility interface, which allows the app developer to return a token, based on the passed-in parameters, instead of fetching tokens from
 * the Identity Provider (AAD).
 * Developers need to construct and return an AppTokenProviderResult object back to MSAL. MSAL will cache the token response
 * in the same way it would do if the result were comming from AAD.
 * This extensibility point is only defined for the client_credential flow, i.e. acquireTokenByClientCredential and
 * meant for Azure SDK to enhance Managed Identity support.
 */
export interface IAppTokenProvider { 
    (appTokenProviderParameters: AppTokenProviderParameters): Promise<AppTokenProviderResult>;
}

/**
 * Input object for the IAppTokenProvider extensiblity. MSAL will create this object, which can be used
 * to help create an AppTokenProviderResult.
 * 
 * - correlationId           - the correlation Id associated with the request
 * - tenantId                - the tenant Id for which the token must be provided
 * - scopes                  - the scopes for which the token must be provided
 * - claims                  - any extra claims that the token must satisfy
 */
export type AppTokenProviderParameters = {
    readonly correlationId?: string;
    readonly tenantId: string;
    readonly scopes: Array<string>;
    readonly claims?: string;
};

/**
 * Output object for IAppTokenProvider extensiblity. 
 * 
 * - accessToken            - the actual access token, typically in JWT format, that satisfies the request data AppTokenProviderParameters 
 * - expiresInSeconds       - how long the tokens has before expiry, in seconds. Similar to the "expires_in" field in an AAD token response.
 * - refreshInSeconds       - how long the token has before it should be proactively refreshed. Similar to the "refresh_in" field in an AAD token response.
 */
export type AppTokenProviderResult = {
    accessToken: string;
    expiresInSeconds: number;
    refreshInSeconds?: number;
};

/**
 * Advanced options that modify the behavior of MSAL.
 * 
 * - appTokenProvider      - a callback which allows the app developer to return a token and metadata, instead of fetching tokens from
 * the Identity Provider (AAD). For use only with client_credential flow. This extensibility point is meant for Azure SDK to improve support of Managed Identity tokens.
 */
export type ExtensibilityOptions = {
    appTokenProvider: IAppTokenProvider ;
};

/**
 * Use this to configure the auth options in the ClientConfiguration object
 *
 * - clientId                    - Client ID of your app registered with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview in Microsoft Identity Platform
 * - authority                   - You can configure a specific authority, defaults to " " or "https://login.microsoftonline.com/common"
 * - knownAuthorities            - An array of URIs that are known to be valid. Used in B2C scenarios.
 * - cloudDiscoveryMetadata      - A string containing the cloud discovery response. Used in AAD scenarios.
 * - clientCapabilities          - Array of capabilities which will be added to the claims.access_token.xms_cc request property on every network request.
 * - protocolMode                - Enum that represents the protocol that msal follows. Used for configuring proper endpoints.
 */
export type AuthOptions = {
    clientId: string;
    authority: Authority;
    clientCapabilities?: Array<string>;
    azureCloudOptions?: AzureCloudOptions;
};

/**
 * Use this to configure token renewal info in the Configuration object
 *
 * - tokenRenewalOffsetSeconds    - Sets the window of offset needed to renew the token before expiry
 */
export type SystemOptions = {
    tokenRenewalOffsetSeconds?: number;
    preventCorsPreflight?: boolean;
    proxyUrl?: string;
};

/**
 *  Use this to configure the logging that MSAL does, by configuring logger options in the Configuration object
 *
 * - loggerCallback                - Callback for logger
 * - piiLoggingEnabled             - Sets whether pii logging is enabled
 * - logLevel                      - Sets the level at which logging happens
 * - correlationId                 - Sets the correlationId printed by the logger
 */
export type LoggerOptions = {
    loggerCallback?: ILoggerCallback,
    piiLoggingEnabled?: boolean,
    logLevel?: LogLevel,
    correlationId?: string
};

/**
 * Library-specific options
 */
export type LibraryInfo = {
    sku: string,
    version: string,
    cpu: string,
    os: string
};

/**
 * Credentials for confidential clients
 */

export type ClientAssertion = {
    assertion: string,
    assertionType: string
};

export type ClientCredentials = {
    clientSecret?: string,
    clientAssertion?: ClientAssertion, 
};

/**
 * AzureCloudInstance specific options
 *
 * - azureCloudInstance             - string enum providing short notation for soverign and public cloud authorities
 * - tenant                         - provision to provide the tenant info
 */
export type AzureCloudOptions = {
    azureCloudInstance: AzureCloudInstance;
    tenant?: string,
};

export type TelemetryOptions = {
    application: ApplicationTelemetry;
};

/**
 * Telemetry information sent on request
 * - appName: Unique string name of an application
 * - appVersion: Version of the application using MSAL
 */
export type ApplicationTelemetry = {
    appName: string;
    appVersion: string;
};

export const DEFAULT_SYSTEM_OPTIONS: Required<SystemOptions> = {
    tokenRenewalOffsetSeconds: DEFAULT_TOKEN_RENEWAL_OFFSET_SEC,
    preventCorsPreflight: false,
    proxyUrl: Constants.EMPTY_STRING
};

const DEFAULT_LOGGER_IMPLEMENTATION: Required<LoggerOptions> = {
    loggerCallback: () => {
        // allow users to not set loggerCallback
    },
    piiLoggingEnabled: false,
    logLevel: LogLevel.Info,
    correlationId: Constants.EMPTY_STRING
};

const DEFAULT_NETWORK_IMPLEMENTATION: INetworkModule = {
    async sendGetRequestAsync<T>(): Promise<T> {
        const notImplErr = "Network interface - sendGetRequestAsync() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    async sendPostRequestAsync<T>(): Promise<T> {
        const notImplErr = "Network interface - sendPostRequestAsync() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    }
};

const DEFAULT_LIBRARY_INFO: LibraryInfo = {
    sku: Constants.SKU,
    version: version,
    cpu: Constants.EMPTY_STRING,
    os: Constants.EMPTY_STRING
};

const DEFAULT_CLIENT_CREDENTIALS: ClientCredentials = {
    clientSecret: Constants.EMPTY_STRING,
    clientAssertion: undefined
};

const DEFAULT_AZURE_CLOUD_OPTIONS: AzureCloudOptions = {
    azureCloudInstance: AzureCloudInstance.None,
    tenant: `${Constants.DEFAULT_COMMON_TENANT}`
};

const DEFAULT_TELEMETRY_OPTIONS: Required<TelemetryOptions> = {
    application: {
        appName: "",
        appVersion: ""
    }
};

/**
 * Function that sets the default options when not explicitly configured from app developer
 *
 * @param Configuration
 *
 * @returns Configuration
 */
export function buildClientConfiguration(
    {
        authOptions: userAuthOptions,
        systemOptions: userSystemOptions,
        loggerOptions: userLoggerOption,
        storageInterface: storageImplementation,
        networkInterface: networkImplementation,
        cryptoInterface: cryptoImplementation,
        clientCredentials: clientCredentials,
        libraryInfo: libraryInfo,
        telemetry: telemetry,
        serverTelemetryManager: serverTelemetryManager,
        persistencePlugin: persistencePlugin,
        serializableCache: serializableCache,         
        appTokenProvider: appTokenProvider,
    }: ClientConfiguration): CommonClientConfiguration {

    const loggerOptions = { ...DEFAULT_LOGGER_IMPLEMENTATION, ...userLoggerOption };

    return {
        authOptions: buildAuthOptions(userAuthOptions),
        systemOptions: { ...DEFAULT_SYSTEM_OPTIONS, ...userSystemOptions },
        loggerOptions: loggerOptions,
        storageInterface: storageImplementation || new DefaultStorageClass(userAuthOptions.clientId, DEFAULT_CRYPTO_IMPLEMENTATION),
        networkInterface: networkImplementation || DEFAULT_NETWORK_IMPLEMENTATION,
        cryptoInterface: cryptoImplementation || DEFAULT_CRYPTO_IMPLEMENTATION,
        clientCredentials: clientCredentials || DEFAULT_CLIENT_CREDENTIALS,
        libraryInfo: { ...DEFAULT_LIBRARY_INFO, ...libraryInfo },
        telemetry: { ...DEFAULT_TELEMETRY_OPTIONS, ...telemetry },
        serverTelemetryManager: serverTelemetryManager || null,
        persistencePlugin: persistencePlugin || null,
        serializableCache: serializableCache || null,  
        appTokenProvider: appTokenProvider || null       
    };
}

/**
 * Construct authoptions from the client and platform passed values
 * @param authOptions
 */
function buildAuthOptions(authOptions: AuthOptions): Required<AuthOptions> {
    return {
        clientCapabilities: [],
        azureCloudOptions: DEFAULT_AZURE_CLOUD_OPTIONS,
        ...authOptions
    };
}
