import { Authority } from "../Authority/Authority";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export class ServerRequestParameters {
    private authorityInstance: Authority;
    private clientId: string;
    private redirectUri: string;
    private scopes: string[];
    private state: string;

    /**
     * Constructor
     * @param authority
     * @param clientId
     * @param scope
     * @param redirectUri
     */
    // TODO: Add state and PKCE Code Challenge/Verifier to requests for security
    constructor(authorityInstance: Authority, clientId: string, redirectUri: string, scopes: string[]) {
        this.authorityInstance = authorityInstance;
        this.clientId = clientId;
        this.redirectUri = redirectUri;
        this.scopes = scopes;
    }
}
