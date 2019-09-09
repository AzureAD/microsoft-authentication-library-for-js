/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AadAuthority } from "./AadAuthority";
import { AuthorityType } from "./Authority";
import { ClientConfigurationErrorMessage } from "../error/ClientConfigurationError";
import { UrlUtils } from "../utils/UrlUtils";

/**
 * @hidden
 */
export class B2cAuthority extends AadAuthority {
    public static B2C_PREFIX: String = "tfp";
    public constructor(authority: string, validateAuthority: boolean) {
        super(authority, validateAuthority);
        const urlComponents = UrlUtils.GetUrlComponents(authority);

        const pathSegments = urlComponents.PathSegments;
        if (pathSegments.length < 3) {
            throw ClientConfigurationErrorMessage.b2cAuthorityUriInvalidPath;
        }

        this.CanonicalAuthority = `https://${urlComponents.HostNameAndPort}/${pathSegments[0]}/${pathSegments[1]}/${pathSegments[2]}/`;
    }

    public get AuthorityType(): AuthorityType {
        return AuthorityType.B2C;
    }

    /**
     * Returns a promise with the TenantDiscoveryEndpoint
     */
    public async GetOpenIdConfigurationEndpointAsync(): Promise<string> {
        if (!this.IsValidationEnabled || this.IsInTrustedHostList(this.CanonicalAuthorityUrlComponents.HostNameAndPort)) {
            return this.DefaultOpenIdConfigurationEndpoint;
        }

        throw ClientConfigurationErrorMessage.unsupportedAuthorityValidation;
    }
}
