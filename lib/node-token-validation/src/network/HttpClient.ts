/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, NetworkRequestOptions, NetworkResponse } from "@azure/msal-common";
import axios, { AxiosRequestConfig } from "axios";
import { HttpMethod } from "../utils/Constants";

export class HttpClient implements INetworkModule {

    async sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): Promise<NetworkResponse<T>> {
        const request: AxiosRequestConfig = {
            method: HttpMethod.GET,
            url: url,
            headers: options && options.headers,
            validateStatus: () => true
        };

        const response = await axios(request);

        return {
            headers: response.headers,
            body: response.data as T,
            status: response.status
        };
    }

    async sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): Promise<NetworkResponse<T>> {
        const request: AxiosRequestConfig = {
            method: HttpMethod.POST,
            url: url,
            data: (options && options.body) || "",
            headers: options && options.headers,
            validateStatus: () => true
        };

        const response = await axios(request);

        return {
            headers: response.headers,
            body: response.data as T,
            status: response.status
        };
    }
}
