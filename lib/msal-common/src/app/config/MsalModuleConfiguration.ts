/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ICacheStorage } from "../../cache/ICacheStorage";
import { INetworkModule } from "../../network/INetworkModule";
import { ICrypto, PKCECodes } from "../../utils/crypto/ICrypto";

/**
 * Use the configuration object to configure MSAL Modules and initialize the base interfaces for MSAL.
 *
 * This object allows you to configure important elements of MSAL functionality:
 * - storage: this is where you configure storage implementation.
 * - network: this is where you can configure network implementation.
 * - crypto: implementation of crypto functions
 */
export type MsalModuleConfiguration = {
    storageInterface?: ICacheStorage,
    networkInterface?: INetworkModule,
    cryptoInterface?: ICrypto
};

const DEFAULT_STORAGE_OPTIONS: ICacheStorage = {
    clear: () => {
        console.warn("clear() has not been implemented for the cacheStorage interface.");
    },
    containsKey: (key: string): boolean => {
        console.warn("containsKey() has not been implemented for the cacheStorage interface.");
        return false;
    },
    getItem: (key: string): string => {
        console.warn("getItem() has not been implemented for the cacheStorage interface.");
        return "";
    },
    getKeys: (): string[] => {
        console.warn("getKeys() has not been implemented for the cacheStorage interface.");
        return null;
    },
    removeItem: (key: string) => {
        console.warn("removeItem() has not been implemented for the cacheStorage interface.");
        return;
    },
    setItem: (key: string, value: string) => {
        console.warn("setItem() has not been implemented for the cacheStorage interface.");
        return;
    }
};

const DEFAULT_NETWORK_OPTIONS: INetworkModule = {
    sendRequestAsync: async (url: string, method: RequestInit, enableCaching?: boolean): Promise<any> => {
        console.warn("Network interface - sendRequestAsync() has not been implemented");
        return null;
    }
};

const DEFAULT_CRYPTO_IMPLEMENTATION: ICrypto = {
    base64Decode: (input: string): string => {
        console.warn("Crypto interface - base64Decode() has not been implemented");
        return "";
    },
    base64Encode: (input: string): string => {
        console.warn("Crypto interface - base64Encode() has not been implemented");
        return "";
    },
    async generatePKCECodes(): Promise<PKCECodes> {
        console.warn("Crypto interface - generatePKCECodes() has not been implemented");
        return null;
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
export function buildMsalModuleConfiguration({ storageInterface, networkInterface, cryptoInterface }: MsalModuleConfiguration): MsalModuleConfiguration {
    const overlayedConfig: MsalModuleConfiguration = {
        storageInterface: { ...DEFAULT_STORAGE_OPTIONS, ...storageInterface },
        networkInterface: { ...DEFAULT_NETWORK_OPTIONS, ...networkInterface },
        cryptoInterface: { ...DEFAULT_CRYPTO_IMPLEMENTATION, ...cryptoInterface }
    };
    return overlayedConfig;
}
