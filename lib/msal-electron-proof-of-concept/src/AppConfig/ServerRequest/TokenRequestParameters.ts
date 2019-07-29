// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Authority } from '../Authority/Authority';
import { ServerRequestParameters } from './ServerRequestParameters';
import { TokenRequestOptions } from './TokenRequestOptions';

/**
 * The TokenRequestParameters class is used to build
 * URLs for requests to the token endpoint of the
 * authorization server.
 */

export class TokenRequestParameters extends ServerRequestParameters {
    private options: TokenRequestOptions;

    /**
     * Constructor
     * @param authCode - Authorization Code that will be exchanged for an access token
     */
    constructor(authorityInstance: Authority, clientId: string, redirectUri: string, scopes: string[], authCode: string) {
      super(authorityInstance, clientId, redirectUri, scopes);
      this.options = this.buildRequestBody(authorityInstance, clientId, redirectUri, scopes, authCode);
    }

    /**
     * Builds the Token request URL using the parameters
     * defined by the Client Application's configuration
     */
    public buildRequestUrl(): string {
        // Get  Token Endpoint from Authority
        const tokenEndpoint = this.authority.tokenEndpoint;
        // Get query parameters array
        const queryParameters = this.buildQueryParameters();
        // Build query parameter string
        const queryParameterString = queryParameters.join('&');
        // Concatenate URL elements
        const tokenRequestUrl = `${tokenEndpoint}${queryParameterString}`;
        return tokenRequestUrl;
    }

    /**
     * Builds the options object that contains
     * the token request URI and form parameters
     */
     private buildRequestBody(authorityInstance: Authority, clientId: string, redirectUri: string, scopes: string[], authCode: string): TokenRequestOptions {
        const requestUri = authorityInstance.tokenEndpoint;
        const scope = scopes.join(' ');
        return {
            method: 'POST',
            uri: requestUri,
            form: {
                client_id: clientId,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
                code: authCode,
                scope
            },
            json: true
        };
     }

     public get body(): TokenRequestOptions {
         return this.options;
     }
}
