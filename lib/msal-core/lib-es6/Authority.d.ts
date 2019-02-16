import { IUri } from "./IUri";
/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/**
 * @hidden
 */
export declare enum AuthorityType {
    Aad = 0,
    Adfs = 1,
    B2C = 2
}
/**
 * @hidden
 */
export declare abstract class Authority {
    constructor(authority: string, validateAuthority: boolean);
    abstract readonly AuthorityType: AuthorityType;
    IsValidationEnabled: boolean;
    readonly Tenant: string;
    private tenantDiscoveryResponse;
    readonly AuthorizationEndpoint: string;
    readonly EndSessionEndpoint: string;
    readonly SelfSignedJwtAudience: string;
    private validateResolved;
    /**
     * A URL that is the authority set by the developer
     */
    CanonicalAuthority: string;
    private canonicalAuthority;
    private canonicalAuthorityUrlComponents;
    readonly CanonicalAuthorityUrlComponents: IUri;
    /**
     * // http://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
     */
    protected readonly DefaultOpenIdConfigurationEndpoint: string;
    /**
     * Given a string, validate that it is of the form https://domain/path
     */
    private validateAsUri;
    /**
     * Calls the OIDC endpoint and returns the response
     */
    private DiscoverEndpoints;
    /**
     * Returns a promise.
     * Checks to see if the authority is in the cache
     * Discover endpoints via openid-configuration
     * If successful, caches the endpoint for later use in OIDC
     */
    ResolveEndpointsAsync(): Promise<Authority>;
    /**
     * Returns a promise with the TenantDiscoveryEndpoint
     */
    abstract GetOpenIdConfigurationEndpointAsync(): Promise<string>;
}
