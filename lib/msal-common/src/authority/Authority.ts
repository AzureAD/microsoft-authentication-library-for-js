/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorityType } from "./AuthorityType";
import { isOpenIdConfigResponse, OpenIdConfigResponse } from "./OpenIdConfigResponse";
import { UrlString } from "../url/UrlString";
import { IUri } from "../url/IUri";
import { ClientAuthError } from "../error/ClientAuthError";
import { INetworkModule } from "../network/INetworkModule";
import { AuthorityMetadataSource, Constants, RegionDiscoveryOutcomes } from "../utils/Constants";
import { EndpointMetadata, InstanceDiscoveryMetadata } from "./AuthorityMetadata";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ProtocolMode } from "./ProtocolMode";
import { ICacheManager } from "../cache/interface/ICacheManager";
import { AuthorityMetadataEntity } from "../cache/entities/AuthorityMetadataEntity";
import { AuthorityOptions , AzureCloudInstance } from "./AuthorityOptions";
import { CloudInstanceDiscoveryResponse, isCloudInstanceDiscoveryResponse } from "./CloudInstanceDiscoveryResponse";
import { CloudDiscoveryMetadata } from "./CloudDiscoveryMetadata";
import { RegionDiscovery } from "./RegionDiscovery";
import { RegionDiscoveryMetadata } from "./RegionDiscoveryMetadata";
import { ImdsOptions } from "./ImdsOptions";
import { AzureCloudOptions } from "../config/ClientConfiguration";

/**
 * The authority class validates the authority URIs used by the user, and retrieves the OpenID Configuration Data from the
 * endpoint. It will store the pertinent config data in this object for use during token calls.
 */
export class Authority {

    // Canonical authority url string
    private _canonicalAuthority: UrlString;
    // Canonicaly authority url components
    private _canonicalAuthorityUrlComponents: IUri | null;
    // Network interface to make requests with.
    protected networkInterface: INetworkModule;
    // Cache Manager to cache network responses
    protected cacheManager: ICacheManager;
    // Protocol mode to construct endpoints
    private authorityOptions: AuthorityOptions;
    // Authority metadata
    private metadata: AuthorityMetadataEntity;
    // Region discovery service
    private regionDiscovery: RegionDiscovery;
    // Region discovery metadata
    public regionDiscoveryMetadata: RegionDiscoveryMetadata;
    // Proxy url string
    private proxyUrl: string;

    constructor(
        authority: string,
        networkInterface: INetworkModule,
        cacheManager: ICacheManager,
        authorityOptions: AuthorityOptions,
        proxyUrl?: string) {
        this.canonicalAuthority = authority;
        this._canonicalAuthority.validateAsUri();
        this.networkInterface = networkInterface;
        this.cacheManager = cacheManager;
        this.authorityOptions = authorityOptions;
        this.regionDiscovery = new RegionDiscovery(networkInterface);
        this.regionDiscoveryMetadata = { region_used: undefined, region_source: undefined, region_outcome: undefined };
        this.proxyUrl = proxyUrl || Constants.EMPTY_STRING;
    }

    // See above for AuthorityType
    public get authorityType(): AuthorityType {
        const pathSegments = this.canonicalAuthorityUrlComponents.PathSegments;
        if (pathSegments.length) {
            switch(pathSegments[0].toLowerCase()) {
                case Constants.ADFS:
                    return AuthorityType.Adfs;
                case Constants.DSTS:
                    return AuthorityType.Dsts;
                default:
                    break;
            }
        }
        return AuthorityType.Default;
    }

    /**
     * ProtocolMode enum representing the way endpoints are constructed.
     */
    public get protocolMode(): ProtocolMode {
        return this.authorityOptions.protocolMode;
    }

    /**
     * Returns authorityOptions which can be used to reinstantiate a new authority instance
     */
    public get options(): AuthorityOptions {
        return this.authorityOptions;
    }

    /**
     * A URL that is the authority set by the developer
     */
    public get canonicalAuthority(): string {
        return this._canonicalAuthority.urlString;
    }

