/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Authority } from "./Authority";
import { AuthorityType } from "./AuthorityType";
import { INetworkModule } from "../network/INetworkModule";

/**
 * The AdfsAuthority class extends the Authority class and adds functionality specific to ADFS 2019
 */
export class AdfsAuthority extends Authority {

    /**
     * Return authority type
     */
    public get authorityType(): AuthorityType {
        return AuthorityType.Adfs;
    }

    public constructor(authority: string, networkInterface: INetworkModule) {
        super(authority, networkInterface);
    }

    /**
     * Returns a promise which resolves to the OIDC endpoint
     */
    public async getOpenIdConfigurationEndpointAsync(): Promise<string> {
        return `${this.canonicalAuthority}.well-known/openid-configuration`;
    }
}
