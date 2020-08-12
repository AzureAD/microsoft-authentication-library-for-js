// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Authority } from '../AppConfig/Authority/Authority';
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
     * @param codeVerifier - PKCE Code Verifier that will be compared to the code challenge that was sent to the authorization server before
     */
    constructor(authorityInstance: Authority, clientId: string, redirectUri: string, scopes: string[], authCode: string, codeVerifier: string) {
      super(authorityInstance, clientId, redirectUri, scopes);
      this.options = this.buildRequestBody(authCode, codeVerifier);
    }

    /**
     * Builds the options object that contains
     * the token request URI and form parameters
     */
     private buildRequestBody(authCode: string, codeVerifier: string): TokenRequestOptions {
        const requestUri = this.authority.tokenEndpoint;
        return {
            method: 'POST',
            uri: requestUri,
            form: {
                client_id: this.clientId,
                redirect_uri: this.redirectUrl,
                grant_type: 'authorization_code',
                scope: this.urlScopes,
                code: authCode,
                code_verifier: codeVerifier
            },
            json: true
        };
     }

     public get body(): TokenRequestOptions {
         return this.options;
     }
}
