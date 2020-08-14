// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Authority } from '../AppConfig/Authority/Authority';

/**
 * ServerRequestParamters is the base class from which AuthorizationCodeRequestParameters
 * and TokenRequestParameters inherit.
 */
export abstract class ServerRequestParameters {
    private authorityInstance: Authority;
    private clientIdentifier: string;
    private redirectUri: string;
    private scopes: string[];

    /**
     * Constructor
     * @param authorityInstance - An instance of any Authority subclass to get authority URL and endpoint URLs
     * @param clientId - Client ID of the app registered in the application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview in Microsoft Identity Platform
     * @param scope - An array of scopes that the application is requesting authorization for
     * @param redirectUri - URI addres on which to listen for redirect responses
     */
    constructor(authorityInstance: Authority, clientId: string, redirectUri: string, scopes: string[]) {
        this.authorityInstance = authorityInstance;
        this.clientIdentifier = clientId;
        this.redirectUri = redirectUri;
        this.scopes = scopes;
    }

    public get authority(): Authority {
        return this.authorityInstance;
    }

    public get clientId(): string {
        return this.clientIdentifier;
    }

    public get redirectUrl(): string {
        return this.redirectUri;
    }

    public get urlScopes(): string {
        return this.scopes.join(' ');
    }

}
