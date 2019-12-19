/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ICacheStorage } from "../../cache/ICacheStorage";
import { INetworkModule, NetworkRequestOptions } from "../../network/INetworkModule";
import { ICrypto, PkceCodes } from "../../crypto/ICrypto";
import { AuthError } from "../../error/AuthError";

/**
 * Use the configuration object to configure MSAL Modules and initialize the base interfaces for MSAL.
 *
 * This object allows you to configure important elements of MSAL functionality:
 * - storage: this is where you configure storage implementation.
 * - network: this is where you can configure network implementation.
 * - crypto: implementation of crypto functions
 */
export type ModuleConfiguration = {
    storageInterface?: ICacheStorage,
    networkInterface?: INetworkModule,
    cryptoInterface?: ICrypto
};

const DEFAULT_STORAGE_IMPLEMENTATION: ICacheStorage = {
    clear: () => {
        const notImplErr = "Storage interface - clear() has not been implemented for the cacheStorage interface.";
        console.warn(notImplErr);
        throw AuthError.createUnexpectedError(notImplErr);
    },
    containsKey: (key: string): boolean => {
        const notImplErr = "Storage interface - containsKey() has not been implemented for the cacheStorage interface.";
        console.warn(notImplErr);
        throw AuthError.createUnexpectedError(notImplErr);
    },
    getItem: (key: string): string => {
        const notImplErr = "Storage interface - getItem() has not been implemented for the cacheStorage interface.";
        console.warn(notImplErr);
        throw AuthError.createUnexpectedError(notImplErr);
    },
    getKeys: (): string[] => {
        const notImplErr = "Storage interface - getKeys() has not been implemented for the cacheStorage interface.";
        console.warn(notImplErr);
        throw AuthError.createUnexpectedError(notImplErr);
    },
    removeItem: (key: string) => {
        const notImplErr = "Storage interface - removeItem() has not been implemented for the cacheStorage interface.";
        console.warn(notImplErr);
        throw AuthError.createUnexpectedError(notImplErr);
    },
    setItem: (key: string, value: string) => {
        const notImplErr = "Storage interface - setItem() has not been implemented for the cacheStorage interface.";
        console.warn(notImplErr);
        throw AuthError.createUnexpectedError(notImplErr);
    }
};

const DEFAULT_NETWORK_IMPLEMENTATION: INetworkModule = {
    async sendGetRequestAsync(url: string, options?: NetworkRequestOptions): Promise<any> {
        const notImplErr = "Network interface - sendGetRequestAsync() has not been implemented";
        console.warn(notImplErr);
        throw AuthError.createUnexpectedError(notImplErr);
    },
    async sendPostRequestAsync(url: string, options?: NetworkRequestOptions): Promise<any> {
        const notImplErr = "Network interface - sendPostRequestAsync() has not been implemented";
        console.warn(notImplErr);
        throw AuthError.createUnexpectedError(notImplErr);
    }
};

const DEFAULT_CRYPTO_IMPLEMENTATION: ICrypto = {
    createNewGuid: (): string => {
        const notImplErr = "Crypto interface - createNewGuid() has not been implemented";
        console.warn(notImplErr);
        throw AuthError.createUnexpectedError(notImplErr);
    },
    base64Decode: (input: string): string => {
        const notImplErr = "Crypto interface - base64Decode() has not been implemented";
        console.warn(notImplErr);
        throw AuthError.createUnexpectedError(notImplErr);
    },
    base64Encode: (input: string): string => {
        const notImplErr = "Crypto interface - base64Encode() has not been implemented";
        console.warn(notImplErr);
        throw AuthError.createUnexpectedError(notImplErr);
    },
    async generatePkceCodes(): Promise<PkceCodes> {
        const notImplErr = "Crypto interface - generatePkceCodes() has not been implemented";
        console.warn(notImplErr);
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
export function buildModuleConfiguration({ storageInterface: storageImplementation, networkInterface: networkImplementation, cryptoInterface: cryptoImplementation }: ModuleConfiguration): ModuleConfiguration {
    const overlayedConfig: ModuleConfiguration = {
        storageInterface: storageImplementation || DEFAULT_STORAGE_IMPLEMENTATION,
        networkInterface: networkImplementation || DEFAULT_NETWORK_IMPLEMENTATION,
        cryptoInterface: cryptoImplementation || DEFAULT_CRYPTO_IMPLEMENTATION
    };
    return overlayedConfig;
}
