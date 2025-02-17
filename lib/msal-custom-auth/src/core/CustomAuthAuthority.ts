/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Authority, AuthorityOptions, BrowserConfiguration, INetworkModule, Logger } from "@azure/msal-browser";
import { ICacheManager } from "../../../msal-common/dist/cache/interface/ICacheManager.js";

/**
 * Authority class which can be used to create an authority object for Custom Auth features.
 */
export class CustomAuthAuthority extends Authority {
    /**
     * Constructor for the Custom Auth Authority.
     * @param authority - The authority URL for the authority.
     * @param networkInterface - The network interface implementation to make requests.
     * @param cacheManager - The cache manager interface implementation to interact with the cache.
     * @param authorityOptions - The options for the authority.
     * @param logger - The logger for the authority.
     * @param customAuthProxyDomain - The custom auth proxy domain.
     */
    constructor(
        authority: string,
        config: BrowserConfiguration,
        networkInterface: INetworkModule,
        cacheManager: ICacheManager,
        logger: Logger,
        private customAuthProxyDomain?: string,
    ) {
        const ciamAuthorityUrl = CustomAuthAuthority.transformCIAMAuthority(authority);

        const authorityOptions: AuthorityOptions = {
            protocolMode: config.auth.protocolMode,
            OIDCOptions: config.auth.OIDCOptions,
            knownAuthorities: config.auth.knownAuthorities,
            cloudDiscoveryMetadata: config.auth.cloudDiscoveryMetadata,
            authorityMetadata: config.auth.authorityMetadata,
            skipAuthorityMetadataCache: config.auth.skipAuthorityMetadataCache,
        };

        super(ciamAuthorityUrl, networkInterface, cacheManager, authorityOptions, logger, "");
    }

    /**
     * Gets the custom auth endpoint.
     * The open id configuration doesn't have the correct endpoint for the auth APIs.
     * We need to generate the endpoint manually based on the authority URL.
     * @returns The custom auth endpoint
     */
    getCustomAuthApiDomain(): string {
        /*
         * The customAuthProxyDomain is used to resolve the CORS issue when calling the auth APIs.
         * If the customAuthProxyDomain is not provided, we will generate the auth API domain based on the authority URL.
         */
        return !this.customAuthProxyDomain ? this.canonicalAuthority : this.customAuthProxyDomain;
    }

    override getPreferredCache(): string {
        return this.canonicalAuthorityUrlComponents.HostNameAndPort;
    }
}
