/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    INetworkModule,
    NetworkRequestOptions,
    NetworkResponse,
} from "@azure/msal-common";
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
        
        const fetchOptions =  {
            headers: options?.headers,
            body: options?.body,
        };

        if (proxy) {
            fetchOptions["agent"] = new HttpsProxyAgent(proxy);
        }

        response = await fetch(url, fetchOptions);
        responseObject["headers"] = response.headers.raw();
        responseObject["body"] = await response.json();
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
        
        const fetchOptions =  {
            headers: options?.headers,
            body: options?.body,
            method: "post",
        };

        if (proxy) {
            fetchOptions["agent"] = new HttpsProxyAgent(proxy);
        }

        response = await fetch(url, fetchOptions);
        responseObject["headers"] = response.headers.raw();
        responseObject["body"] = await response.json();
        responseObject["status"] = response.status;

        return responseObject;
    }
}
