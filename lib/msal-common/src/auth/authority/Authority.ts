/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ITenantDiscoveryResponse } from "./ITenantDiscoveryResponse";
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
    private tenantDiscoveryResponse: ITenantDiscoveryResponse;
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
        if(this.discoveryComplete) {
            return this.tenantDiscoveryResponse.AuthorizationEndpoint.replace("{tenant}", this.tenant);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError();
        }
    }

    public get tokenEndpoint(): string {
        if(this.discoveryComplete) {
            return this.tenantDiscoveryResponse.TokenEndpoint.replace("{tenant}", this.tenant);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError();
        }
    }

    public get endSessionEndpoint(): string {
        if(this.discoveryComplete) {
            return this.tenantDiscoveryResponse.EndSessionEndpoint.replace("{tenant}", this.tenant);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError();
        }
    }

    public get selfSignedJwtAudience(): string {
        if(this.discoveryComplete) {
            return this.tenantDiscoveryResponse.Issuer.replace("{tenant}", this.tenant);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError();
        }
    }

    protected get defaultOpenIdConfigurationEndpoint(): string {
        return `${this.canonicalAuthority}v2.0/.well-known/openid-configuration`;
    }

    constructor(authority: string, networkInterface: INetworkModule) {
        this.canonicalAuthority = authority;

        this._canonicalAuthority.validateAsUri();
        this.networkInterface = networkInterface;
    }

    private discoveryComplete() {
        return !!this.tenantDiscoveryResponse;
    }

    private async discoverEndpoints(openIdConfigurationEndpoint: string): Promise<ITenantDiscoveryResponse> {
        const response = await this.networkInterface.sendRequestAsync(openIdConfigurationEndpoint, { method: "GET" }, true);
        return {
            AuthorizationEndpoint: response.authorization_endpoint,
            TokenEndpoint: response.token_endpoint,
            EndSessionEndpoint: response.end_session_endpoint,
            Issuer: response.issuer
        } as ITenantDiscoveryResponse;
    }

    public abstract async getOpenIdConfigurationAsync(): Promise<string>;

    public async resolveEndpointsAsync(): Promise<ITenantDiscoveryResponse> {
        const openIdConfigEndpoint = await this.getOpenIdConfigurationAsync();
        this.tenantDiscoveryResponse = await this.discoverEndpoints(openIdConfigEndpoint);

        return this.tenantDiscoveryResponse;
    }
}
