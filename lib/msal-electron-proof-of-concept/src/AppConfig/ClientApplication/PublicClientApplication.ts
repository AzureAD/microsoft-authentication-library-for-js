// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { AuthenticationParameters } from '../AuthenticationParameters';
import { AuthOptions } from '../AuthOptions';
import { ClientConfigurationError } from '../Error/ClientConfigurationError';
import { ServerRequestParameters } from '../ServerRequest/ServerRequestParameters';
import { ClientApplicationBase } from './ClientApplicationBase';

import { strict as assert } from 'assert';
import { AadAuthority } from '../Authority/AadAuthority';

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
        // Validate and filter scopes
        this.validateInputScopes(request.scopes);
        const authorityUrl = request.authority ? request.authority : this.authorityUrl;
        const authorityInstance = new AadAuthority(this.authorityUrl);

        const serverAuthenticationRequest = new ServerRequestParameters(
            authorityInstance,
            this.clientId,
            this.redirectUri,
            request.scopes);
        return 'Access Token';
    }

    private validateInputScopes(scopes: string[]): void {
        // Check that scopes are present
        assert(scopes, ClientConfigurationError.createScopesRequiredError(scopes));

        // Check that scopes is an array
        if (!Array.isArray(scopes)) {
            throw ClientConfigurationError.createScopesNonArrayError(scopes);
        }

        // Check that scopes array is non-empty
        if (scopes.length < 1) {
            throw ClientConfigurationError.createEmptyScopesArrayError(scopes);
        }
    }

}
