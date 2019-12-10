/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { INetworkModule, NetworkRequestOptions } from "msal-common";
import { HTTP_REQUEST_TYPE } from "../utils/BrowserConstants";

export class FetchClient implements INetworkModule {

    /**
     * Fetch Client for REST endpoints - Get request
     * @param url 
     * @param headers 
     * @param body 
     */
    async sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): Promise<T> {
        const response = await fetch(url, {
            method: HTTP_REQUEST_TYPE.GET,
            headers: this.getFetchHeaders(options.headers)
        });
        return await response.json() as T;
    }

    /**
     * Fetch Client for REST endpoints - Post request
     * @param url 
     * @param headers 
     * @param body 
     */
    async sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): Promise<T> {
        const response = await fetch(url, {
            method: HTTP_REQUEST_TYPE.POST,
            headers: this.getFetchHeaders(options.headers),
            credentials: "include",
            body: options.body
        });
        return await response.json() as T;
    }

    /**
     * Get Fetch API Headers object from string map
     * @param inputHeaders 
     */
    private getFetchHeaders(inputHeaders: Map<string, string>): Headers {
        const headers = new Headers();
        if (!inputHeaders) {
            return headers;
        }
        for (const headerName in inputHeaders.keys()) {
            headers.append(headerName, inputHeaders.get(headerName));
        }
        return headers;
    }
}
