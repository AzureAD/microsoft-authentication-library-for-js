/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AadAuthority } from "./AadAuthority";
import { AuthorityType } from "./Authority";
import { INetworkModule } from "../../app/INetworkModule";
import { ClientAuthError } from "../../error/ClientAuthError";
import { UrlString } from "../../url/UrlString";

/**
 * @hidden
 */
export class B2cAuthority extends AadAuthority {

    public static B2C_PREFIX: String = "tfp";

    public constructor(authority: string, networkInterface: INetworkModule) {
        super(authority, networkInterface);
        const authorityUri = new UrlString(authority);
        const urlComponents = authorityUri.getUrlComponents();

        const pathSegments = urlComponents.PathSegments;
        if (pathSegments.length < 3) {
            throw ClientAuthError.createInvalidB2CAuthorityUriPathError(authority);
        }

        this.canonicalAuthority = `https://${urlComponents.HostNameAndPort}/${pathSegments[0]}/${pathSegments[1]}/${pathSegments[2]}/`;
    }

    public get authorityType(): AuthorityType {
        return AuthorityType.B2C;
    }

    public get isValidationEnabled(): boolean {
        // Hardcoded to false
        return false;
    }

    /**
     * Returns a promise with the TenantDiscoveryEndpoint
     */
    public async GetOpenIdConfigurationEndpointAsync(): Promise<string> {
        if (!this.isValidationEnabled || this.isInTrustedHostList(this.canonicalAuthorityUrlComponents.HostNameAndPort)) {
            return this.defaultOpenIdConfigurationEndpoint;
        }

        throw ClientAuthError.createUnsupportedB2CAuthorityValidationError();
    }
}
