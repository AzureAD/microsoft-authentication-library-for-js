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
import { ITenantDiscoveryResponse, OpenIdConfiguration } from "./ITenantDiscoveryResponse";
import TelemetryManager from "../telemetry/TelemetryManager";
import { XhrClient, XhrResponse } from "../XHRClient";
import HttpEvent from "../telemetry/HttpEvent";
import { UrlUtils } from '../utils/UrlUtils';

export class AuthorityFactory {
    private static metadataMap = new Map<string, ITenantDiscoveryResponse>();
    private static TrustedHostList: Array<string> = [];

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
     * This should be called on MSAL initialization
     */
    public static async setKnownAuthorities(validateAuthority: boolean, knownAuthorities: Array<string>, telemetryManager: TelemetryManager, correlationId?: string): Promise<void> {
        if (validateAuthority && !this.getTrustedHostList().length){
            knownAuthorities.forEach(function(authority){
                this.TrustedHostList.push(authority.toLowerCase());
            });

            if (!this.getTrustedHostList().length){
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
                this.TrustedHostList.push(authority.toLowerCase());
            });
        });
    } 

    public static getTrustedHostList(): Array<string> {
        return this.TrustedHostList;
    }

    /**
     * Checks to see if the host is in a list of trusted hosts
     * @param {string} The host to look up
     */
    public static IsInTrustedHostList(host: string): boolean {
        return this.getTrustedHostList().indexOf(host.toLowerCase()) > -1;
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

        const host = UrlUtils.GetUrlComponents(authorityUrl).HostNameAndPort;
        if (validateAuthority && !this.IsInTrustedHostList(host)) {
            throw ClientConfigurationError.createUntrustedAuthorityError();
        }

        return new Authority(authorityUrl, this.metadataMap.get(authorityUrl));
    }
}
