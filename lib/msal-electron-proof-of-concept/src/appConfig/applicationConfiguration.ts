// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * @type AuthOptions: Used to configure the auth options in the ApplicationConfiguration object.
 * - clientId       - Client ID of your app registered with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview in Microsoft Identity Platform
 * - authority      - You can configure a specific authority, defaults to " " or "https://login.microsoftonline.com/common"
 * - redirectUri    - The redirect URI of the application, this should be same as the value in the application registration portal. Defaults to `msal://auth`.
 */
export type AuthOptions = {
    clientId: string;
    authority?: string;
    redirectUri?: string;
};

/**
 * Use the ApplicationConfiguration object to configure MSAL and initialize your PublicClientApplication.
 *
 * This object allows you to configure your application to use important elements of MSAL functionality.
 * - auth: this object holds elements that deal with authentication (clientID, Microsoft Identity Platform authority, etc.)
 */

export type ApplicationConfiguration = {
    auth: AuthOptions;
};

const DEFAULT_AUTH_OPTIONS = {
    clientId: '',
    authority: null,
    redirectUri: null,
};

/**
 * MSAL function that sets the default options when not explicitly configured from app developer.
 *
 * @param TAuthOptions Object of type AuthOptions.
 *
 * @returns TApplicationConfiguration object.
 */
export function buildApplicationConfiguration({ auth }: ApplicationConfiguration): ApplicationConfiguration {
    const applicationConfiguration: ApplicationConfiguration = {
        auth: { ...DEFAULT_AUTH_OPTIONS, ...auth },
    };
    return applicationConfiguration;
}
