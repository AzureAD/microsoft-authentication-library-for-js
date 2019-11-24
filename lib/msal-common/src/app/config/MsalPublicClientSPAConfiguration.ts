/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { MsalModuleConfiguration,buildMsalModuleConfiguration } from "./MsalConfiguration";

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
 * Use the configuration object to configure MSAL and initialize the AuthorizationCodeModule.
 *
 * This object allows you to configure important elements of MSAL functionality:
 * - auth: this is where you configure auth elements like clientID, authority used for authenticating against the Microsoft Identity Platform
 */
export type MsalPublicClientSPAConfiguration = MsalModuleConfiguration & {
    auth: AuthOptions
};

const DEFAULT_AUTH_OPTIONS: AuthOptions = {
    clientId: "",
    clientSecret: "",
    authority: null,
    validateAuthority: true,
    redirectUri: "",
    postLogoutRedirectUri: "",
    navigateToLoginRequestUrl: true
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
export function buildMsalPublicClientSPAConfiguration({ auth, storageInterface, networkInterface, cryptoInterface }: MsalPublicClientSPAConfiguration): MsalPublicClientSPAConfiguration {
    const baseConfig = buildMsalModuleConfiguration({storageInterface, networkInterface, cryptoInterface});
    const overlayedConfig: MsalPublicClientSPAConfiguration = {
        auth: { ...DEFAULT_AUTH_OPTIONS, ...auth },
        ...baseConfig
    };
    return overlayedConfig;
}
