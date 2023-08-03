/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import benchmark from "benchmark";
import * as msal from "@azure/msal-node";
import {
    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    NetworkUtils,
} from "../Constants.js";

const clientConfig = {
    auth: {
        clientId: "client_id",
        authority: "https://login.microsoftonline.com/tenant_id",
        knownAuthorities: ["https://login.microsoftonline.com/tenant_id"],
        clientSecret: "client_secret",
    },
    system: {
        networkClient: new class CustomHttpClient {
            sendGetRequestAsync(url, options, cancellationToken) {
                return new Promise((resolve, reject) => {
                    const networkResponse = NetworkUtils.getNetworkResponse(
                        DEFAULT_OPENID_CONFIG_RESPONSE.headers,
                        DEFAULT_OPENID_CONFIG_RESPONSE.body,
                        DEFAULT_OPENID_CONFIG_RESPONSE.status,
                    );
                    resolve(networkResponse);
                });
            }
            sendPostRequestAsync(url, options) {
                return new Promise((resolve, _reject) => {
                    const networkResponse = NetworkUtils.getNetworkResponse(
                        CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.headers,
                        CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body,
                        CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.status,
                    );
                    resolve(networkResponse);
                });
            }
        }
    },
};

const NUM_CACHE_ITEMS = 10;

const confidentialClientApplication = new msal.ConfidentialClientApplication(clientConfig);
const firstResourceRequest = {
    scopes: ["resource-1/.default"],
};
const lastResourceRequest = {
    scopes: [`resource-${NUM_CACHE_ITEMS}/.default`],
};

(async () => {
    // pre populate the cache
    for (let i = 1; i <= NUM_CACHE_ITEMS; i++) {
        const request = {
            scopes: [`resource-${i}/.default`],
        };
        await confidentialClientApplication.acquireTokenByClientCredential(request);
    }

    const suite = new benchmark.Suite();
    suite
        .add("ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsFirstItemInTheCache", {
            "fn": async () => {
                await confidentialClientApplication.acquireTokenByClientCredential(firstResourceRequest);
            },
            "minSamples": 150,
        })
        .add("ConfidentialClientApplication#acquireTokenByClientCredential-fromCache-resourceIsLastItemInTheCache", {
            "fn": async () => {
                await confidentialClientApplication.acquireTokenByClientCredential(lastResourceRequest);
            },
            "minSamples": 150,
        })
        .on("cycle", (event) => {
            // eslint-disable-next-line no-console
            console.log(String(event.target));
        })
        .run({ "async": true });
})();
