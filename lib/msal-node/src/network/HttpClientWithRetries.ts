/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    INetworkModule,
    NetworkRequestOptions,
    NetworkResponse,
} from "@azure/msal-common";
import { IHttpRetryPolicy } from "../retry/IHttpRetryPolicy";

export class HttpClientWithRetries implements INetworkModule {
    private httpClientNoRetries: INetworkModule;
    private retryPolicy: IHttpRetryPolicy;

    constructor(
        httpClientNoRetries: INetworkModule,
        retryPolicy: IHttpRetryPolicy
    ) {
        this.httpClientNoRetries = httpClientNoRetries;
        this.retryPolicy = retryPolicy;
    }

    async sendGetRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        // the underlying network module (custom or HttpClient) will make the call
        let response: NetworkResponse<T> =
            await this.httpClientNoRetries.sendGetRequestAsync(url, options);

        let currentRetry: number = 0;
        while (
            await this.retryPolicy.pauseForRetry(response.status, currentRetry)
        ) {
            response = await this.httpClientNoRetries.sendGetRequestAsync(
                url,
                options
            );
            currentRetry++;
        }

        return response;
    }

    async sendPostRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        // the underlying network module (custom or HttpClient) will make the call
        let response: NetworkResponse<T> =
            await this.httpClientNoRetries.sendPostRequestAsync(url, options);

        let currentRetry: number = 0;
        while (
            await this.retryPolicy.pauseForRetry(response.status, currentRetry)
        ) {
            response = await this.httpClientNoRetries.sendPostRequestAsync(
                url,
                options
            );
            currentRetry++;
        }

        return response;
    }
}
