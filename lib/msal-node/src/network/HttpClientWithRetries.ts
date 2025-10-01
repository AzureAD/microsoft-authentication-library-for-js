/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    HeaderNames,
    INetworkModule,
    Logger,
    NetworkRequestOptions,
    NetworkResponse,
} from "@azure/msal-common/node";
import { IHttpRetryPolicy } from "../retry/IHttpRetryPolicy.js";
import { HttpMethod } from "../utils/Constants.js";

export class HttpClientWithRetries implements INetworkModule {
    private httpClientNoRetries: INetworkModule;
    private retryPolicy: IHttpRetryPolicy;
    private logger: Logger;

    constructor(
        httpClientNoRetries: INetworkModule,
        retryPolicy: IHttpRetryPolicy,
        logger: Logger
    ) {
        this.httpClientNoRetries = httpClientNoRetries;
        this.retryPolicy = retryPolicy;
        this.logger = logger;
    }

    private async sendNetworkRequestAsyncHelper<T>(
        httpMethod: HttpMethod,
        url: string,
        correlationId: string,
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        if (httpMethod === HttpMethod.GET) {
            return this.httpClientNoRetries.sendGetRequestAsync(
                url,
                correlationId,
                options
            );
        } else {
            return this.httpClientNoRetries.sendPostRequestAsync(
                url,
                correlationId,
                options
            );
        }
    }

    private async sendNetworkRequestAsync<T>(
        httpMethod: HttpMethod,
        url: string,
        correlationId: string,
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        // the underlying network module (custom or HttpClient) will make the call
        let response: NetworkResponse<T> =
            await this.sendNetworkRequestAsyncHelper(
                httpMethod,
                url,
                correlationId,
                options
            );

        if ("isNewRequest" in this.retryPolicy) {
            this.retryPolicy.isNewRequest = true;
        }

        let currentRetry: number = 0;
        while (
            await this.retryPolicy.pauseForRetry(
                response.status,
                currentRetry,
                this.logger,
                response.headers[HeaderNames.RETRY_AFTER]
            )
        ) {
            response = await this.sendNetworkRequestAsyncHelper(
                httpMethod,
                url,
                correlationId,
                options
            );
            currentRetry++;
        }

        return response;
    }

    public async sendGetRequestAsync<T>(
        url: string,
        correlationId: string,
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        return this.sendNetworkRequestAsync(
            HttpMethod.GET,
            url,
            correlationId,
            options
        );
    }

    public async sendPostRequestAsync<T>(
        url: string,
        correlationId: string,
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        return this.sendNetworkRequestAsync(
            HttpMethod.POST,
            url,
            correlationId,
            options
        );
    }
}
