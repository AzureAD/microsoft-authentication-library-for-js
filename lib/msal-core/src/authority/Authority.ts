/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IUri } from "../IUri";
import { ITenantDiscoveryResponse } from "./ITenantDiscoveryResponse";
import { ClientConfigurationErrorMessage, ClientConfigurationError } from "../error/ClientConfigurationError";
import { XhrClient, XhrResponse } from "../XHRClient";
import { UrlUtils } from "../utils/UrlUtils";
import TelemetryManager from "../telemetry/TelemetryManager";
import HttpEvent from "../telemetry/HttpEvent";
import { DEFAULT_AUTHORITY } from '../utils/Constants';

/**
 * @hidden
 */
export enum AuthorityType {
    Aad,
    Adfs,
    B2C
}

/**
 * @hidden
 */
export class Authority {
    constructor(authority: string, validateAuthority: boolean) {
        this.IsValidationEnabled = validateAuthority;
        this.CanonicalAuthority = authority;

        this.validateAsUri();
    }

    public IsValidationEnabled: boolean;

    public static TrustedHostList: Array<string> = [];

    public get Tenant(): string {
        return this.CanonicalAuthorityUrlComponents.PathSegments[0];
    }

    private tenantDiscoveryResponse: ITenantDiscoveryResponse;

    public get AuthorizationEndpoint(): string {
        this.validateResolved();
        return this.tenantDiscoveryResponse.AuthorizationEndpoint.replace(/{tenant}|{tenantid}/g, this.Tenant);
    }

    public get EndSessionEndpoint(): string {
        this.validateResolved();
        return this.tenantDiscoveryResponse.EndSessionEndpoint.replace(/{tenant}|{tenantid}/g, this.Tenant);
    }

    public get SelfSignedJwtAudience(): string {
        this.validateResolved();
        return this.tenantDiscoveryResponse.Issuer.replace(/{tenant}|{tenantid}/g, this.Tenant);
    }

    private validateResolved() {
        if (!this.tenantDiscoveryResponse) {
            throw "Please call ResolveEndpointsAsync first";
        }
    }

    /**
     * A URL that is the authority set by the developer
     */
    public get CanonicalAuthority(): string {
        return this.canonicalAuthority;
    }

    public set CanonicalAuthority(url: string) {
        this.canonicalAuthority = UrlUtils.CanonicalizeUri(url);
        this.canonicalAuthorityUrlComponents = null;
    }

    private canonicalAuthority: string;
    private canonicalAuthorityUrlComponents: IUri;

    public get CanonicalAuthorityUrlComponents(): IUri {
        if (!this.canonicalAuthorityUrlComponents) {
            this.canonicalAuthorityUrlComponents = UrlUtils.GetUrlComponents(this.CanonicalAuthority);
        }

        return this.canonicalAuthorityUrlComponents;
    }

    /**
     * // http://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
     */
    protected get DefaultOpenIdConfigurationEndpoint(): string {
        return `${this.CanonicalAuthority}v2.0/.well-known/openid-configuration`;
    }

    static get AadInstanceDiscoveryEndpoint(): string {
        return `${DEFAULT_AUTHORITY}/discovery/instance?api-version=1.1&authorization_endpoint=${DEFAULT_AUTHORITY}/oauth2/v2.0/authorize`;
    }

    /**
     * Given a string, validate that it is of the form https://domain/path
     */
    private validateAsUri() {
        let components;
        try {
            components = this.CanonicalAuthorityUrlComponents;
        } catch (e) {
            throw ClientConfigurationErrorMessage.invalidAuthorityType;
        }

        if (!components.Protocol || components.Protocol.toLowerCase() !== "https:") {
            throw ClientConfigurationErrorMessage.authorityUriInsecure;
        }

        if (!components.PathSegments || components.PathSegments.length < 1) {
            throw ClientConfigurationErrorMessage.authorityUriInvalidPath;
        }
    }

