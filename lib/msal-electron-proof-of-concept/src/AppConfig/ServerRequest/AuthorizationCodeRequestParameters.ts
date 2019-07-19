import { Authority } from '../Authority/Authority';
import { ServerRequestParameters } from './ServerRequestParameters';

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * The AuthorizationCodeRequestParameters class is used to build
 * Authorization Code Request navigation URls.
 */

export class AuthorizationCodeRequestParameters extends ServerRequestParameters {
    constructor(authorityInstance: Authority, clientId: string, redirectUri: string, scopes: string[]) {
      super(authorityInstance, clientId, redirectUri, scopes);
    }

    public buildRequestUrl(): string {
        const authorizationEndpoint = this.authority.authorizationEndpoint;
        const queryParameters = this.buildQueryParameters();
        const queryParameterString = queryParameters.join('&');
        const navigateUrl = `${authorizationEndpoint}${queryParameterString}`;
        return navigateUrl;
    }

    /**
     * Extends ServerRequestParameters buildQueryParameters by appending
     * Auth Code request specific query paramters to the query parameters array.
     */
    public buildQueryParameters(): string[] {
        const params = super.buildQueryParameters();
        params.push('response_type=code');
        params.push('response_mode=query');
        // TODO: Add state and PKCE Code Challenge/Verifier to requests for security
        return params;
    }

}