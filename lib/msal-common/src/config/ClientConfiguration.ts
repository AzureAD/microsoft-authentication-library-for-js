/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule } from "../network/INetworkModule";
import { ICrypto, PkceCodes } from "../crypto/ICrypto";
import { AuthError } from "../error/AuthError";
import { ILoggerCallback, LogLevel } from "../logger/Logger";
import { Constants } from "../utils/Constants";
import { version } from "../../package.json";
import { Authority } from "../authority/Authority";
import { CacheManager, DefaultStorageClass } from "../cache/CacheManager";

// Token renewal offset default in seconds
const DEFAULT_TOKEN_RENEWAL_OFFSET_SEC = 300;

/**
 * Use the configuration object to configure MSAL Modules and initialize the base interfaces for MSAL.
 *
 * This object allows you to configure important elements of MSAL functionality:
 * - logger: logging for application
 * - storage: this is where you configure storage implementation.
 * - network: this is where you can configure network implementation.
 * - crypto: implementation of crypto functions
 */
export type ClientConfiguration = {
    authOptions: AuthOptions,
    systemOptions?: SystemOptions,
    loggerOptions?: LoggerOptions,
    storageInterface?: CacheManager,
    networkInterface?: INetworkModule,
    cryptoInterface?: ICrypto,
    libraryInfo?: LibraryInfo
};

/**
 * @type AuthOptions: Use this to configure the auth options in the Configuration object
 *
 *  - clientId                    - Client ID of your app registered with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview in Microsoft Identity Platform
 *  - authority                   - You can configure a specific authority, defaults to " " or "https://login.microsoftonline.com/common"
 */
export type AuthOptions = {
    clientId: string;
    authority?: Authority;
    knownAuthorities?: Array<string>;
    cloudDiscoveryMetadata?: string;
};

/**
 * Telemetry Config Options
 * - applicationName              - Name of the consuming apps application
 * - applicationVersion           - Version of the consuming application
 * - telemetryEmitter             - Function where telemetry events are flushed to
 */
export type TelemetryOptions = {
    applicationName: string;
    applicationVersion: string;
    // TODO, add onlyAddFailureTelemetry option
};

/**
 * Library Specific Options
 *
 * - tokenRenewalOffsetSeconds    - sets the window of offset needed to renew the token before expiry
 * - telemetry                    - Telemetry options for library network requests
 */
export type SystemOptions = {
    tokenRenewalOffsetSeconds?: number;
    telemetry?: TelemetryOptions;
};

/**
 * Logger options to configure the logging that MSAL does.
 */
export type LoggerOptions = {
    loggerCallback?: ILoggerCallback,
    piiLoggingEnabled?: boolean,
    logLevel?: LogLevel
};

/**
 * Telemetry info about library
 */
export type LibraryInfo = {
    sku: string,
    version: string,
    cpu: string,
    os: string
};

const DEFAULT_AUTH_OPTIONS: AuthOptions = {
    clientId: "",
    authority: null,
    knownAuthorities: [],
    cloudDiscoveryMetadata: ""
};

export const DEFAULT_SYSTEM_OPTIONS: SystemOptions = {
    tokenRenewalOffsetSeconds: DEFAULT_TOKEN_RENEWAL_OFFSET_SEC,
    telemetry: null
};

const DEFAULT_LOGGER_IMPLEMENTATION: LoggerOptions = {
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

const DEFAULT_CRYPTO_IMPLEMENTATION: ICrypto = {
    createNewGuid: (): string => {
        const notImplErr = "Crypto interface - createNewGuid() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    base64Decode: (): string => {
        const notImplErr = "Crypto interface - base64Decode() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    base64Encode: (): string => {
        const notImplErr = "Crypto interface - base64Encode() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    async generatePkceCodes(): Promise<PkceCodes> {
        const notImplErr = "Crypto interface - generatePkceCodes() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    }
};

const DEFAULT_LIBRARY_INFO: LibraryInfo = {
    sku: Constants.SKU,
    version: version,
    cpu: "",
    os: ""
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
        libraryInfo: libraryInfo
    } : ClientConfiguration): ClientConfiguration {
    return {
        authOptions: { ...DEFAULT_AUTH_OPTIONS, ...userAuthOptions },
        systemOptions: { ...DEFAULT_SYSTEM_OPTIONS, ...userSystemOptions },
        loggerOptions: { ...DEFAULT_LOGGER_IMPLEMENTATION, ...userLoggerOption },
        storageInterface: storageImplementation || new DefaultStorageClass(),
        networkInterface: networkImplementation || DEFAULT_NETWORK_IMPLEMENTATION,
        cryptoInterface: cryptoImplementation || DEFAULT_CRYPTO_IMPLEMENTATION,
        libraryInfo: { ...DEFAULT_LIBRARY_INFO, ...libraryInfo }
    };
}
