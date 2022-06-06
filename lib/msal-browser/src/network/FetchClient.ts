/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants, INetworkModule, NetworkRequestOptions, NetworkResponse } from "@azure/msal-common";
import { BrowserAuthError } from "../error/BrowserAuthError";
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
    async sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): Promise<NetworkResponse<T>> {
        let response;
        let controller: AbortController | undefined;
        let timeoutId: number | undefined;

        /*
         * Check if a timeout value is provided via the options and create 
         * a timeout based on the value provided to abort the request
         */
        if (options?.timeout) {
            controller = new AbortController();
            timeoutId = window.setTimeout(() => controller?.abort(), options.timeout);
        }

        try {
            response = await fetch(url, {
                method: HTTP_REQUEST_TYPE.GET,
                headers: this.getFetchHeaders(options),
                signal: controller?.signal
            }).finally(() => { 
                // Clear the timeout if the request is resolved before the timeout expires
                if (!!timeoutId) window.clearTimeout(timeoutId);
            });
        } catch (e) {
            if (window.navigator.onLine) {
                throw BrowserAuthError.createGetRequestFailedError(e, url);
            } else {
                throw BrowserAuthError.createNoNetworkConnectivityError();
            }
        }

        try {
            return {
                headers: this.getHeaderDict(response.headers),
                body: await response.json() as T,
                status: response.status
            };
        } catch (e) {
            throw BrowserAuthError.createFailedToParseNetworkResponseError(url);
        }
    }

    /**
     * Fetch Client for REST endpoints - Post request
     * @param url 
     * @param headers 
     * @param body 
     */
    async sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): Promise<NetworkResponse<T>> {
        const reqBody = (options && options.body) || Constants.EMPTY_STRING;

        let response;
        try {
            response = await fetch(url, {
                method: HTTP_REQUEST_TYPE.POST,
                headers: this.getFetchHeaders(options),
                body: reqBody
            });
        } catch (e) {
            if (window.navigator.onLine) {
                throw BrowserAuthError.createPostRequestFailedError(e, url);
            } else {
                throw BrowserAuthError.createNoNetworkConnectivityError();
            }
        }

        try {
            return {
                headers: this.getHeaderDict(response.headers),
                body: await response.json() as T,
                status: response.status
            };
        } catch (e) {
            throw BrowserAuthError.createFailedToParseNetworkResponseError(url);
        }
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
        const optionsHeaders = options.headers;
        Object.keys(optionsHeaders).forEach((key) => {
            headers.append(key, optionsHeaders[key]);
        });
        return headers;
    }

    private getHeaderDict(headers: Headers): Record<string, string> {
        const headerDict: Record<string, string> = {};
        headers.forEach((value: string, key: string) => {
            headerDict[key] = value;
        });
        return headerDict;
    }
}
