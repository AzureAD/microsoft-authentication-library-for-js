// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { AuthenticationParameters } from './AuthenticationParameters';
import { AuthOptions } from './AuthOptions';
import { ClientApplicationBase } from './ClientApplicationBase';

/**
 * PublicClientApplication class
 *
 * This class can be instantiated into objects that the developer
 * can use in order to acquire tokens.
 */
export class PublicClientApplication extends ClientApplicationBase {
    constructor(authOptions: AuthOptions) {
        super(authOptions);
    }

    /**
     * The acquireToken method uses the Authorization Code
     * Grant to retrieve an access token from the AAD authorization server,
     * which can be used to make authenticated calls to an resource server
     * such as MS Graph.
     */
    public acquireToken(request: AuthenticationParameters): string {
        return 'Access Token';
    }

}
