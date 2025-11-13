/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    INetworkModule,
    NetworkRequestOptions,
    NetworkResponse,
} from "@azure/msal-node";
import axios, {
    // AxiosProxyConfig,
    AxiosRequestConfig,
    AxiosResponse,
} from "axios";

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
export class HttpClientAxios implements INetworkModule {
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
        const request: AxiosRequestConfig = {
            method: HttpMethod.GET,
            url: url,
            timeout: timeout,
            headers: options && options.headers,
            validateStatus: () => true,
            // proxy: proxy,
        };

        const response: AxiosResponse = await axios(request);
        return {
            headers: response.headers as Record<string, string>,
            body: response.data as T,
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
        const request: AxiosRequestConfig = {
            method: HttpMethod.POST,
            url: url,
            data: (options && options.body) || "",
            headers: options && options.headers,
            validateStatus: () => true,
            // proxy: proxy,
        };

        const response: AxiosResponse = await axios(request);
        return {
            headers: response.headers as Record<string, string>,
            body: response.data as T,
            status: response.status,
        };
    }
}
