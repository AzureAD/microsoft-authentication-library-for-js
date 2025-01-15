/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants } from "@azure/msal-browser";
import { UrlUtils } from "./utils/UrlUtils.js";

/**
 * Authority class which can be used to create an authority object for Custom Auth features.
 */
export class CustomAuthAuthority {
    readonly authorityUrl: URL;

    constructor(
        authorityUrl: string,
        private readonly customAuthProxyDomain?: string
    ) {
        this.authorityUrl = UrlUtils.parseSecureUrl(authorityUrl);
    }

    /**
     * Extracts the tenant from the authority.
     * @returns The tenant of the authority
     */
    getTenant(): string {
        return this.authorityUrl.hostname.split(".")[0];
    }

    /**
     * Gets the custom auth endpoint.
     * The open id configuration doesn't have the correct endpoint for the auth APIs.
     * We need to generate the endpoint manually based on the authority URL.
     * @returns The custom auth endpoint
     */
    getCustomAuthDomain(): string {
        /*
         * The customAuthProxyDomain is used to resolve the CORS issue when calling the auth APIs.
         * If the customAuthProxyDomain is not provided, we will generate the auth API domain based on the authority URL.
         */
        const authApiDomain = !this.customAuthProxyDomain
            ? new URL(
                  `${this.getTenant()}${Constants.AAD_TENANT_DOMAIN_SUFFIX}`,
                  this.authorityUrl.href
              ).href
            : this.customAuthProxyDomain;

        return authApiDomain;
    }
}
