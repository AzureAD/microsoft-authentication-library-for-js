/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { HttpMethod, IHttpClient, RequestBody } from "./IHttpClient.js";

/**
 * Implementation of IHttpClient using fetch.
 */
export class FetchHttpClient implements IHttpClient {
    async sendAsync(url: string, options: RequestInit): Promise<Response> {
        const response = await fetch(url, options);
        return response;
    }

    async post(url: string, body: RequestBody, headers: Record<string, string> = {}): Promise<Response> {
        return this.sendAsync(url, {
            method: HttpMethod.POST,
            headers,
            body,
        });
    }

    async get(url: string, headers: Record<string, string> = {}): Promise<Response> {
        return this.sendAsync(url, {
            method: HttpMethod.GET,
            headers,
        });
    }
}
