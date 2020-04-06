/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ICacheStorage } from "../cache/ICacheStorage";
import { INetworkModule } from "../network/INetworkModule";
import { ICrypto, PkceCodes } from "../crypto/ICrypto";
import { AuthError } from "../error/AuthError";
import { ILoggerCallback, LogLevel } from "../logger/Logger";

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
export type Configuration = {
    authOptions?: AuthOptions,
    systemOptions?: SystemOptions,
    loggerOptions?: LoggerOptions,
    storageInterface?: ICacheStorage,
    networkInterface?: INetworkModule,
    cryptoInterface?: ICrypto
};

/**
 * @type AuthOptions: Use this to configure the auth options in the Configuration object
 *
 *  - clientId                    - Client ID of your app registered with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview in Microsoft Identity Platform
 *  - authority                   - You can configure a specific authority, defaults to " " or "https://login.microsoftonline.com/common"
 */
export type AuthOptions = {
    clientId: string;
    authority?: string;
};

/**
 * Telemetry Config Options
 * - applicationName              - Name of the consuming apps application
 * - applicationVersion           - Verison of the consuming application
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
    telemetry?: TelemetryOptions
};

/**
 * Logger options to configure the logging that MSAL does.
 */
export type LoggerOptions = {
    loggerCallback?: ILoggerCallback,
    piiLoggingEnabled?: boolean,
    logLevel?: LogLevel
};

const DEFAULT_AUTH_OPTIONS: AuthOptions = {
    clientId: "",
    authority: null
};

// Default module system options
const DEFAULT_SYSTEM_OPTIONS: SystemOptions = {
    tokenRenewalOffsetSeconds: DEFAULT_TOKEN_RENEWAL_OFFSET_SEC,
    telemetry: null
};

// Default logger implementation
const DEFAULT_LOGGER_IMPLEMENTATION: LoggerOptions = {
    loggerCallback: () => {
        const notImplErr = "Logger - loggerCallbackInterface() has not been implemented.";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    piiLoggingEnabled: false,
    logLevel: LogLevel.Info
};

// Default storage implementation
const DEFAULT_STORAGE_IMPLEMENTATION: ICacheStorage = {
    clear: () => {
        const notImplErr = "Storage interface - clear() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    containsKey: (): boolean => {
        const notImplErr = "Storage interface - containsKey() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    getItem: (): string => {
        const notImplErr = "Storage interface - getItem() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    getKeys: (): string[] => {
        const notImplErr = "Storage interface - getKeys() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    removeItem: () => {
        const notImplErr = "Storage interface - removeItem() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    setItem: () => {
        const notImplErr = "Storage interface - setItem() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
};

// Default network implementation
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

// Default crypto implementation
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

/**
 * Function that sets the default options when not explicitly configured from app developer
 *
 * @param TStorageOptions
 * @param TSystemOptions
 * @param TFrameworkOptions
 *
 * @returns MsalConfiguration object
 */
export function buildConfiguration({ authOptions: authOptions, systemOptions: userSystemOptions, loggerOptions: userLoggerOption, storageInterface: storageImplementation, networkInterface: networkImplementation, cryptoInterface: cryptoImplementation }: Configuration): Configuration {
    const overlayedConfig: Configuration = {
        authOptions: authOptions || DEFAULT_AUTH_OPTIONS,
        systemOptions: userSystemOptions || DEFAULT_SYSTEM_OPTIONS,
        loggerOptions: userLoggerOption || DEFAULT_LOGGER_IMPLEMENTATION,
        storageInterface: storageImplementation || DEFAULT_STORAGE_IMPLEMENTATION,
        networkInterface: networkImplementation || DEFAULT_NETWORK_IMPLEMENTATION,
        cryptoInterface: cryptoImplementation || DEFAULT_CRYPTO_IMPLEMENTATION
    };
    return overlayedConfig;
}
