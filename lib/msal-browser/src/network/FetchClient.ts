/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
// Common package imports
import { INetworkModule, NetworkRequestOptions } from "msal-common";
// HTTP Constants
import { HTTP_REQUEST_TYPE } from "../utils/BrowserConstants";

/**
 * This class implements the Fetch API for GET and POST requests. See more here: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 */
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
            headers: this.getFetchHeaders(options)
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
        const reqBody = (options && options.body) || "";
        const response = await fetch(url, {
            method: HTTP_REQUEST_TYPE.POST,
            headers: this.getFetchHeaders(options),
            credentials: "include",
            body: reqBody
        });
        return await response.json() as T;
    }

    /**
     * Get Fetch API Headers object from string map
     * @param inputHeaders 
     */
    private getFetchHeaders(options?: NetworkRequestOptions): Headers {
        const headers = new Headers();
        if (!(options && options.headers)) {
            return headers;
        }
        options.headers.forEach((value, key) => {
            headers.append(key, value);
        });
        return headers;
    }
}
