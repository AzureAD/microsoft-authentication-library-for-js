/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IUri } from "../IUri";
import { ITenantDiscoveryResponse } from "./ITenantDiscoveryResponse";
import { ClientConfigurationErrorMessage } from "../error/ClientConfigurationError";
import { XhrClient, XhrResponse } from "../XHRClient";
import { UrlUtils } from "../utils/UrlUtils";
import TelemetryManager from "../telemetry/TelemetryManager";
import HttpEvent from "../telemetry/HttpEvent";

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
export abstract class Authority {
    constructor(authority: string, validateAuthority: boolean, authorityMetadata?: ITenantDiscoveryResponse) {
        this.IsValidationEnabled = validateAuthority;
        this.CanonicalAuthority = authority;

        this.validateAsUri();
        this.tenantDiscoveryResponse = authorityMetadata;
    }

    public abstract get AuthorityType(): AuthorityType;

    public IsValidationEnabled: boolean;

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
        if (!this.hasCachedMetadata()) {
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
    private DiscoverEndpoints(openIdConfigurationEndpoint: string, telemetryManager: TelemetryManager, correlationId: string): Promise<ITenantDiscoveryResponse> {
        const client = new XhrClient();

        const httpMethod = "GET";
        const httpEvent = new HttpEvent(correlationId, "openIdConfigurationEndpoint");
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
    public async resolveEndpointsAsync(telemetryManager: TelemetryManager, correlationId: string): Promise<ITenantDiscoveryResponse> {
        const openIdConfigurationEndpointResponse = await this.GetOpenIdConfigurationEndpointAsync(telemetryManager, correlationId);
        this.tenantDiscoveryResponse = await this.DiscoverEndpoints(openIdConfigurationEndpointResponse, telemetryManager, correlationId);

        return this.tenantDiscoveryResponse;
    }

    /**
     * Checks if there is a cached tenant discovery response with required fields.
     */
    public hasCachedMetadata(): boolean {
        return !!(this.tenantDiscoveryResponse &&
            this.tenantDiscoveryResponse.AuthorizationEndpoint &&
            this.tenantDiscoveryResponse.EndSessionEndpoint &&
            this.tenantDiscoveryResponse.Issuer);
    }

    /**
     * Returns a promise with the TenantDiscoveryEndpoint
     */
    public abstract GetOpenIdConfigurationEndpointAsync(telemetryManager: TelemetryManager, correlationId: string): Promise<string>;
}
