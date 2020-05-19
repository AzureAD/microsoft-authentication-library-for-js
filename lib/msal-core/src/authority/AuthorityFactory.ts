/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 */
import { Authority } from "./Authority";
import { StringUtils } from "../utils/StringUtils";
import { UrlUtils } from "../utils/UrlUtils";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ITenantDiscoveryResponse, OpenIdConfiguration } from './ITenantDiscoveryResponse';
import TelemetryManager from '../telemetry/TelemetryManager';

export class AuthorityFactory {
    private static metadataMap = new Map<string, ITenantDiscoveryResponse>();

    /**
     * Use when Authority is B2C and validateAuthority is set to True to provide list of allowed domains.
     */
    public static setKnownAuthorities(validateAuthority: boolean, knownAuthorities: Array<string>): void {
        if (validateAuthority && !Object.keys(B2CTrustedHostList).length){
            knownAuthorities.forEach(function(authority){
                B2CTrustedHostList[authority] = authority;
            });
        }
    }

    public static async resolveAuthorityAsync(authorityInstance: Authority, telemetryManager: TelemetryManager, correlationId: string): Promise<ITenantDiscoveryResponse> {
        const metadata = await authorityInstance.resolveEndpointsAsync(telemetryManager, correlationId);
        this.metadataMap.set(authorityInstance.CanonicalAuthority, metadata);
        return metadata;
    }

    public static getAuthorityMetadata(authorityUrl: string) {
        return this.metadataMap.get(authorityUrl);
    }

    public static parseAuthorityMetadata(authorityUrl: string, authorityMetadataJson: string) {
        try {
            if (authorityMetadataJson) {
                const parsedMetadata = JSON.parse(authorityMetadataJson) as OpenIdConfiguration;

                if (!parsedMetadata.authorization_endpoint || !parsedMetadata.end_session_endpoint || !parsedMetadata.issuer) {
                    throw ClientConfigurationError.createInvalidAuthorityMetadataError();
                }

                this.metadataMap.set(authorityUrl, {
                    AuthorizationEndpoint: parsedMetadata.authorization_endpoint,
                    EndSessionEndpoint: parsedMetadata.end_session_endpoint,
                    Issuer: parsedMetadata.issuer
                });
            }
        } catch (e) {
            throw ClientConfigurationError.createInvalidAuthorityMetadataError();
        }
    }

    /**
     * Create an authority object of the correct type based on the url
     * Performs basic authority validation - checks to see if the authority is of a valid type (eg aad, b2c)
     */
    public static CreateInstance(authorityUrl: string, validateAuthority: boolean, authorityMetadata?: string): Authority {
        if (StringUtils.isEmpty(authorityUrl)) {
            return null;
        }
        return new Authority(authorityUrl, validateAuthority, authorityMetadata);
    }
}
