/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    INetworkModule,
    NetworkRequestOptions,
    NetworkResponse,
} from "@azure/msal-node";

enum HttpMethod {
    GET = "GET",
    POST = "POST",
}

/*const proxy: AxiosProxyConfig = {
    protocol: "http", // Can also be "https"
    host: "localhost",
    port: 8866, // Fiddler Everywhere default port; configurable inside of Fiddler's settings
    // port: 8888, // Fiddler Classic default port; configurable inside of Fiddler's settings
    // auth: { // Optional: for authenticated proxies
    //     username: "username",
    //     password: "password",
    // }
};*/

/**
 * This class implements the API for network requests.
 */
export class HttpClientFetch implements INetworkModule {
    /**
     * Http Get request
     * @param url
     * @param options
     */
    async sendGetRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions,
        timeout?: number
    ): Promise<NetworkResponse<T>> {
        const controller = new AbortController();
        if (timeout) {
            setTimeout(() => controller.abort(), timeout);
        }

        const response = await fetch(url, {
            method: HttpMethod.GET,
            headers: options && options.headers,
            signal: controller.signal,
        });

        const body = await response.json();
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });

        return {
            headers,
            body: body as T,
            status: response.status,
        };
    }

    /**
     * Http Post request
     * @param url
     * @param options
     */
    async sendPostRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        const response = await fetch(url, {
            method: HttpMethod.POST,
            body: (options && options.body) || "",
            headers: options && options.headers,
        });

        const responseBody = await response.json();
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });

        return {
            headers,
            body: responseBody as T,
            status: response.status,
        };
    }
}
