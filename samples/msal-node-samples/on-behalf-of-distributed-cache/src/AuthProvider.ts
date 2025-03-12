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
    AuthenticationResult,
    CryptoProvider,
    OnBehalfOfRequest,
} from "@azure/msal-node";

import CustomCachePlugin from "./CustomCachePlugin";
import RedisClientWrapper from "./RedisClientWrapper";
import AxiosHelper from "./AxiosHelper";

export type AppConfig = {
    instance: string;
    tenantId: string;
    clientId: string;
    clientSecret: string;
    permissions: string;
};

export class AuthProvider {
    private msalConfig: Configuration;
    private cryptoProvider: CryptoProvider;
    private cacheClientWrapper: RedisClientWrapper;

    private constructor(
        msalConfig: Configuration,
        cacheClient: RedisClientType
    ) {
        this.msalConfig = msalConfig;
        this.cryptoProvider = new CryptoProvider();
        this.cacheClientWrapper = new RedisClientWrapper(cacheClient);
    }

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

        const msalConfigWithMetadata = await AuthProvider.getMetadata(
            msalConfig,
            cacheClient
        );

        return new AuthProvider(msalConfigWithMetadata, cacheClient);
    }

    async getToken(
        tokenRequest: OnBehalfOfRequest
    ): Promise<AuthenticationResult | null> {
        const partitionKey = await this.cryptoProvider.hashString(
            tokenRequest.oboAssertion
        );

        const cca = new ConfidentialClientApplication({
            ...this.msalConfig,
            cache: {
                cachePlugin: new CustomCachePlugin(
                    this.cacheClientWrapper,
                    partitionKey // partitionKey hash(oboAssertion)
                ),
            },
        });

        performance.mark("acquireTokenOnBehalfOf-start");

        await cca.getTokenCache().getAllAccounts(); // required for cache read
        const tokenResponse = await cca.acquireTokenOnBehalfOf(tokenRequest);

        performance.mark("acquireTokenOnBehalfOf-end");
        performance.measure(
            tokenResponse?.fromCache
                ? "acquireTokenOnBehalfOf-fromCache"
                : "acquireTokenOnBehalfOf-fromNetwork",
            "acquireTokenOnBehalfOf-start",
            "acquireTokenOnBehalfOf-end"
        );

        return tokenResponse;
    }

    private static async getMetadata(
        msalConfig: Configuration,
        cacheClient: RedisClientType
    ): Promise<Configuration> {
        const msalConfigWithMetadata = msalConfig;

        const clientId = msalConfigWithMetadata.auth.clientId;
        const tenantId = msalConfigWithMetadata.auth
            .authority!.split("/")
            .pop()!;

        let [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
            cacheClient.get(`${clientId}.${tenantId}.discovery-metadata`),
            cacheClient.get(`${clientId}.${tenantId}.authority-metadata`),
        ]);

        if (!cloudDiscoveryMetadata || !authorityMetadata) {
            [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
                AuthProvider.fetchCloudDiscoveryMetadata(tenantId),
                AuthProvider.fetchOIDCMetadata(tenantId),
            ]);

            if (cloudDiscoveryMetadata && authorityMetadata) {
                await cacheClient.set(
                    `${clientId}.${tenantId}.discovery-metadata`,
                    JSON.stringify(cloudDiscoveryMetadata)
                );
                await cacheClient.set(
                    `${clientId}.${tenantId}.authority-metadata`,
                    JSON.stringify(authorityMetadata)
                );
            }
        }

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
