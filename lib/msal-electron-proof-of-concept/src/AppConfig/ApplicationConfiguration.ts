// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AuthOptions } from './AuthOptions';
import { UriUtils } from '../utils/uriUtils';

const DEFAULT_AUTH_OPTIONS = {
    authority: UriUtils.getDefaultAuthority(),
    redirectUri: UriUtils.getDefaultRedirectUri(),
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
        this.authOptions = authOptions;
    }
}
