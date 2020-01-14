/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ICacheStorage } from "../../cache/ICacheStorage";
import { INetworkModule, NetworkRequestOptions } from "../../network/INetworkModule";
import { ICrypto, PkceCodes } from "../../crypto/ICrypto";
import { AuthError } from "../../error/AuthError";
import { ILoggerCallback } from "../../logger/Logger";

/**
 * Defaults for the Module Configuration Options
 */
const OFFSET = 300;

/**
 * Use the configuration object to configure MSAL Modules and initialize the base interfaces for MSAL.
 *
 * This object allows you to configure important elements of MSAL functionality:
 * - logger: logging for application
 * - storage: this is where you configure storage implementation.
 * - network: this is where you can configure network implementation.
 * - crypto: implementation of crypto functions
 */
export type ModuleConfiguration = {
    systemOptions?: SystemOptions,
    loggerOptions?: LoggerOptions,
    storageInterface?: ICacheStorage,
    networkInterface?: INetworkModule,
    cryptoInterface?: ICrypto
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
    piiLoggingEnabled?: boolean
};

const DEFAULT_SYSTEM_OPTIONS: SystemOptions = {
    tokenRenewalOffsetSeconds: OFFSET,
    telemetry: null
};

const DEFAULT_LOGGER_IMPLEMENTATION: LoggerOptions = {
    loggerCallback: () => {
        const notImplErr = "Logger - loggerCallbackInterface() has not been implemented.";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    piiLoggingEnabled: false
};

const DEFAULT_STORAGE_IMPLEMENTATION: ICacheStorage = {
    clear: () => {
        const notImplErr = "Storage interface - clear() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    containsKey: (key: string): boolean => {
        const notImplErr = "Storage interface - containsKey() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    getItem: (key: string): string => {
        const notImplErr = "Storage interface - getItem() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    getKeys: (): string[] => {
        const notImplErr = "Storage interface - getKeys() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    removeItem: (key: string) => {
        const notImplErr = "Storage interface - removeItem() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    setItem: (key: string, value: string) => {
        const notImplErr = "Storage interface - setItem() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
};

const DEFAULT_NETWORK_IMPLEMENTATION: INetworkModule = {
    async sendGetRequestAsync(url: string, options?: NetworkRequestOptions): Promise<any> {
        const notImplErr = "Network interface - sendGetRequestAsync() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    async sendPostRequestAsync(url: string, options?: NetworkRequestOptions): Promise<any> {
        const notImplErr = "Network interface - sendPostRequestAsync() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    }
};

const DEFAULT_CRYPTO_IMPLEMENTATION: ICrypto = {
    createNewGuid: (): string => {
        const notImplErr = "Crypto interface - createNewGuid() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    base64Decode: (input: string): string => {
        const notImplErr = "Crypto interface - base64Decode() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    },
    base64Encode: (input: string): string => {
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
export function buildModuleConfiguration({ systemOptions: userSystemOptions, loggerOptions: userLoggerOption, storageInterface: storageImplementation, networkInterface: networkImplementation, cryptoInterface: cryptoImplementation }: ModuleConfiguration): ModuleConfiguration {
    const overlayedConfig: ModuleConfiguration = {
        systemOptions: userSystemOptions || DEFAULT_SYSTEM_OPTIONS,
        loggerOptions: userLoggerOption || DEFAULT_LOGGER_IMPLEMENTATION,
        storageInterface: storageImplementation || DEFAULT_STORAGE_IMPLEMENTATION,
        networkInterface: networkImplementation || DEFAULT_NETWORK_IMPLEMENTATION,
        cryptoInterface: cryptoImplementation || DEFAULT_CRYPTO_IMPLEMENTATION
    };
    return overlayedConfig;
}
