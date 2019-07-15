// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AuthOptions } from './AuthOptions';

const DEFAULT_AUTH_OPTIONS = {
    authority: 'https://login.microsoftonline.com/common/',
    redirectUri: 'msalElectron://auth',
};

/**
 * Use the ApplicationConfiguration object to configure MSAL and initialize your PublicClientApplication.
 *
 * This object allows you to configure your application to use important elements of MSAL functionality.
 * - auth: this object holds elements that deal with authentication (clientID, Microsoft identity platform authority, etc.)
 */

export class ApplicationConfiguration {
    public authOptions: AuthOptions;

    constructor(authOptions: AuthOptions) {
        this.authOptions = { ...DEFAULT_AUTH_OPTIONS, ...authOptions };
    }
}
