/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 */
import { AadAuthority } from "./AadAuthority";
import { B2cAuthority, B2CTrustedHostList } from "./B2cAuthority";
import { Authority, AuthorityType } from "./Authority";
import { StringUtils } from "../utils/StringUtils";
import { UrlUtils } from "../utils/UrlUtils";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ITenantDiscoveryResponse, OpenIdConfiguration } from "./ITenantDiscoveryResponse";
import TelemetryManager from "../telemetry/TelemetryManager";

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

    public static async saveMetadataFromNetwork(authorityInstance: Authority, telemetryManager: TelemetryManager, correlationId: string): Promise<ITenantDiscoveryResponse> {
        const metadata = await authorityInstance.resolveEndpointsAsync(telemetryManager, correlationId);
        this.metadataMap.set(authorityInstance.CanonicalAuthority, metadata);
        return metadata;
    }

    public static getMetadata(authorityUrl: string) {
        return this.metadataMap.get(authorityUrl);
    }

    public static saveMetadataFromConfig(authorityUrl: string, authorityMetadataJson: string) {
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
     * Parse the url and determine the type of authority
     */
    private static detectAuthorityFromUrl(authorityUrl: string): AuthorityType {
        authorityUrl = UrlUtils.CanonicalizeUri(authorityUrl);
        const components = UrlUtils.GetUrlComponents(authorityUrl);
        const pathSegments = components.PathSegments;

        if (pathSegments[0] === "adfs") {
            return AuthorityType.Adfs;
        }
        else if (Object.keys(B2CTrustedHostList).length) {
            return AuthorityType.B2C;
        }

        // Defaults to Aad
        return AuthorityType.Aad;
    }

    /**
     * Create an authority object of the correct type based on the url
     * Performs basic authority validation - checks to see if the authority is of a valid type (eg aad, b2c)
     */
    public static CreateInstance(authorityUrl: string, validateAuthority: boolean, authorityMetadata?: string): Authority {
        if (StringUtils.isEmpty(authorityUrl)) {
            return null;
        }

        if (authorityMetadata) {
            // todo: log statements
            this.saveMetadataFromConfig(authorityUrl, authorityMetadata);
        }

        const type = AuthorityFactory.detectAuthorityFromUrl(authorityUrl);
        // Depending on above detection, create the right type.
        switch (type) {
            case AuthorityType.B2C:
                return new B2cAuthority(authorityUrl, validateAuthority, this.getMetadata(authorityUrl));
            case AuthorityType.Aad:
                return new AadAuthority(authorityUrl, validateAuthority, this.getMetadata(authorityUrl));
            default:
                throw ClientConfigurationError.createInvalidAuthorityTypeError();
        }
    }

}
