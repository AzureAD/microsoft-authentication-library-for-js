/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ICacheStorage } from "../../cache/ICacheStorage";
import { INetworkModule } from "../../network/INetworkModule";
import { ICrypto, PkceCodes } from "../../utils/crypto/ICrypto";
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

const DEFAULT_STORAGE_OPTIONS: ICacheStorage = {
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

const DEFAULT_NETWORK_OPTIONS: INetworkModule = {
    async sendRequestAsync(url: string, method: RequestInit): Promise<any> {
        const notImplErr = "Network interface - sendRequestAsync() has not been implemented";
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
export function buildModuleConfiguration({ storageInterface, networkInterface, cryptoInterface }: ModuleConfiguration): ModuleConfiguration {
    const overlayedConfig: ModuleConfiguration = {
        storageInterface: { ...DEFAULT_STORAGE_OPTIONS, ...storageInterface },
        networkInterface: { ...DEFAULT_NETWORK_OPTIONS, ...networkInterface },
        cryptoInterface: { ...DEFAULT_CRYPTO_IMPLEMENTATION, ...cryptoInterface }
    };
    return overlayedConfig;
}
