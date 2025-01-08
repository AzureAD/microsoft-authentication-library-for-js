/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IHttpClient } from "./IHttpClient.js";
import {
    HttpMethod,
    HttpRequestMessage,
    HttpResponseMessage,
} from "./HttpMessage.js";
import {
    FailedSendRequest,
    HttpError,
    NoNetworkConnectivity,
} from "../../error/HttpError.js";
import { Logger } from "@azure/msal-browser";
import { UrlUtils } from "../../utils/UrlUtils.js";

/**
 * This class implements the Fetch API for GET and POST requests. See more here: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 */
export class FetchHttpClient implements IHttpClient {
    private readonly baseRequestUrl: URL | undefined;

    constructor(private logger: Logger, baseUrl?: string) {
        this.baseRequestUrl = !baseUrl
            ? undefined
            : UrlUtils.parseSecureUrl(
                  !baseUrl.endsWith("/") ? `${baseUrl}/` : baseUrl
              );
    }

    /** @inheritdoc */
    async sendAsync(request: HttpRequestMessage): Promise<HttpResponseMessage> {
        try {
            const requestInit: RequestInit = {
                method: request.method,
                headers: this.generateFetchHeaders(request.headers),
            };

            if (
                request.method === HttpMethod.POST ||
                request.method === HttpMethod.PUT
            ) {
                requestInit.body = request.body ?? "";
            }

            const requestUrl = this.generateRequestUrl(request.url);

            this.logger.trace(
                `Sending request to ${requestUrl}`,
                request.correlationId
            );

            const startTime = performance.now();

            const r1 = await fetch("https://www.bing.com");

            if (r1.status !== 200) {
            }

            const response = await fetch(requestUrl, requestInit);

            const endTime = performance.now();

            this.logger.trace(
                `Request to '${requestUrl}' completed in ${
                    endTime - startTime
                }ms with status code ${response.status}`,
                request.correlationId
            );

            return new HttpResponseMessage(
                response.status,
                await response.json(),
                this.readFetchHeader(response.headers)
            );
        } catch (e) {
            this.logger.error(
                `Failed to send request: ${e}`,
                request.correlationId
            );

            if (!window.navigator.onLine) {
                throw new HttpError(
                    NoNetworkConnectivity,
                    `No network connectivity: ${e}`,
                    request.correlationId
                );
            }

            throw new HttpError(
                FailedSendRequest,
                `Failed to send request: ${e}`,
                request.correlationId
            );
        }
    }

    private generateFetchHeaders(headers: Record<string, string>): Headers {
        const fetchHeaders = new Headers();

        if (!headers) {
            return fetchHeaders;
        }

        Object.keys(headers).forEach((key) => {
            fetchHeaders.append(key, headers[key]);
        });

        return fetchHeaders;
    }

    private readFetchHeader(headers: Headers): Record<string, string> {
        const headerDict: Record<string, string> = {};

        headers.forEach((value: string, key: string) => {
            headerDict[key] = value;
        });

        return headerDict;
    }

    private generateRequestUrl(url: string): URL {
        if (this.baseRequestUrl) {
            const requestUrl = new URL(url, this.baseRequestUrl);
            return requestUrl;
        }

        return UrlUtils.parseSecureUrl(url);
    }
}
