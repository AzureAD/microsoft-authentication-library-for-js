/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    HeaderNames,
    INetworkModule,
    NetworkRequestOptions,
    NetworkResponse,
} from "@azure/msal-common";
import { IHttpRetryPolicy } from "../retry/IHttpRetryPolicy";
import http from "http";
import { HttpMethod } from "../utils/Constants";

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

    private retryAfterMillisecondsToSleep(
        retryHeader: http.IncomingHttpHeaders["retry-after"]
    ): number {
        if (!retryHeader) {
            return 0;
        }

        // retry-after header is in seconds
        let millisToSleep = Math.round(parseFloat(retryHeader) * 1000);

        /*
         * retry-after header is in HTTP Date format
         * <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT
         */
        if (isNaN(millisToSleep)) {
            millisToSleep = Math.max(
                0,
                // .valueOf() is needed to subtract dates in TypeScript
                new Date(retryHeader).valueOf() - new Date().valueOf()
            );
        }

        return millisToSleep;
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
                this.retryAfterMillisecondsToSleep(
                    response.headers[HeaderNames.RETRY_AFTER]
                )
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

    async sendGetRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        return this.sendNetworkRequestAsync(HttpMethod.GET, url, options);
    }

    async sendPostRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        return this.sendNetworkRequestAsync(HttpMethod.POST, url, options);
    }
}
