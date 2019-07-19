import { Authority } from '../Authority/Authority';

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * ServerRequestParamters is the base class from which AuthorizationCodeRequestParameters
 * and TokenRequestParameters inherit.
 */
export abstract class ServerRequestParameters {
    private authorityInstance: Authority;
    private clientId: string;
    private redirectUri: string;
    private scopes: string[];

    /**
     * Constructor
     * @param authority
     * @param clientId
     * @param scope
     * @param redirectUri
     */
    constructor(authorityInstance: Authority, clientId: string, redirectUri: string, scopes: string[]) {
        this.authorityInstance = authorityInstance;
        this.clientId = clientId;
        this.redirectUri = redirectUri;
        this.scopes = scopes;
    }

    public get authority(): Authority {
        return this.authorityInstance;
    }

    public buildQueryParameters(): string[] {
        const params: string[] = [];
        const scope = this.scopes.join(' ');
        params.push(`client_Id=${encodeURIComponent(this.clientId)}`);
        params.push(`redirect_uri=${encodeURIComponent(this.redirectUri)}`);
        params.push(`scope=${encodeURIComponent(scope)}`);
        return params;
    }
}
