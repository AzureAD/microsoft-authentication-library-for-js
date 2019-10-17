/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ITenantDiscoveryResponse } from "./ITenantDiscoveryResponse";
import { UrlString } from "../../url/UrlString";
import { IUri } from "../../url/IUri";
import { ClientAuthError } from "../../error/ClientAuthError";

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

    public abstract authorityType: AuthorityType;

    private _canonicalAuthority: UrlString;
    private _canonicalAuthorityUrlComponents: IUri;
    private tenantDiscoveryResponse: ITenantDiscoveryResponse;

    /**
     * A URL that is the authority set by the developer
     */
    public get canonicalAuthority(): string {
        return this._canonicalAuthority.getUrlString();
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

    constructor(authority: string) {
        this.canonicalAuthority = authority;

        this._canonicalAuthority.validateAsUri();
    }

    private discoveryComplete() {
        return !!this.tenantDiscoveryResponse;
    }
}
