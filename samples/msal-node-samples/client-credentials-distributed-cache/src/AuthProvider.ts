/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import axios from 'axios';
import { performance } from "perf_hooks";
import { RedisClientType } from "redis";
import {
    Configuration,
    LogLevel,
    ConfidentialClientApplication,
    ClientCredentialRequest,
    AuthenticationResult
} from "@azure/msal-node";

import CustomCachePlugin from "./CustomCachePlugin";
import RedisClientWrapper from "./RedisClientWrapper";

export type AppConfig = {
    instance: string;
    tenantId: string;
    clientId: string;
    clientSecret: string;
};

export class AuthProvider {
    private msalConfig: Configuration;
    private cacheClientWrapper: RedisClientWrapper;

    private constructor(msalConfig: Configuration, cacheClient: RedisClientType) {
        this.msalConfig = msalConfig;
        this.cacheClientWrapper = new RedisClientWrapper(cacheClient);
    }

    static async initialize(appConfig: AppConfig, cacheClient: RedisClientType): Promise<AuthProvider> {
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
                    piiLoggingEnabled: false
                },
                // proxyUrl: "http://localhost:8888" // uncomment to capture traffic with Fiddler
            }
        } as Configuration;

        const msalConfigWithMetadata = await AuthProvider.getMetadata(msalConfig, cacheClient);

        return new AuthProvider(msalConfigWithMetadata, cacheClient);
    }

    async getToken(tokenRequest: ClientCredentialRequest): Promise<AuthenticationResult | null> {
        const cca = new ConfidentialClientApplication({
            ...this.msalConfig,
            cache: {
                cachePlugin: new CustomCachePlugin(
                    this.cacheClientWrapper,
                    `${this.msalConfig.auth.clientId}.${this.msalConfig.auth.authority!.split("/").pop()!}` // partitionKey <clientId>.<tenantId>
                )
            }
        });

        let tokenResponse = null;

        try {
            performance.mark("acquireTokenByClientCredential-start");
            await cca.getTokenCache().getAllAccounts(); // required for triggering cache read
            tokenResponse = await cca.acquireTokenByClientCredential(tokenRequest);
            performance.mark("acquireTokenByClientCredential-end");
            performance.measure(
                tokenResponse?.fromCache ? "acquireTokenByClientCredential-fromCache" : "acquireTokenByClientCredential-fromNetwork",
                "acquireTokenByClientCredential-start",
                "acquireTokenByClientCredential-end"
            );
        } catch (error) {
            throw error;
        }

        return tokenResponse;
    }

    private static async getMetadata(msalConfig: Configuration, cacheClient: RedisClientType): Promise<Configuration> {
        const msalConfigWithMetadata = msalConfig;
        const clientId = msalConfigWithMetadata.auth.clientId;
        const tenantId = msalConfigWithMetadata.auth.authority!.split("/").pop()!;

        try {
            let [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
                cacheClient.get(`${clientId}.${tenantId}.discovery-metadata`),
                cacheClient.get(`${clientId}.${tenantId}.authority-metadata`)
            ]);

            if (!cloudDiscoveryMetadata || !authorityMetadata) {
                [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
                    AuthProvider.fetchCloudDiscoveryMetadata(tenantId),
                    AuthProvider.fetchAuthorityMetadata(tenantId)
                ]);

                if (cloudDiscoveryMetadata && authorityMetadata) {
                    await cacheClient.set(`${clientId}.${tenantId}.discovery-metadata`, JSON.stringify(cloudDiscoveryMetadata));
                    await cacheClient.set(`${clientId}.${tenantId}.authority-metadata`, JSON.stringify(authorityMetadata));
                }
            }

            msalConfigWithMetadata.auth.cloudDiscoveryMetadata = typeof cloudDiscoveryMetadata === 'string' ? cloudDiscoveryMetadata : JSON.stringify(cloudDiscoveryMetadata);
            msalConfigWithMetadata.auth.authorityMetadata = typeof authorityMetadata === 'string' ? authorityMetadata : JSON.stringify(authorityMetadata);
        } catch (error) {
            console.log(error);
        }

        return msalConfigWithMetadata;
    }

    private static async fetchCloudDiscoveryMetadata(tenantId: string): Promise<any> {
        const endpoint = 'https://login.microsoftonline.com/common/discovery/instance';

        try {
            const response = await axios.get(endpoint, {
                params: {
                    'api-version': '1.1',
                    'authorization_endpoint': `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`
                }
            });
            return await response.data;
        } catch (error) {
            console.log(error);
        }
    }

    private static async fetchAuthorityMetadata(tenantId: string): Promise<any> {
        const endpoint = `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`;

        try {
            const response = await axios.get(endpoint);
            return await response.data;
        } catch (error) {
            console.log(error);
        }
    }
}
