/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule } from "../network/INetworkModule";
import { DEFAULT_CRYPTO_IMPLEMENTATION, ICrypto } from "../crypto/ICrypto";
import { AuthError } from "../error/AuthError";
import { ILoggerCallback, LogLevel } from "../logger/Logger";
import { Constants } from "../utils/Constants";
import { version } from "../version.json";
import { Authority } from "../authority/Authority";
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
    serverTelemetryManager?: ServerTelemetryManager | null,
    persistencePlugin?: ICachePlugin | null,
    serializableCache?: ISerializableTokenCache | null
};

export type CommonClientConfiguration = {
    authOptions: Required<AuthOptions>,
    systemOptions: Required<SystemOptions>,
    loggerOptions : Required<LoggerOptions>,
    storageInterface: CacheManager,
    networkInterface : INetworkModule,
    cryptoInterface : Required<ICrypto>,
    libraryInfo : LibraryInfo,
    serverTelemetryManager: ServerTelemetryManager | null,
    clientCredentials: ClientCredentials,
    persistencePlugin: ICachePlugin | null,
    serializableCache: ISerializableTokenCache | null
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
};

/**
 * Use this to configure token renewal info in the Configuration object
 *
 * - tokenRenewalOffsetSeconds    - Sets the window of offset needed to renew the token before expiry
 */
export type SystemOptions = {
    tokenRenewalOffsetSeconds?: number;
};

/**
 *  Use this to configure the logging that MSAL does, by configuring logger options in the Configuration object
 *
 * - loggerCallback                - Callback for logger
 * - piiLoggingEnabled             - Sets whether pii logging is enabled
 * - logLevel                      - Sets the level at which logging happens
 */
export type LoggerOptions = {
    loggerCallback?: ILoggerCallback,
    piiLoggingEnabled?: boolean,
    logLevel?: LogLevel
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
export type ClientCredentials = {
    clientSecret?: string,
    clientAssertion? : {
        assertion: string,
        assertionType: string
    };
};

export const DEFAULT_SYSTEM_OPTIONS: Required<SystemOptions> = {
    tokenRenewalOffsetSeconds: DEFAULT_TOKEN_RENEWAL_OFFSET_SEC
};

const DEFAULT_LOGGER_IMPLEMENTATION: Required<LoggerOptions> = {
    loggerCallback: () => {
        // allow users to not set loggerCallback
    },
    piiLoggingEnabled: false,
    logLevel: LogLevel.Info
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
    cpu: "",
    os: ""
};

const DEFAULT_CLIENT_CREDENTIALS: ClientCredentials = {
    clientSecret: "",
    clientAssertion: undefined
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
        serverTelemetryManager: serverTelemetryManager,
        persistencePlugin: persistencePlugin,
        serializableCache: serializableCache
    }: ClientConfiguration): CommonClientConfiguration {

    return {
        authOptions: buildAuthOptions(userAuthOptions),
        systemOptions: { ...DEFAULT_SYSTEM_OPTIONS, ...userSystemOptions },
        loggerOptions: { ...DEFAULT_LOGGER_IMPLEMENTATION, ...userLoggerOption },
        storageInterface: storageImplementation || new DefaultStorageClass(userAuthOptions.clientId, DEFAULT_CRYPTO_IMPLEMENTATION),
        networkInterface: networkImplementation || DEFAULT_NETWORK_IMPLEMENTATION,
        cryptoInterface: cryptoImplementation || DEFAULT_CRYPTO_IMPLEMENTATION,
        clientCredentials: clientCredentials || DEFAULT_CLIENT_CREDENTIALS,
        libraryInfo: { ...DEFAULT_LIBRARY_INFO, ...libraryInfo },
        serverTelemetryManager: serverTelemetryManager || null,
        persistencePlugin: persistencePlugin || null,
        serializableCache: serializableCache || null
    };
}

/**
 * Construct authoptions from the client and platform passed values
 * @param authOptions
 */
function buildAuthOptions(authOptions: AuthOptions): Required<AuthOptions> {
    return {
        clientCapabilities: [],
        ...authOptions
    };
}
