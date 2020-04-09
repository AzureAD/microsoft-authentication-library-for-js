/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Configuration, buildConfiguration } from "./Configuration";

/**
 * @type SPAAuthOptions: Use this to configure the auth options in the Configuration object
 *
 *  - clientId                    - Client ID of your app registered with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview in Microsoft Identity Platform
 *  - authority                   - You can configure a specific authority, defaults to " " or "https://login.microsoftonline.com/common"
 *  - redirectUri                 - The redirect URI of the application, this should be same as the value in the application registration portal.Defaults to `window.location.href`.
 *  - postLogoutRedirectUri       - Used to redirect the user to this location after logout. Defaults to `window.location.href`.
 */
export type SPAAuthOptions = {
    clientId: string;
    authority?: string;
    knownAuthorities?: Array<string>;
    redirectUri?: string | (() => string);
    postLogoutRedirectUri?: string | (() => string);
};

/**
 * Use the configuration object to configure MSAL and initialize the Clients.
 *
 * This object allows you to configure important elements of MSAL functionality:
 * - auth: this is where you configure auth elements like clientID, authority used for authenticating against the Microsoft Identity Platform
 */
export type SPAConfiguration = Configuration & {
    auth: SPAAuthOptions
};

const DEFAULT_AUTH_OPTIONS: SPAAuthOptions = {
    clientId: "",
    authority: null,
    knownAuthorities: [],
    redirectUri: "",
    postLogoutRedirectUri: ""
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
export function buildPublicClientSPAConfiguration({ auth, loggerOptions, storageInterface, networkInterface, cryptoInterface }: SPAConfiguration): SPAConfiguration {
    const baseConfig = buildConfiguration({loggerOptions, storageInterface, networkInterface, cryptoInterface});
    const overlayedConfig: SPAConfiguration = {
        auth: { ...DEFAULT_AUTH_OPTIONS, ...auth },
        ...baseConfig
    };
    return overlayedConfig;
}
