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

    public buildQueryParameters(): string[] {
        const params = super.buildQueryParameters();
        // TODO: Add state and PKCE Code Challenge/Verifier to requests for security
        return params;
    }

}