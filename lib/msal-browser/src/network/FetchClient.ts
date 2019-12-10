/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { INetworkModule } from "msal-common";

enum HTTP_REQUEST_TYPE {
    GET = "GET",
    POST = "POST"
}

export class FetchClient implements INetworkModule {

    /**
     * Fetch Client for REST endpoints - Get request
     * @param url 
     * @param headers 
     * @param body 
     */
    async sendGetRequestAsync<T>(url: string, headers?: Map<string, string>, body?: string): Promise<T> {
        const response = await fetch(url, {
            method: HTTP_REQUEST_TYPE.GET,
            headers: this.getFetchHeaders(headers),
            credentials: "include",
            body: body
        });
        return await response.json() as T;
    }

    /**
     * Fetch Client for REST endpoints - Post request
     * @param url 
     * @param headers 
     * @param body 
     */
    async sendPostRequestAsync<T>(url: string, headers?: Map<string, string>, body?: string): Promise<T> {
        const response = await fetch(url, {
            method: HTTP_REQUEST_TYPE.POST,
            headers: this.getFetchHeaders(headers),
            credentials: "include",
            body: body
        });
        return await response.json() as T;
    }

    /**
     * Get Fetch API Headers object from string map
     * @param inputHeaders 
     */
    private getFetchHeaders(inputHeaders: Map<string, string>): Headers {
        if (!inputHeaders) {
            return null;
        }
        const headers = new Headers;
        for (const headerName in inputHeaders.keys()) {
            headers.append(headerName, inputHeaders.get(headerName));
        }
        return headers;
    }
}
