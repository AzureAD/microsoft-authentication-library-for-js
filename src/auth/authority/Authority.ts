/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TenantDiscoveryResponse } from "./TenantDiscoveryResponse";
import { UrlString } from "../../url/UrlString";
import { IUri } from "../../url/IUri";
import { ClientAuthError } from "../../error/ClientAuthError";
import { INetworkModule } from "../../network/INetworkModule";

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

    private _canonicalAuthority: UrlString;
    private _canonicalAuthorityUrlComponents: IUri;
    private tenantDiscoveryResponse: TenantDiscoveryResponse;
    protected networkInterface: INetworkModule;

    public abstract get authorityType(): AuthorityType;
    public abstract get isValidationEnabled(): boolean;

    /**
     * A URL that is the authority set by the developer
     */
    public get canonicalAuthority(): string {
        return this._canonicalAuthority.urlString;
    }

    public set canonicalAuthority(url: string) {
        this._canonicalAuthority = new UrlString(url);
        this._canonicalAuthorityUrlComponents = null;
    }

    public get canonicalAuthorityUrlComponents(): IUri {
        if (!this._canonicalAuthorityUrlComponents) {
            this._canonicalAuthorityUrlComponents = this._canonicalAuthority.getUrlComponents();
        }

        return this._canonicalAuthorityUrlComponents;
    }

    public get tenant(): string {
        return this._canonicalAuthorityUrlComponents.PathSegments[0];
    }

    public get authorizationEndpoint(): string {
        if(this.discoveryComplete()) {
            return this.replaceTenant(this.tenantDiscoveryResponse.authorization_endpoint);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    public get tokenEndpoint(): string {
        if(this.discoveryComplete()) {
            return this.replaceTenant(this.tenantDiscoveryResponse.token_endpoint);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    public get endSessionEndpoint(): string {
        if(this.discoveryComplete()) {
            return this.replaceTenant(this.tenantDiscoveryResponse.end_session_endpoint);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    public get selfSignedJwtAudience(): string {
        if(this.discoveryComplete()) {
            return this.replaceTenant(this.tenantDiscoveryResponse.issuer);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    private replaceTenant(urlString: string): string {
        return urlString.replace("{tenant}", this.tenant);
    }

    protected get defaultOpenIdConfigurationEndpoint(): string {
        return `${this.canonicalAuthority}v2.0/.well-known/openid-configuration`;
    }

    constructor(authority: string, networkInterface: INetworkModule) {
        this.canonicalAuthority = authority;

        this._canonicalAuthority.validateAsUri();
        this.networkInterface = networkInterface;
    }

    discoveryComplete(): boolean {
        return !!this.tenantDiscoveryResponse;
    }

    private async discoverEndpoints(openIdConfigurationEndpoint: string): Promise<TenantDiscoveryResponse> {
        return this.networkInterface.sendGetRequestAsync<TenantDiscoveryResponse>(openIdConfigurationEndpoint);
    }

    public abstract async getOpenIdConfigurationAsync(): Promise<string>;

    public async resolveEndpointsAsync(): Promise<void> {
        const openIdConfigEndpoint = await this.getOpenIdConfigurationAsync();
        this.tenantDiscoveryResponse = await this.discoverEndpoints(openIdConfigEndpoint);
    }
}