    /**
     * Calls the OIDC endpoint and returns the response
     */
    private DiscoverEndpoints(openIdConfigurationEndpoint: string, telemetryManager?: TelemetryManager, correlationId?: string): Promise<ITenantDiscoveryResponse> {
        const client = new XhrClient();

        const httpMethod = "GET";
        const httpEvent = new HttpEvent(correlationId);
        httpEvent.url = openIdConfigurationEndpoint;
        httpEvent.httpMethod = httpMethod;
        telemetryManager.startEvent(httpEvent);

        return client.sendRequestAsync(openIdConfigurationEndpoint, httpMethod, /* enableCaching: */ true)
            .then((response: XhrResponse) => {
                httpEvent.httpResponseStatus = response.statusCode;
                telemetryManager.stopEvent(httpEvent);
                return <ITenantDiscoveryResponse>{
                    AuthorizationEndpoint: response.body.authorization_endpoint,
                    EndSessionEndpoint: response.body.end_session_endpoint,
                    Issuer: response.body.issuer
                };
            })
            .catch(err => {
                httpEvent.serverErrorCode = err;
                telemetryManager.stopEvent(httpEvent);
                throw err;
            });
    }

    /**
     * Returns a promise.
     * Checks to see if the authority is in the cache
     * Discover endpoints via openid-configuration
     * If successful, caches the endpoint for later use in OIDC
     */
    public async resolveEndpointsAsync(telemetryManager?: TelemetryManager, correlationId?: string): Promise<Authority> {
        const openIdConfigurationEndpointResponse = await this.GetOpenIdConfigurationEndpoint();
        this.tenantDiscoveryResponse = await this.DiscoverEndpoints(openIdConfigurationEndpointResponse, telemetryManager, correlationId);

        return this;
    }

    /**
     * Returns a promise which resolves to the OIDC endpoint
     * Only responds with the endpoint
     */
    public GetOpenIdConfigurationEndpoint(): string {
        if (!this.IsValidationEnabled || this.IsInTrustedHostList(this.CanonicalAuthorityUrlComponents.HostNameAndPort)) {
            return this.DefaultOpenIdConfigurationEndpoint;
        }

        throw ClientConfigurationError.createUntrustedAuthorityError();
    }

    /**
     * Checks to see if the host is in a list of trusted hosts
     * @param {string} The host to look up
     */
    private IsInTrustedHostList(host: string): boolean {
        console.log("Looking for host");
        console.log(host.toLowerCase());
        console.log(Authority.TrustedHostList);
        return Authority.TrustedHostList.indexOf(host.toLowerCase()) > -1;
    }

    /**
     * Use when validateAuthority is set to True to provide list of allowed domains.
     */
    public static async setKnownAuthorities(validateAuthority: boolean, knownAuthorities: Array<string>, telemetryManager?: TelemetryManager, correlationId?: string): Promise<void> {
        if (validateAuthority && !Authority.TrustedHostList.length){
            knownAuthorities.forEach(function(authority){
                Authority.TrustedHostList.push(authority);
            });

            if (!Authority.TrustedHostList.length){
                console.log("Looking for AAD Hosts in Instance discovery endpoint")
                await this.setTrustedAuthoritiesFromMetadata(telemetryManager, correlationId);
            }
        }

        console.log(Authority.TrustedHostList);
    }

    private static async getAliases(telemetryManager?: TelemetryManager, correlationId?: string): Promise<Array<any>> {
        const client: XhrClient = new XhrClient();

        const httpMethod = "GET";
        const httpEvent: HttpEvent = telemetryManager.createAndStartHttpEvent(correlationId, httpMethod, this.AadInstanceDiscoveryEndpoint);
        return client.sendRequestAsync(this.AadInstanceDiscoveryEndpoint, httpMethod, true)
            .then((response: XhrResponse) => {
                httpEvent.httpResponseStatus = response.statusCode;
                telemetryManager.stopEvent(httpEvent);
                return response.body.metadata;
            })
            .catch(err => {
                httpEvent.serverErrorCode = err;
                telemetryManager.stopEvent(httpEvent);
                throw err;
            });
   }

   private static async setTrustedAuthoritiesFromMetadata(telemetryManager?: TelemetryManager, correlationId?: string): Promise<void> {
        const metadata = await this.getAliases(telemetryManager, correlationId);
        metadata.forEach(function(entry: any){
            const authorities: Array<string> = entry.aliases;
            authorities.forEach(function(authority: string) {
                Authority.TrustedHostList.push(authority);
            });
        });
   } 
}
