/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { INetworkModule } from "msal-common";

export class FetchClient implements INetworkModule {

    /**
     * Fetch Client for REST endpoints - Get request
     * @param url 
     * @param headers 
     * @param body 
     */
    async sendGetRequestAsync(url: string, headers?: Map<string, string>): Promise<any> {
        const requestType = "GET";
        const response = await fetch(url, {
            method: requestType,
            headers: this.getFetchHeaders(headers)
        });
        return response.json();
    }

    /**
     * Fetch Client for REST endpoints - Post request
     * @param url 
     * @param headers 
     * @param body 
     */
    async sendPostRequestAsync(url: string, headers?: Map<string, string>, reqBody?: string): Promise<any> {
        const requestType = "POST";
        const response = await fetch(url, {
            method: requestType,
            headers: this.getFetchHeaders(headers),
            credentials: "include",
            body: reqBody
        });
        return response.json();
    }

    /**
     * Get Fetch API Headers object from string map
     * @param inputHeaders 
     */
    private getFetchHeaders(inputHeaders: Map<string, string>): Headers {
        const headers = new Headers;
        if (!inputHeaders) {
            return headers;
        }
        for (const headerName in inputHeaders.keys()) {
            headers.append(headerName, inputHeaders.get(headerName));
        }
        return headers;
    }
}
