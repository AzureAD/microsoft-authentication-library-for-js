/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 */
import { Authority } from "./Authority";
import { StringUtils } from "../utils/StringUtils";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ITenantDiscoveryResponse, OpenIdConfiguration } from './ITenantDiscoveryResponse';
import TelemetryManager from '../telemetry/TelemetryManager';
import { XhrClient, XhrResponse } from '../XHRClient';
import HttpEvent from '../telemetry/HttpEvent';

export class AuthorityFactory {
    private static metadataMap = new Map<string, ITenantDiscoveryResponse>();

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
     * Use when validateAuthority is set to True to provide list of allowed domains.
     */
    public static async setKnownAuthorities(validateAuthority: boolean, knownAuthorities: Array<string>, telemetryManager: TelemetryManager, correlationId?: string): Promise<void> {
        if (validateAuthority && !Authority.TrustedHostList.length){
            knownAuthorities.forEach(function(authority){
                Authority.TrustedHostList.push(authority);
            });

            if (!Authority.TrustedHostList.length){
                await this.setTrustedAuthoritiesFromNetwork(telemetryManager, correlationId);
            }
        }
    }

    private static async getAliases(telemetryManager: TelemetryManager, correlationId?: string): Promise<Array<any>> {
        const client: XhrClient = new XhrClient();

        const httpMethod = "GET";
        const httpEvent: HttpEvent = telemetryManager.createAndStartHttpEvent(correlationId, httpMethod, Authority.AadInstanceDiscoveryEndpoint, "getAliases");
        return client.sendRequestAsync(Authority.AadInstanceDiscoveryEndpoint, httpMethod, true)
            .then((response: XhrResponse) => {
                httpEvent.httpResponseStatus = response.statusCode;
                telemetryManager.stopEvent(httpEvent);
                return response.body.metadata;
            })
            .catch(err => {
                httpEvent.serverErrorCode = err;
                telemetryManager.stopEvent(httpEvent);
                throw err;
            });
   }

    private static async setTrustedAuthoritiesFromNetwork(telemetryManager: TelemetryManager, correlationId?: string): Promise<void> {
        const metadata = await this.getAliases(telemetryManager, correlationId);
        metadata.forEach(function(entry: any){
            const authorities: Array<string> = entry.aliases;
            authorities.forEach(function(authority: string) {
                Authority.TrustedHostList.push(authority);
            });
        });
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

        return new Authority(authorityUrl, validateAuthority, this.metadataMap.get(authorityUrl));
    }
}
