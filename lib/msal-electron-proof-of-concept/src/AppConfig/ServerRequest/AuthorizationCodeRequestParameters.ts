// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { Authority } from '../Authority/Authority';
import { ServerRequestParameters } from './ServerRequestParameters';

/**
 * The AuthorizationCodeRequestParameters class is used to build
 * Authorization Code Request navigation URls.
 */

export class AuthorizationCodeRequestParameters extends ServerRequestParameters {
    constructor(authorityInstance: Authority, clientId: string, redirectUri: string, scopes: string[]) {
      super(authorityInstance, clientId, redirectUri, scopes);
    }

    /**
     * Builds the Authorization Code request URL using the parameters
     * defined by the Client Application's configuration
     */
    public buildRequestUrl(): string {
        // Get Authorization Endpoint from Authority
        const authorizationEndpoint = this.authority.authorizationEndpoint;
        // Get query parameters array
        const queryParameters = this.buildQueryParameters();
        // Build query parameter string
        const queryParameterString = queryParameters.join('&');
        // Concatenate URL elements
        const navigateUrl = `${authorizationEndpoint}${queryParameterString}`;
        return navigateUrl;
    }

    /**
     * Extends ServerRequestParameters buildQueryParameters by appending
     * Auth Code request specific query paramters to the query parameters array.
     */
    public buildQueryParameters(): string[] {
        const queryParams = super.buildQueryParameters();
        queryParams.push('response_type=code');
        queryParams.push('response_mode=query');
        // TODO: Add state and PKCE Code Challenge/Verifier to requests for security
        return queryParams;
    }
}
