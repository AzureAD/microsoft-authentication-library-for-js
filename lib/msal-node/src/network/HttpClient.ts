/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    INetworkModule,
    NetworkRequestOptions,
    NetworkResponse,
} from "@azure/msal-common";
import { HttpMethod } from "../utils/Constants";
import axios, { AxiosRequestConfig } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import fetch from "node-fetch";

/**
 * This class implements the API for network requests.
 */
export class HttpClient implements INetworkModule {

    /**
     * Http Get request
     * @param url
     * @param options
     */
    async sendGetRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions,
        cancellationToken?: number,
        proxy?: string
    ): Promise<NetworkResponse<T>> {
        let response;
        let responseObject: any = {};

        if (proxy) {
            const fetchOptions =  {
                headers: options?.headers,
                body: options?.body,
                agent: new HttpsProxyAgent(proxy),
            };
    
            response = await fetch(url, fetchOptions);
            responseObject["headers"] = response.headers.raw();
            responseObject["body"] = await response.json();
        } else {
            const request: AxiosRequestConfig = {
                method: HttpMethod.GET,
                url: url,
                timeout: cancellationToken,
                headers: options && options.headers,
                validateStatus: () => true
            };

            response = await axios(request);
            responseObject["headers"] = response.headers;
            responseObject["body"] = response.data as T;
        }

        responseObject["status"] = response.status;
        return responseObject;
    }

    /**
     * Http Post request
     * @param url
     * @param options
     */
    async sendPostRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions,
        cancellationToken?: number,
        proxy?: string
    ): Promise<NetworkResponse<T>> {
        let response;
        let responseObject: any = {};

        if (proxy) {
            const fetchOptions =  {
                headers: options?.headers,
                body: options?.body,
                method: "post",
                agent: new HttpsProxyAgent(proxy),
            };
    
            response = await fetch(url, fetchOptions);
            responseObject["headers"] = response.headers.raw();
            responseObject["body"] = await response.json();
        } else {
            const request: AxiosRequestConfig = {
                method: HttpMethod.POST,
                url: url,
                data: (options && options.body) || "",
                timeout: cancellationToken,
                headers: options && options.headers,
                validateStatus: () => true
            };
    
            response = await axios(request);
            responseObject["headers"] = response.headers;
            responseObject["body"] = response.data as T;
        }

        responseObject["status"] = response.status;
        return responseObject;
    }
}
