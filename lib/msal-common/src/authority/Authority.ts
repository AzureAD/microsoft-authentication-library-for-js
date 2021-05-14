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
import { AuthorityMetadataSource, Constants } from "../utils/Constants";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ProtocolMode } from "./ProtocolMode";
import { ICacheManager } from "../cache/interface/ICacheManager";
import { AuthorityMetadataEntity } from "../cache/entities/AuthorityMetadataEntity";
import { AuthorityOptions } from "./AuthorityOptions";
import { CloudInstanceDiscoveryResponse, isCloudInstanceDiscoveryResponse } from "./CloudInstanceDiscoveryResponse";
import { CloudDiscoveryMetadata } from "./CloudDiscoveryMetadata";
import { RegionDiscovery } from "./RegionDiscovery";

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

    constructor(authority: string, networkInterface: INetworkModule, cacheManager: ICacheManager, authorityOptions: AuthorityOptions) {
        this.canonicalAuthority = authority;
        this._canonicalAuthority.validateAsUri();
        this.networkInterface = networkInterface;
        this.cacheManager = cacheManager;
        this.authorityOptions = authorityOptions;
        this.regionDiscovery = new RegionDiscovery(networkInterface);
    }

    // See above for AuthorityType
    public get authorityType(): AuthorityType {
        const pathSegments = this.canonicalAuthorityUrlComponents.PathSegments;

        if (pathSegments.length && pathSegments[0].toLowerCase() === Constants.ADFS) {
            return AuthorityType.Adfs;
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
        if (this.authorityType === AuthorityType.Adfs || this.protocolMode === ProtocolMode.OIDC) {
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

        metadata = await this.getEndpointMetadataFromNetwork();
        if (metadata) {
            // If the user prefers to use an azure region replace the global endpoints with regional information.
            if (this.authorityOptions.azureRegionConfiguration?.azureRegion) {
                const autodetectedRegionName = await this.regionDiscovery.detectRegion(this.authorityOptions.azureRegionConfiguration.environmentRegion);

                const azureRegion = this.authorityOptions.azureRegionConfiguration.azureRegion === Constants.AZURE_REGION_AUTO_DISCOVER_FLAG 
                    ? autodetectedRegionName 
                    : this.authorityOptions.azureRegionConfiguration.azureRegion;

                if (azureRegion) {
                    metadata = Authority.replaceWithRegionalInformation(metadata, azureRegion);
                }
            }

            metadataEntity.updateEndpointMetadata(metadata, true);
            return AuthorityMetadataSource.NETWORK;
        } else {
            throw ClientAuthError.createUnableToGetOpenidConfigError(this.defaultOpenIdConfigurationEndpoint);
        }
    }

    /**
     * Compares the number of url components after the domain to determine if the cached authority metadata can be used for the requested authority
     * Protects against same domain different authority such as login.microsoftonline.com/tenant and login.microsoftonline.com/tfp/tenant/policy
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
     */
    private async getEndpointMetadataFromNetwork(): Promise<OpenIdConfigResponse | null> {
        try {
            const response = await this.networkInterface.sendGetRequestAsync<OpenIdConfigResponse>(this.defaultOpenIdConfigurationEndpoint);
            return isOpenIdConfigResponse(response.body) ? response.body : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Updates the AuthorityMetadataEntity with new aliases, preferred_network and preferred_cache and returns where the information was retrived from
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

        metadata = await this.getCloudDiscoveryMetadataFromNetwork();
        if (metadata) {
            metadataEntity.updateCloudDiscoveryMetadata(metadata, true);
            return AuthorityMetadataSource.NETWORK;
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
                const metadata = Authority.getCloudDiscoveryMetadataFromNetworkResponse(parsedResponse.metadata, this.hostnameAndPort);
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
     * @param networkInterface 
     */
    private async getCloudDiscoveryMetadataFromNetwork(): Promise<CloudDiscoveryMetadata | null> {
        const instanceDiscoveryEndpoint = `${Constants.AAD_INSTANCE_DISCOVERY_ENDPT}${this.canonicalAuthority}oauth2/v2.0/authorize`;
        let match = null;
        try {
            const response = await this.networkInterface.sendGetRequestAsync<CloudInstanceDiscoveryResponse>(instanceDiscoveryEndpoint);
            const metadata = isCloudInstanceDiscoveryResponse(response.body) ? response.body.metadata : [];
            if (metadata.length === 0) {
                // If no metadata is returned, authority is untrusted
                return null;
            }
            match = Authority.getCloudDiscoveryMetadataFromNetworkResponse(metadata, this.hostnameAndPort);
        } catch(e) {
            return null;
        }

        if (!match) {
            // Custom Domain scenario, host is trusted because Instance Discovery call succeeded 
            match = Authority.createCloudDiscoveryMetadataFromHost(this.hostnameAndPort);
        }
        return match;
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
    static getCloudDiscoveryMetadataFromNetworkResponse(response: CloudDiscoveryMetadata[], authority: string): CloudDiscoveryMetadata | null {
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
        return Constants.KNOWN_PUBLIC_CLOUDS.includes(host);
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
        metadata.token_endpoint = Authority.buildRegionalAuthorityString(metadata.token_endpoint, azureRegion, "allowestsrnonmsi=true");
        metadata.end_session_endpoint = Authority.buildRegionalAuthorityString(metadata.end_session_endpoint, azureRegion);
        
        return metadata;
    }
}
