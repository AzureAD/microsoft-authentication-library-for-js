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
import { AADServerParamKeys, AuthorityMetadataSource, Constants } from "../utils/Constants";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ProtocolMode } from "./ProtocolMode";
import { ICacheManager } from "../cache/interface/ICacheManager";
import { AuthorityMetadataEntity } from "../cache/entities/AuthorityMetadataEntity";
import { AuthorityOptions } from "./AuthorityOptions";
import { CloudInstanceDiscoveryResponse, isCloudInstanceDiscoveryResponse } from "./CloudInstanceDiscoveryResponse";
import { CloudDiscoveryMetadata } from "./CloudDiscoveryMetadata";
import { version } from "../../package.json";

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

    constructor(authority: string, networkInterface: INetworkModule, cacheManager: ICacheManager, authorityOptions: AuthorityOptions) {
        this.canonicalAuthority = authority;
        this._canonicalAuthority.validateAsUri();
        this.networkInterface = networkInterface;
        this.cacheManager = cacheManager;
        this.authorityOptions = authorityOptions;
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
            return this.replaceTenant(this.metadata.authorization_endpoint);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    /**
     * OAuth /token endpoint for requests
     */
    public get tokenEndpoint(): string {
        if(this.discoveryComplete()) {
            return this.replaceTenant(this.metadata.token_endpoint);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    public get deviceCodeEndpoint(): string {
        if(this.discoveryComplete()) {
            return this.metadata.token_endpoint.replace("/token", "/devicecode");
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    /**
     * OAuth logout endpoint for requests
     */
    public get endSessionEndpoint(): string {
        if(this.discoveryComplete()) {
            return this.replaceTenant(this.metadata.end_session_endpoint);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    /**
     * OAuth issuer for requests
     */
    public get selfSignedJwtAudience(): string {
        if(this.discoveryComplete()) {
            return this.replaceTenant(this.metadata.issuer);
        } else {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Discovery incomplete.");
        }
    }

    /**
     * 
     * Bound Refresh Token support flag for requests
     */
    public get supportsBoundRefreshTokens(): boolean {
        if(this.discoveryComplete()) {
            return this.metadata.boundrt_supported || false;
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
        }

        const cloudDiscoverySource = await this.updateCloudDiscoveryMetadata(metadataEntity);
        this.canonicalAuthority = this.canonicalAuthority.replace(this.hostnameAndPort, metadataEntity.preferred_network);
        const endpointSource = await this.updateEndpointMetadata(metadataEntity);

        if (cloudDiscoverySource !== AuthorityMetadataSource.CACHE && endpointSource !== AuthorityMetadataSource.CACHE) {
            // Reset the expiration time unless both values came from a successful cache lookup
            metadataEntity.resetExpiresAt();
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

        if (metadataEntity.endpointsFromNetwork && !metadataEntity.isExpired()) {
            // No need to update
            return AuthorityMetadataSource.CACHE;
        }

        metadata = await this.getEndpointMetadataFromNetwork();
        if (metadata) {
            metadataEntity.updateEndpointMetadata(metadata, true);
            return AuthorityMetadataSource.NETWORK;
        } else {
            throw ClientAuthError.createUnableToGetOpenidConfigError(this.defaultOpenIdConfigurationEndpoint);
        }
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
        const headers: Record<string, string> = {};
        headers[AADServerParamKeys.X_CLIENT_SKU] = Constants.SKU;
        headers[AADServerParamKeys.X_CLIENT_VER] = version;
        try {
            const response = await this.networkInterface.sendGetRequestAsync<OpenIdConfigResponse>(this.defaultOpenIdConfigurationEndpoint, { headers: headers });
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
        if (metadataEntity.aliasesFromNetwork && !metadataEntity.isExpired()) {
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
}
