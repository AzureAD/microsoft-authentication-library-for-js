/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import benchmark from "benchmark";
import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import * as msal from "@azure/msal-node";
import {
    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    NetworkUtils,
} from "../Constants.js";

const require = createRequire(import.meta.url);
const resolvedPackage = realpathSync(
    require.resolve("@azure/msal-node/package.json")
);
const workspacePackage = realpathSync(
    fileURLToPath(
        new URL("../../../lib/msal-node/package.json", import.meta.url)
    )
);
if (resolvedPackage !== workspacePackage) {
    throw new Error(
        "The client-credential benchmark must use the current msal-node workspace build."
    );
}

const clientConfig = {
    auth: {
        clientId: "client_id",
        authority: "https://login.microsoftonline.com/tenant_id",
        knownAuthorities: ["https://login.microsoftonline.com/tenant_id"],
        clientSecret: "client_secret",
    },
    system: {
        networkClient: new (class CustomHttpClient {
            sendGetRequestAsync(url, options, cancellationToken) {
                return new Promise((resolve, reject) => {
                    const networkResponse = NetworkUtils.getNetworkResponse(
                        DEFAULT_OPENID_CONFIG_RESPONSE.headers,
                        DEFAULT_OPENID_CONFIG_RESPONSE.body,
                        DEFAULT_OPENID_CONFIG_RESPONSE.status
                    );
                    resolve(networkResponse);
                });
            }
            sendPostRequestAsync(url, options) {
                return new Promise((resolve, _reject) => {
                    const networkResponse = NetworkUtils.getNetworkResponse(
                        CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.headers,
                        CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body,
                        CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.status
                    );
                    resolve(networkResponse);
                });
            }
        })(),
    },
};

const SMALL_CACHE_ITEMS = 10;
const LARGE_CACHE_ITEMS = 5_000;
const MIN_BENCHMARK_SAMPLES = 30;

async function createPopulatedClient(cacheItems) {
    const client = new msal.ConfidentialClientApplication(clientConfig);
    for (let i = 1; i <= cacheItems; i++) {
        await client.acquireTokenByClientCredential({
            scopes: [`resource-${i}/.default`],
        });
    }

    const serializedCache = JSON.parse(client.getTokenCache().serialize());
    const retainedAccessTokens = Object.keys(
        serializedCache.AccessToken ?? {}
    ).length;
    if (retainedAccessTokens !== cacheItems) {
        throw new Error(
            `Expected ${cacheItems} cached access tokens before benchmarking, found ${retainedAccessTokens}.`
        );
    }

    return client;
}

function cacheHitBenchmark(client, request) {
    return {
        defer: true,
        fn: (deferred) => {
            client.acquireTokenByClientCredential(request).then(
                () => deferred.resolve(),
                (error) => {
                    deferred.benchmark.error = error;
                    deferred.resolve();
                }
            );
        },
        minSamples: MIN_BENCHMARK_SAMPLES,
    };
}

(async () => {
    const smallCacheClient = await createPopulatedClient(SMALL_CACHE_ITEMS);
    const largeCacheClient = await createPopulatedClient(LARGE_CACHE_ITEMS);
    const firstResourceRequest = {
        scopes: ["resource-1/.default"],
    };
    const smallCacheLastResourceRequest = {
        scopes: [`resource-${SMALL_CACHE_ITEMS}/.default`],
    };
    const largeCacheLastResourceRequest = {
        scopes: [`resource-${LARGE_CACHE_ITEMS}/.default`],
    };

    const suite = new benchmark.Suite();
    suite
        .add(
            "ConfidentialClientApplication#acquireTokenByClientCredential-completedAsync-fromCache-resourceIsFirstItemInTheCache",
            cacheHitBenchmark(smallCacheClient, firstResourceRequest)
        )
        .add(
            "ConfidentialClientApplication#acquireTokenByClientCredential-completedAsync-fromCache-resourceIsLastItemInTheCache",
            cacheHitBenchmark(smallCacheClient, smallCacheLastResourceRequest)
        )
        .add(
            "ConfidentialClientApplication#acquireTokenByClientCredential-completedAsync-fromCache-largeCache-resourceIsFirstItemInTheCache",
            cacheHitBenchmark(largeCacheClient, firstResourceRequest)
        )
        .add(
            "ConfidentialClientApplication#acquireTokenByClientCredential-completedAsync-fromCache-largeCache-resourceIsLastItemInTheCache",
            cacheHitBenchmark(largeCacheClient, largeCacheLastResourceRequest)
        )
        .on("cycle", (event) => {
            // eslint-disable-next-line no-console
            console.log(String(event.target));
        })
        .on("error", (event) => {
            process.exitCode = 1;
            // eslint-disable-next-line no-console
            console.error(
                `Benchmark failed: ${event.target.name}`,
                event.target.error
            );
        })
        .run({ async: true });
})();
