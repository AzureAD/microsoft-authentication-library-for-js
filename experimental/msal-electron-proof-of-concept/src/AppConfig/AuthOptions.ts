// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * @type AuthOptions: Used to configure the auth options in the ApplicationConfiguration object.
 * - clientId       - Client ID of your app registered in the application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview in Microsoft Identity Platform
 * - authority      - You can configure a specific authority, defaults to " " or "https://login.microsoftonline.com/common"
 * - redirectUri    - The redirect URI of the application, this should be the same as the value in the application registration portal. Defaults to `msal://auth`.
 */
export type AuthOptions = {
    clientId: string;
    authority?: string;
    redirectUri?: string;
};
