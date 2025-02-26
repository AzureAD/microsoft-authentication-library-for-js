/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Authority, AuthorityOptions, BrowserConfiguration, INetworkModule, Logger } from "@azure/msal-browser";
import { ICacheManager } from "../../../msal-common/dist/cache/interface/ICacheManager.js";
import { CustomAuthApiEndpoint } from "./network_client/custom_auth_api/CustomAuthApiEndpoint.js";
import { UrlUtils } from "./utils/UrlUtils.js";
import { AuthorityMetadataEntity } from "../../../msal-common/dist/cache/entities/AuthorityMetadataEntity.js";
import { generateAuthorityMetadataExpiresAt } from "./utils/TimeUtils.js";

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
        this.setAuthorityMetadataEntity();
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

    /**
     * Create the authority metadata entity and set it in the cache.
     * When looking up cached access tokens, this is used for checking
     * if environment property of cached access tokens is included in authority alias
     */
    setAuthorityMetadataEntity(): void {
        const metadataEntity = this.createMetadataEntity();
        const cacheKey = this.cacheManager.generateAuthorityMetadataCacheKey(metadataEntity.preferred_cache);
        this.cacheManager.setAuthorityMetadata(cacheKey, metadataEntity);
    }

    /**
     * Create the default authority metadata entity.
     * @returns The authority metadata entity.
     */
    createMetadataEntity(): AuthorityMetadataEntity {
        return {
            aliases: [this.hostnameAndPort],
            preferred_cache: this.hostnameAndPort,
            preferred_network: this.hostnameAndPort,
            canonical_authority: this.canonicalAuthority,
            authorization_endpoint: "",
            token_endpoint: this.tokenEndpoint,
            end_session_endpoint: "",
            issuer: "",
            aliasesFromNetwork: false,
            endpointsFromNetwork: false,
            expiresAt: generateAuthorityMetadataExpiresAt(),
            jwks_uri: "",
        };
    }

    override getPreferredCache(): string {
        return this.canonicalAuthorityUrlComponents.HostNameAndPort;
    }

    override get tokenEndpoint(): string {
        const endpointUrl = UrlUtils.buildUrl(this.getCustomAuthApiDomain(), CustomAuthApiEndpoint.SIGNIN_TOKEN);

        return endpointUrl.href;
    }
}
