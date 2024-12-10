/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { performance } from "perf_hooks";
import { RedisClientType } from "redis";
import {
    Configuration,
    LogLevel,
    ConfidentialClientApplication,
    ClientCredentialRequest,
    AuthenticationResult,
} from "@azure/msal-node";

import CustomCachePlugin from "./CustomCachePlugin";
import RedisClientWrapper from "./RedisClientWrapper";
import AxiosHelper from "./AxiosHelper";

export type AppConfig = {
    instance: string;
    tenantId: string;
    clientId: string;
    clientSecret: string; // in production, use a certificate instead
};

export class AuthProvider {
    private msalConfig: Configuration;
    private cacheClientWrapper: RedisClientWrapper;
    private partitionKey: string;

    private constructor(
        msalConfig: Configuration,
        cacheClient: RedisClientType,
        partitionKey: string
    ) {
        this.msalConfig = msalConfig;
        this.cacheClientWrapper = new RedisClientWrapper(cacheClient);
        this.partitionKey = partitionKey;
    }

    /**
     * Instantiates an MSAL CCA object with the metadata required for token acquisition, either to
     * be retrieved from the cache or from the network call to the relevant endpoints. For more, see:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/performance.md
     * @param appConfig
     * @param cacheClient
     * @returns
     */
    static async initialize(
        appConfig: AppConfig,
        cacheClient: RedisClientType
    ): Promise<AuthProvider> {
        const msalConfig = {
            auth: {
                clientId: appConfig.clientId,
                authority: `${appConfig.instance}/${appConfig.tenantId}`,
                clientSecret: appConfig.clientSecret,
            },
            system: {
                loggerOptions: {
                    loggerCallback(loglevel, message, containsPii) {
                        console.log(message);
                    },
                    logLevel: LogLevel.Trace,
                    piiLoggingEnabled: false,
                },
                // proxyUrl: "http://localhost:8888" // uncomment to capture traffic with Fiddler
            },
        } as Configuration;

        const partitionKey = `${appConfig.clientId}.${appConfig.tenantId}`;
        const msalConfigWithMetadata = await AuthProvider.getMetadata(
            msalConfig,
            cacheClient,
            partitionKey
        );

        return new AuthProvider(
            msalConfigWithMetadata,
            cacheClient,
            partitionKey
        );
    }

    async getToken(
        tokenRequest: ClientCredentialRequest
    ): Promise<AuthenticationResult | null> {
        const cca = new ConfidentialClientApplication({
            ...this.msalConfig,
            cache: {
                cachePlugin: new CustomCachePlugin(
                    this.cacheClientWrapper,
                    this.partitionKey // <clientId>.<tenantId>
                ),
            },
        });

        let tokenResponse = null;

        performance.mark("acquireTokenByClientCredential-start");
        tokenResponse = await cca.acquireTokenByClientCredential(tokenRequest);
        performance.mark("acquireTokenByClientCredential-end");
        performance.measure(
            tokenResponse?.fromCache
                ? "acquireTokenByClientCredential-fromCache"
                : "acquireTokenByClientCredential-fromNetwork",
            "acquireTokenByClientCredential-start",
            "acquireTokenByClientCredential-end"
        );

        return tokenResponse;
    }

    private static async getMetadata(
        msalConfig: Configuration,
        cacheClient: RedisClientType,
        partitionKey: string
    ): Promise<Configuration> {
        let [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
            cacheClient.get(`${partitionKey}.discovery-metadata`),
            cacheClient.get(`${partitionKey}.authority-metadata`),
        ]);

        if (!cloudDiscoveryMetadata || !authorityMetadata) {
            [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
                AuthProvider.fetchCloudDiscoveryMetadata(
                    partitionKey.split(".")[1]
                ),
                AuthProvider.fetchOIDCMetadata(partitionKey.split(".")[1]),
            ]);

            if (cloudDiscoveryMetadata && authorityMetadata) {
                await cacheClient.set(
                    `${partitionKey}.discovery-metadata`,
                    JSON.stringify(cloudDiscoveryMetadata)
                );
                await cacheClient.set(
                    `${partitionKey}.authority-metadata`,
                    JSON.stringify(authorityMetadata)
                );
            }
        }

        const msalConfigWithMetadata = msalConfig;
        msalConfigWithMetadata.auth.cloudDiscoveryMetadata =
            typeof cloudDiscoveryMetadata === "string"
                ? cloudDiscoveryMetadata
                : JSON.stringify(cloudDiscoveryMetadata);
        msalConfigWithMetadata.auth.authorityMetadata =
            typeof authorityMetadata === "string"
                ? authorityMetadata
                : JSON.stringify(authorityMetadata);

        return msalConfigWithMetadata;
    }

    private static async fetchCloudDiscoveryMetadata(
        tenantId: string
    ): Promise<any> {
        const endpoint =
            "https://login.microsoftonline.com/common/discovery/instance";

        return await AxiosHelper.callDownstreamApi(endpoint, undefined, {
            "api-version": "1.1",
            authorization_endpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
        });
    }

    private static async fetchOIDCMetadata(tenantId: string): Promise<any> {
        const endpoint = `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`;

        return await AxiosHelper.callDownstreamApi(endpoint);
    }
}
