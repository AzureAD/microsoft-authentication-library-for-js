// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { Authority } from '../AppConfig/Authority/Authority';
import { ServerRequestParameters } from './ServerRequestParameters';

/**
 * The AuthorizationCodeRequestParameters class is used to build
 * Authorization Code Request navigation URls.
 */
export class AuthorizationCodeRequestParameters extends ServerRequestParameters {
    private state: string;
    private codeChallenge: string;

    constructor(authorityInstance: Authority, clientId: string, redirectUri: string, scopes: string[], state: string, codeChallenge: string) {
      super(authorityInstance, clientId, redirectUri, scopes);
      this.state = state;
      this.codeChallenge = codeChallenge;
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
        const queryParams: string[] = [];
        queryParams.push(`client_id=${encodeURIComponent(this.clientId)}`);
        queryParams.push(`code_challenge=${encodeURIComponent(this.codeChallenge)}`);
        queryParams.push(`redirect_uri=${encodeURIComponent(this.redirectUrl)}`);
        queryParams.push(`scope=${encodeURIComponent(this.urlScopes)}`);
        queryParams.push(`state=${encodeURIComponent(this.state)}`);
        queryParams.push('code_challenge_method=S256');
        queryParams.push('response_type=code');
        queryParams.push('response_mode=query');
        return queryParams;
    }
}
