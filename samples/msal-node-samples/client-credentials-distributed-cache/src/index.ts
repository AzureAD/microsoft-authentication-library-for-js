/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import fs from "fs";
import dotenv from "dotenv";
import yargs from "yargs";
import { createClient, RedisClientType } from "redis";
import {
    PerformanceObserver,
    PerformanceObserverEntryList,
    PerformanceEntry,
} from "perf_hooks";

import { AuthProvider, AppConfig } from "./AuthProvider";
import AxiosHelper from "./AxiosHelper";
import ProvisionHandler from "./ProvisionHandler";

dotenv.config();

const options: { [key: string]: any } = yargs
    .usage("Usage: --tenant <tenantId> --operation <operationName>")
    .option("i", {
        alias: "instance",
        describe: "cloud instance",
        type: "string",
        demandOption: false,
    })
    .option("t", {
        alias: "tenant",
        describe: "tenant id",
        type: "string",
        demandOption: true,
    })
    .option("o", {
        alias: "operation",
        describe: "operation name",
        type: "string",
        demandOption: true,
    }).argv;

const appConfig: AppConfig = {
    instance:
        options.instance || process.env.INSTANCE || "ENTER_CLOUD_INSTANCE_HERE", // if instance is provided as a command line arg, use that first
    tenantId: options.tenant || process.env.TENANT_ID || "ENTER_TENANT_ID_HERE", // if tenantId is provided as a command line arg, use that first
    clientId: process.env.CLIENT_ID || "ENTER_CLIENT_ID_HERE",
    clientSecret: process.env.CLIENT_SECRET || "ENTER_CLIENT_SECRET_HERE", // in production, use a certificate instead -see the README for more
};

async function main() {
    initializePerformanceObserver();

    try {
        const cacheClient = await initializeRedisClient();
        const authProvider = await AuthProvider.initialize(
            appConfig,
            cacheClient
        );

        switch (options.operation) {
            case "provisionApp":
                const provisionHandler = new ProvisionHandler();

                const isGranted = await provisionHandler.grantAdminConsent(
                    appConfig.instance,
                    appConfig.tenantId,
                    appConfig.clientId,
                    "https://graph.microsoft.com/.default"
                );

                if (isGranted) {
                    console.log("Admin consent granted");
                    process.exit(0);
                }

                console.log("Admin consent not granted");
                process.exit(1);
            case "getUsers":
                const tokenResponse = await authProvider.getToken({
                    scopes: ["https://graph.microsoft.com/.default"],
                });

                const graphResponse = await AxiosHelper.callDownstreamApi(
                    "https://graph.microsoft.com/v1.0/users",
                    tokenResponse?.accessToken
                );

                console.log(graphResponse);
                process.exit(0);
            default:
                console.log("Selected operation is not found");
                process.exit(1);
        }
    } catch (error) {
        process.exit(1);
    }
}

function initializePerformanceObserver(): void {
    const perfObserver = new PerformanceObserver(
        (items: PerformanceObserverEntryList) => {
            let durationInCacheInMs = 0;
            let durationTotalInMs = 0;
            let tokenSource;

            items
                .getEntriesByName("beforeCacheAccess")
                .forEach((entry: PerformanceEntry) => {
                    durationInCacheInMs += entry.duration;
                });

            items
                .getEntriesByName("afterCacheAccess")
                .forEach((entry: PerformanceEntry) => {
                    durationInCacheInMs += entry.duration;
                });

            items
                .getEntriesByName("acquireTokenByClientCredential-fromNetwork")
                .forEach((entry: PerformanceEntry) => {
                    durationTotalInMs = entry.duration;
                    tokenSource = "network";
                });

            items
                .getEntriesByName("acquireTokenByClientCredential-fromCache")
                .forEach((entry: PerformanceEntry) => {
                    durationTotalInMs = entry.duration;
                    tokenSource = "cache";
                });

            if (tokenSource) {
                const results = {
                    tokenSource,
                    durationTotalInMs,
                    durationInCacheInMs,
                    durationInHttpInMs:
                        tokenSource === "network"
                            ? durationTotalInMs - durationInCacheInMs
                            : 0,
                };

                fs.appendFile(
                    "benchmarks.json",
                    `${JSON.stringify(results)}\n`,
                    function (error) {
                        if (error) {
                            throw error;
                        }
                    }
                );
            }
        }
    );

    perfObserver.observe({ entryTypes: ["measure"], buffered: true });
}

async function initializeRedisClient(): Promise<RedisClientType> {
    /**
     * Configure connection strategy and other settings. See:
     * https://github.com/redis/node-redis/blob/master/docs/client-configuration.md
     */
    const redis = createClient({
        socket: {
            reconnectStrategy: false,
        },
    });

    redis.on("error", (error: any) => console.log("Redis Client Error", error));

    await redis.connect();
    return redis as RedisClientType;
}

main();
