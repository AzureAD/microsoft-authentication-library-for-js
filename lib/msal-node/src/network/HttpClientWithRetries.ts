/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    HeaderNames,
    INetworkModule,
    NetworkRequestOptions,
    NetworkResponse,
} from "@azure/msal-common/node";
import { IHttpRetryPolicy } from "../retry/IHttpRetryPolicy.js";
import { HttpMethod } from "../utils/Constants.js";

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

    private async sendNetworkRequestAsyncHelper<T>(
        httpMethod: HttpMethod,
        url: string,
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        if (httpMethod === HttpMethod.GET) {
            return this.httpClientNoRetries.sendGetRequestAsync(url, options);
        } else {
            return this.httpClientNoRetries.sendPostRequestAsync(url, options);
        }
    }

    private async sendNetworkRequestAsync<T>(
        httpMethod: HttpMethod,
        url: string,
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        // the underlying network module (custom or HttpClient) will make the call
        let response: NetworkResponse<T> =
            await this.sendNetworkRequestAsyncHelper(httpMethod, url, options);

        let currentRetry: number = 0;
        while (
            await this.retryPolicy.pauseForRetry(
                response.status,
                currentRetry,
                response.headers[HeaderNames.RETRY_AFTER]
            )
        ) {
            response = await this.sendNetworkRequestAsyncHelper(
                httpMethod,
                url,
                options
            );
            currentRetry++;
        }

        return response;
    }

    public async sendGetRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        return this.sendNetworkRequestAsync(HttpMethod.GET, url, options);
    }

    public async sendPostRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        return this.sendNetworkRequestAsync(HttpMethod.POST, url, options);
    }
}