    /**
     * Sets canonical authority.
     */
    public set canonicalAuthority(url: string) {
        this._canonicalAuthority = new UrlString(url);
        this._canonicalAuthority.validateAsUri();
        this._canonicalAuthorityUrlComponents = null;
    }

    /**
     * Get authority components.
     */
    public get canonicalAuthorityUrlComponents(): IUri {
        if (!this._canonicalAuthorityUrlComponents) {
            this._canonicalAuthorityUrlComponents = this._canonicalAuthority.getUrlComponents();
        }

        return this._canonicalAuthorityUrlComponents;
    }

    /**
     * Get hostname and port i.e. login.microsoftonline.com
     */
    public get hostnameAndPort(): string {
        return this.canonicalAuthorityUrlComponents.HostNameAndPort.toLowerCase();
    }

    /**
     * Get tenant for authority.
     */
    public get tenant(): string {
        return this.canonicalAuthorityUrlComponents.PathSegments[0];
    }

    /**
     * OAuth /authorize endpoint for requests
     */
    public get authorizationEndpoint(): string {
        if(this.discoveryComplete()) {
            const endpoint = this.replacePath(this.metadata.authorization_endpoint);
            return this.replaceTenant(endpoint);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    /**
     * OAuth /token endpoint for requests
     */
    public get tokenEndpoint(): string {
        if(this.discoveryComplete()) {
            const endpoint = this.replacePath(this.metadata.token_endpoint);
            return this.replaceTenant(endpoint);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    public get deviceCodeEndpoint(): string {
        if(this.discoveryComplete()) {
            const endpoint = this.replacePath(this.metadata.token_endpoint.replace("/token", "/devicecode"));
            return this.replaceTenant(endpoint);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    /**
     * OAuth logout endpoint for requests
     */
    public get endSessionEndpoint(): string {
        if(this.discoveryComplete()) {
            // ROPC policies may not have end_session_endpoint set
            if (!this.metadata.end_session_endpoint) {
                throw ClientAuthError.createLogoutNotSupportedError();
            }
            const endpoint = this.replacePath(this.metadata.end_session_endpoint);
            return this.replaceTenant(endpoint);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    /**
     * OAuth issuer for requests
     */
    public get selfSignedJwtAudience(): string {
        if(this.discoveryComplete()) {
            const endpoint = this.replacePath(this.metadata.issuer);
            return this.replaceTenant(endpoint);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    /**
     * Jwks_uri for token signing keys
     */
    public get jwksUri(): string {
        if(this.discoveryComplete()) {
            const endpoint = this.replacePath(this.metadata.jwks_uri);
            return this.replaceTenant(endpoint);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    /**
     * Replaces tenant in url path with current tenant. Defaults to common.
     * @param urlString
     */
    private replaceTenant(urlString: string): string {
        return urlString.replace(/{tenant}|{tenantid}/g, this.tenant);
    }

    /**
     * Replaces path such as tenant or policy with the current tenant or policy.
     * @param urlString
     */
    private replacePath(urlString: string): string {
        let endpoint = urlString;
        const cachedAuthorityUrl = new UrlString(this.metadata.canonical_authority);
        const cachedAuthorityParts = cachedAuthorityUrl.getUrlComponents().PathSegments;
        const currentAuthorityParts = this.canonicalAuthorityUrlComponents.PathSegments;

        currentAuthorityParts.forEach((currentPart, index) => {
            const cachedPart = cachedAuthorityParts[index];
            if (currentPart !== cachedPart) {
                endpoint = endpoint.replace(`/${cachedPart}/`, `/${currentPart}/`);
            }
        });

        return endpoint;
    }

    /**
     * The default open id configuration endpoint for any canonical authority.
     */
    protected get defaultOpenIdConfigurationEndpoint(): string {
        if (
            this.authorityType === AuthorityType.Adfs ||
            this.authorityType === AuthorityType.Dsts ||
            this.protocolMode === ProtocolMode.OIDC
        ) {
            return `${this.canonicalAuthority}.well-known/openid-configuration`;
        }
        return `${this.canonicalAuthority}v2.0/.well-known/openid-configuration`;
    }

    /**
     * Boolean that returns whethr or not tenant discovery has been completed.
     */
    discoveryComplete(): boolean {
        return !!this.metadata;
    }

    /**
     * Perform endpoint discovery to discover aliases, preferred_cache, preferred_network
     * and the /authorize, /token and logout endpoints.
     */
    public async resolveEndpointsAsync(): Promise<void> {
        let metadataEntity = this.cacheManager.getAuthorityMetadataByAlias(this.hostnameAndPort);
        if (!metadataEntity) {
            metadataEntity = new AuthorityMetadataEntity();
            metadataEntity.updateCanonicalAuthority(this.canonicalAuthority);
        }

        const cloudDiscoverySource = await this.updateCloudDiscoveryMetadata(metadataEntity);
        this.canonicalAuthority = this.canonicalAuthority.replace(this.hostnameAndPort, metadataEntity.preferred_network);
        const endpointSource = await this.updateEndpointMetadata(metadataEntity);

        if (cloudDiscoverySource !== AuthorityMetadataSource.CACHE && endpointSource !== AuthorityMetadataSource.CACHE) {
            // Reset the expiration time unless both values came from a successful cache lookup
            metadataEntity.resetExpiresAt();
            metadataEntity.updateCanonicalAuthority(this.canonicalAuthority);
        }

        const cacheKey = this.cacheManager.generateAuthorityMetadataCacheKey(metadataEntity.preferred_cache);
        this.cacheManager.setAuthorityMetadata(cacheKey, metadataEntity);
        this.metadata = metadataEntity;
    }

    /**
     * Update AuthorityMetadataEntity with new endpoints and return where the information came from
     * @param metadataEntity
     */
    private async updateEndpointMetadata(metadataEntity: AuthorityMetadataEntity): Promise<AuthorityMetadataSource> {
        let metadata = this.getEndpointMetadataFromConfig();
        if (metadata) {
            metadataEntity.updateEndpointMetadata(metadata, false);
            return AuthorityMetadataSource.CONFIG;
        }

        if (this.isAuthoritySameType(metadataEntity) && metadataEntity.endpointsFromNetwork && !metadataEntity.isExpired()) {
            // No need to update
            return AuthorityMetadataSource.CACHE;
        }

        let harcodedMetadata = this.getEndpointMetadataFromHardcodedValues();
        metadata = await this.getEndpointMetadataFromNetwork();
        if (metadata) {
            // If the user prefers to use an azure region replace the global endpoints with regional information.
            if (this.authorityOptions.azureRegionConfiguration?.azureRegion) {
                metadata = await this.updateMetadataWithRegionalInformation(metadata);
            }

            metadataEntity.updateEndpointMetadata(metadata, true);
            return AuthorityMetadataSource.NETWORK;
        }    

        if (harcodedMetadata && !this.authorityOptions.skipAuthorityMetadataCache) {
            // If the user prefers to use an azure region replace the global endpoints with regional information.
            if (this.authorityOptions.azureRegionConfiguration?.azureRegion) {
                harcodedMetadata = await this.updateMetadataWithRegionalInformation(
                    harcodedMetadata
                );
            }

            metadataEntity.updateEndpointMetadata(harcodedMetadata, false);
            return AuthorityMetadataSource.HARDCODED_VALUES;
        } else {
            throw ClientAuthError.createUnableToGetOpenidConfigError(
                this.defaultOpenIdConfigurationEndpoint
            );
        }
    }

    /**
     * Compares the number of url components after the domain to determine if the cached 
     * authority metadata can be used for the requested authority. Protects against same domain different 
     * authority such as login.microsoftonline.com/tenant and login.microsoftonline.com/tfp/tenant/policy
     * @param metadataEntity
     */
    private isAuthoritySameType(metadataEntity: AuthorityMetadataEntity): boolean {
        const cachedAuthorityUrl = new UrlString(metadataEntity.canonical_authority);
        const cachedParts = cachedAuthorityUrl.getUrlComponents().PathSegments;

        return cachedParts.length === this.canonicalAuthorityUrlComponents.PathSegments.length;
    }

    /**
     * Parse authorityMetadata config option
     */
    private getEndpointMetadataFromConfig(): OpenIdConfigResponse | null {
        if (this.authorityOptions.authorityMetadata) {
            try {
                return JSON.parse(this.authorityOptions.authorityMetadata) as OpenIdConfigResponse;
            } catch (e) {
                throw ClientConfigurationError.createInvalidAuthorityMetadataError();
            }
        }

        return null;
    }

    /**
     * Gets OAuth endpoints from the given OpenID configuration endpoint.
     * 
     * @param hasHardcodedMetadata boolean
     */
    private async getEndpointMetadataFromNetwork(): Promise<OpenIdConfigResponse | null> {
        const options: ImdsOptions = {};
        if (this.proxyUrl) {
            options.proxyUrl = this.proxyUrl;
        }

        /*
         * TODO: Add a timeout if the authority exists in our library's 
         * hardcoded list of metadata
         */

        try {
            const response = await this.networkInterface.
                sendGetRequestAsync<OpenIdConfigResponse>(this.defaultOpenIdConfigurationEndpoint, options);
            return isOpenIdConfigResponse(response.body) ? response.body : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Get OAuth endpoints for common authorities.
     */
    private getEndpointMetadataFromHardcodedValues(): OpenIdConfigResponse | null {
        if (this.canonicalAuthority in EndpointMetadata) {
            return EndpointMetadata[this.canonicalAuthority];
        }

        return null;
    }

    /**
     * Update the retrieved metadata with regional information.
     */
    private async updateMetadataWithRegionalInformation(metadata: OpenIdConfigResponse): Promise<OpenIdConfigResponse> {
        const autodetectedRegionName = await this.regionDiscovery.detectRegion(
            this.authorityOptions.azureRegionConfiguration?.environmentRegion,
            this.regionDiscoveryMetadata,
            this.proxyUrl
        );

        const azureRegion = 
            this.authorityOptions.azureRegionConfiguration?.azureRegion === Constants.AZURE_REGION_AUTO_DISCOVER_FLAG
                ? autodetectedRegionName
                : this.authorityOptions.azureRegionConfiguration?.azureRegion;

        if (this.authorityOptions.azureRegionConfiguration?.azureRegion === Constants.AZURE_REGION_AUTO_DISCOVER_FLAG) {
            this.regionDiscoveryMetadata.region_outcome = autodetectedRegionName ?
                RegionDiscoveryOutcomes.AUTO_DETECTION_REQUESTED_SUCCESSFUL :
                RegionDiscoveryOutcomes.AUTO_DETECTION_REQUESTED_FAILED;
        } else {
            if (autodetectedRegionName) {
                this.regionDiscoveryMetadata.region_outcome = (
                    this.authorityOptions.azureRegionConfiguration?.azureRegion === autodetectedRegionName
                ) ?
                    RegionDiscoveryOutcomes.CONFIGURED_MATCHES_DETECTED :
                    RegionDiscoveryOutcomes.CONFIGURED_NOT_DETECTED;
            } else {
                this.regionDiscoveryMetadata.region_outcome = RegionDiscoveryOutcomes.CONFIGURED_NO_AUTO_DETECTION;
            }
        }

        if (azureRegion) {
            this.regionDiscoveryMetadata.region_used = azureRegion;
            return Authority.replaceWithRegionalInformation(metadata, azureRegion);
        }

        return metadata;
    }

    /**
     * Updates the AuthorityMetadataEntity with new aliases, preferred_network and preferred_cache
     * and returns where the information was retrieved from
     * @param cachedMetadata
     * @param newMetadata
     */
    private async updateCloudDiscoveryMetadata(metadataEntity: AuthorityMetadataEntity): Promise<AuthorityMetadataSource> {
        let metadata = this.getCloudDiscoveryMetadataFromConfig();
        if (metadata) {
            metadataEntity.updateCloudDiscoveryMetadata(metadata, false);
            return AuthorityMetadataSource.CONFIG;
        }

        // If The cached metadata came from config but that config was not passed to this instance, we must go to the network
        if (this.isAuthoritySameType(metadataEntity) && metadataEntity.aliasesFromNetwork && !metadataEntity.isExpired()) {
            // No need to update
            return AuthorityMetadataSource.CACHE;
        }

        const harcodedMetadata = this.getCloudDiscoveryMetadataFromHarcodedValues();

        metadata = await this.getCloudDiscoveryMetadataFromNetwork();
        if (metadata) {
            metadataEntity.updateCloudDiscoveryMetadata(metadata, true);
            return AuthorityMetadataSource.NETWORK;
        }
        
        if (harcodedMetadata && !this.options.skipAuthorityMetadataCache) {
            metadataEntity.updateCloudDiscoveryMetadata(harcodedMetadata, false);
            return AuthorityMetadataSource.HARDCODED_VALUES;
        } else {
            // Metadata could not be obtained from config, cache or network
            throw ClientConfigurationError.createUntrustedAuthorityError();
        }
    }

    /**
     * Parse cloudDiscoveryMetadata config or check knownAuthorities
     */
    private getCloudDiscoveryMetadataFromConfig(): CloudDiscoveryMetadata | null {
        // Check if network response was provided in config
        if (this.authorityOptions.cloudDiscoveryMetadata) {
            try {
                const parsedResponse = JSON.parse(this.authorityOptions.cloudDiscoveryMetadata) as CloudInstanceDiscoveryResponse;
                const metadata = Authority.getCloudDiscoveryMetadataFromNetworkResponse(
                    parsedResponse.metadata,
                    this.hostnameAndPort
                );
                if (metadata) {
                    return metadata;
                }
            } catch (e) {
                throw ClientConfigurationError.createInvalidCloudDiscoveryMetadataError();
            }
        }
        // If cloudDiscoveryMetadata is empty or does not contain the host, check knownAuthorities
        if (this.isInKnownAuthorities()) {
            return Authority.createCloudDiscoveryMetadataFromHost(this.hostnameAndPort);
        }

        return null;
    }

    /**
     * Called to get metadata from network if CloudDiscoveryMetadata was not populated by config
     * 
     * @param hasHardcodedMetadata boolean
     */
    private async getCloudDiscoveryMetadataFromNetwork(): Promise<CloudDiscoveryMetadata | null> {
        const instanceDiscoveryEndpoint =
            `${Constants.AAD_INSTANCE_DISCOVERY_ENDPT}${this.canonicalAuthority}oauth2/v2.0/authorize`;
        const options: ImdsOptions = {};
        if (this.proxyUrl) {
            options.proxyUrl = this.proxyUrl;
        }

        /*
         * TODO: Add a timeout if the authority exists in our library's
         * hardcoded list of metadata
         */

        let match = null;
        try {
            const response =
                await this.networkInterface.sendGetRequestAsync<CloudInstanceDiscoveryResponse>(
                    instanceDiscoveryEndpoint,
                    options
                );
            const metadata = isCloudInstanceDiscoveryResponse(response.body)
                ? response.body.metadata
                : [];
            if (metadata.length === 0) {
                // If no metadata is returned, authority is untrusted
                return null;
            }
            match = Authority.getCloudDiscoveryMetadataFromNetworkResponse(
                metadata,
                this.hostnameAndPort
            );
        } catch (e) {
            return null;
        }

        if (!match) {
            // Custom Domain scenario, host is trusted because Instance Discovery call succeeded
            match = Authority.createCloudDiscoveryMetadataFromHost(
                this.hostnameAndPort
            );
        }
        return match;
    }

    /**
     * Get cloud discovery metadata for common authorities 
     */
    private getCloudDiscoveryMetadataFromHarcodedValues(): CloudDiscoveryMetadata | null {
        if (this.canonicalAuthority in InstanceDiscoveryMetadata) {
            return InstanceDiscoveryMetadata[this.canonicalAuthority];
        }

        return null;
    }

    /**
     * Helper function to determine if this host is included in the knownAuthorities config option
     */
    private isInKnownAuthorities(): boolean {
        const matches = this.authorityOptions.knownAuthorities.filter((authority) => {
            return UrlString.getDomainFromUrl(authority).toLowerCase() === this.hostnameAndPort;
        });

        return matches.length > 0;
    }

    /**
     * helper function to populate the authority based on azureCloudOptions
     * @param authorityString
     * @param azureCloudOptions
     */
    static generateAuthority(authorityString: string, azureCloudOptions?: AzureCloudOptions): string {
        let authorityAzureCloudInstance;

        if (azureCloudOptions && azureCloudOptions.azureCloudInstance !== AzureCloudInstance.None) {
            const tenant = azureCloudOptions.tenant ? azureCloudOptions.tenant : Constants.DEFAULT_COMMON_TENANT;
            authorityAzureCloudInstance = `${azureCloudOptions.azureCloudInstance}/${tenant}/`;
        }

        return authorityAzureCloudInstance ? authorityAzureCloudInstance : authorityString;
    }

    /**
     * Creates cloud discovery metadata object from a given host
     * @param host
     */
    static createCloudDiscoveryMetadataFromHost(host: string): CloudDiscoveryMetadata {
        return {
            preferred_network: host,
            preferred_cache: host,
            aliases: [host]
        };
    }

    /**
     * Searches instance discovery network response for the entry that contains the host in the aliases list
     * @param response
     * @param authority
     */
    static getCloudDiscoveryMetadataFromNetworkResponse(
        response: CloudDiscoveryMetadata[],
        authority: string
    ): CloudDiscoveryMetadata | null {
        for (let i = 0; i < response.length; i++) {
            const metadata = response[i];
            if (metadata.aliases.indexOf(authority) > -1) {
                return metadata;
            }
        }

        return null;
    }

    /**
     * helper function to generate environment from authority object
     */
    getPreferredCache(): string {
        if(this.discoveryComplete()) {
            return this.metadata.preferred_cache;
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    /**
     * Returns whether or not the provided host is an alias of this authority instance
     * @param host
     */
    isAlias(host: string): boolean {
        return this.metadata.aliases.indexOf(host) > -1;
    }

    /**
     * Checks whether the provided host is that of a public cloud authority
     *
     * @param authority string
     * @returns bool
     */
    static isPublicCloudAuthority(host: string): boolean {
        return Constants.KNOWN_PUBLIC_CLOUDS.indexOf(host) >= 0;
    }

    /**
     * Rebuild the authority string with the region
     *
     * @param host string
     * @param region string
     */
    static buildRegionalAuthorityString(host: string, region: string, queryString?: string): string {
        // Create and validate a Url string object with the initial authority string
        const authorityUrlInstance = new UrlString(host);
        authorityUrlInstance.validateAsUri();

        const authorityUrlParts = authorityUrlInstance.getUrlComponents();

        let hostNameAndPort= `${region}.${authorityUrlParts.HostNameAndPort}`;

        if (this.isPublicCloudAuthority(authorityUrlParts.HostNameAndPort)) {
            hostNameAndPort = `${region}.${Constants.REGIONAL_AUTH_PUBLIC_CLOUD_SUFFIX}`;
        }

        // Include the query string portion of the url
        const url = UrlString.constructAuthorityUriFromObject({
            ...authorityUrlInstance.getUrlComponents(),
            HostNameAndPort: hostNameAndPort
        }).urlString;

        // Add the query string if a query string was provided
        if (queryString) return `${url}?${queryString}`;

        return url;
    }

    /**
     * Replace the endpoints in the metadata object with their regional equivalents.
     *
     * @param metadata OpenIdConfigResponse
     * @param azureRegion string
     */
    static replaceWithRegionalInformation(metadata: OpenIdConfigResponse, azureRegion: string): OpenIdConfigResponse {
        metadata.authorization_endpoint = Authority.buildRegionalAuthorityString(metadata.authorization_endpoint, azureRegion);
        // TODO: Enquire on whether we should leave the query string or remove it before releasing the feature
        metadata.token_endpoint = Authority.buildRegionalAuthorityString(
            metadata.token_endpoint, azureRegion, Constants.REGIONAL_AUTH_NON_MSI_QUERY_STRING
        );

        if (metadata.end_session_endpoint) {
            metadata.end_session_endpoint = Authority.buildRegionalAuthorityString(metadata.end_session_endpoint, azureRegion);
        }

        return metadata;
    }
}

