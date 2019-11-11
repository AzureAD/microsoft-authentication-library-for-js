/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICacheStorage } from "../cache/ICacheStorage";
import { INetworkModule } from "./INetworkModule";
import { ICrypto, PKCECodes } from "../utils/crypto/ICrypto";
import { ClientAuthError } from "../error/ClientAuthError";

/**
 * @type AuthOptions: Use this to configure the auth options in the Configuration object
 *
 *  - clientId                    - Client ID of your app registered with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview in Microsoft Identity Platform
 *  - authority                   - You can configure a specific authority, defaults to " " or "https://login.microsoftonline.com/common"
 *  - validateAuthority           - Used to turn authority validation on/off. When set to true (default), MSAL will compare the application's authority against well-known URLs templates representing well-formed authorities. It is useful when the authority is obtained at run time to prevent MSAL from displaying authentication prompts from malicious pages.
 *  - redirectUri                 - The redirect URI of the application, this should be same as the value in the application registration portal.Defaults to `window.location.href`.
 *  - postLogoutRedirectUri       - Used to redirect the user to this location after logout. Defaults to `window.location.href`.
 *  - navigateToLoginRequestUrl   - Used to turn off default navigation to start page after login. Default is true. This is used only for redirect flows.
 *
 */
export type AuthOptions = {
    clientId: string;
    clientSecret: string;
    authority?: string;
    validateAuthority?: boolean;
    redirectUri?: string | (() => string);
    postLogoutRedirectUri?: string | (() => string);
    navigateToLoginRequestUrl?: boolean;
};

/**
 * @type InterfaceOptions: Use this to configure the interfaces required for implementation of storage operations
 */
export type StorageOptions = {
    cacheStorageInterface: ICacheStorage
};

/**
 * @type InterfaceOptions: Use this to configure the interfaces required for implementation of network calls
 */
export type NetworkOptions = {
    networkModuleInterface: INetworkModule
};

/**
 * Use the configuration object to configure MSAL and initialize the UserAgentApplication.
 *
 * This object allows you to configure important elements of MSAL functionality:
 * - auth: this is where you configure auth elements like clientID,  authority used for authenticating against the Microsoft Identity Platform
 * - storage: this is where you configure storage implementation.
 * - network: this is where you can configure network implementation.
 */
export type MsalConfiguration = {
    auth: AuthOptions,
    storageInterface: ICacheStorage,
    networkInterface: INetworkModule,
    cryptoInterface: ICrypto
};

const DEFAULT_AUTH_OPTIONS: AuthOptions = {
    clientId: "",
    clientSecret: "",
    authority: null,
    validateAuthority: true,
    redirectUri: (): string => {
        throw ClientAuthError.createRedirectUriEmptyError();
    },
    postLogoutRedirectUri: () => {
        throw ClientAuthError.createPostLogoutRedirectUriEmptyError();
    },
    navigateToLoginRequestUrl: true
};

const DEFAULT_STORAGE_OPTIONS: ICacheStorage = {
    clear: () => {
        console.log("clear() has not been implemented for the cacheStorage interface.");
    },
    containsKey: (key: string): boolean => {
        console.log("containsKey() has not been implemented for the cacheStorage interface.");
        return false;
    },
    getItem: (key: string): string => {
        console.log("getItem() has not been implemented for the cacheStorage interface.");
        return "";
    },
    getKeys: (): string[] => {
        console.log("getKeys() has not been implemented for the cacheStorage interface.");
        return null;
    },
    removeItem: (key: string) => {
        console.log("removeItem() has not been implemented for the cacheStorage interface.");
        return;
    },
    setItem: (key: string, value: string) => {
        console.log("setItem() has not been implemented for the cacheStorage interface.");
        return;
    }
};

const DEFAULT_NETWORK_OPTIONS: INetworkModule = {
    sendRequestAsync: (url: string, method: RequestInit, enableCaching?: boolean): Promise<any> => {
        console.log("Network interface - sendRequestAsync() has not been implemented");
        return null;
    }
};

const DEFAULT_CRYPTO_IMPLEMENTATION: ICrypto = {
    base64Decode: (input: string): string => {
        console.log("Crypto interface - base64Decode() has not been implemented");
        return "";
    },
    base64Encode: (input: string): string => {
        console.log("Crypto interface - base64Encode() has not been implemented");
        return "";
    },
    generatePKCECodes(): Promise<PKCECodes> {
        console.log("Crypto interface - generatePKCECodes() has not been implemented");
        return null;
    }
};

/**
 * Function that sets the default options when not explicitly configured from app developer
 *
 * @param TAuthOptions
 * @param TStorageOptions
 * @param TSystemOptions
 * @param TFrameworkOptions
 *
 * @returns TConfiguration object
 */
export function buildConfiguration({ auth, storageInterface, networkInterface, cryptoInterface }: MsalConfiguration): MsalConfiguration {
    const overlayedConfig: MsalConfiguration = {
        auth: { ...DEFAULT_AUTH_OPTIONS, ...auth },
        storageInterface: { ...DEFAULT_STORAGE_OPTIONS, ...storageInterface },
        networkInterface: { ...DEFAULT_NETWORK_OPTIONS, ...networkInterface },
        cryptoInterface: { ...DEFAULT_CRYPTO_IMPLEMENTATION, ...cryptoInterface }
    };
    return overlayedConfig;
}
