/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    INetworkModule,
    NetworkRequestOptions,
    NetworkResponse,
} from "@azure/msal-node";
import axios, { AxiosRequestConfig } from "axios";

enum HttpMethod {
    GET = "get",
    POST = "post",
}

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
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        const request: AxiosRequestConfig = {
            method: HttpMethod.GET,
            url: url,
            /* istanbul ignore next */
            headers: options && options.headers,
            /* istanbul ignore next */
            validateStatus: () => true,
        };

        const response = await axios(request);
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
        options?: NetworkRequestOptions,
        cancellationToken?: number
    ): Promise<NetworkResponse<T>> {
        const request: AxiosRequestConfig = {
            method: HttpMethod.POST,
            url: url,
            /* istanbul ignore next */
            data: (options && options.body) || "",
            timeout: cancellationToken,
            /* istanbul ignore next */
            headers: options && options.headers,
            /* istanbul ignore next */
            validateStatus: () => true,
        };

        const response = await axios(request);
        return {
            headers: response.headers as Record<string, string>,
            body: response.data as T,
            status: response.status,
        };
    }
}
