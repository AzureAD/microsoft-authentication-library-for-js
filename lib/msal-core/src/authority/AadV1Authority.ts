/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorityType } from "./Authority";
import { AadAuthority } from "./AadAuthority";

/**
 * @hidden
 */
export class AadV1Authority extends AadAuthority {
    protected static readonly AadInstanceDiscoveryEndpoint: string = "https://login.microsoftonline.com/common/discovery/instance";

    protected get AadInstanceDiscoveryEndpointUrl(): string {
        return `${AadV1Authority.AadInstanceDiscoveryEndpoint}?api-version=1.0&authorization_endpoint=${this.CanonicalAuthority}oauth2/authorize`;
    }

    public constructor(authority: string, validateAuthority: boolean) {
        super(authority, validateAuthority);
    }

    public get AuthorityType(): AuthorityType {
        return AuthorityType.AadV1;
    }
}
