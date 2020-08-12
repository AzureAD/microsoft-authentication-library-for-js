// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AuthOptions } from './AuthOptions';
import { DEFAULT_AUTHORITY, DEFAULT_REDIRECT_URI } from './DefaultConstants';

const DEFAULT_AUTH_OPTIONS = {
    authority: DEFAULT_AUTHORITY,
    redirectUri: DEFAULT_REDIRECT_URI,
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
