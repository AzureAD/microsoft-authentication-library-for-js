/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientAuthError, INetworkModule, NetworkRequestOptions, NetworkResponse } from "@azure/msal-common";
import axios, { AxiosRequestConfig } from "axios";
import { HttpMethod, HttpStatusCode } from "../utils/Constants";

/**
 * HttpClient class implements API for network requests
 */
export class HttpClient implements INetworkModule {

    /**
     * Http Get request
     *
     * @param {string} url URL for request
     * @param {NetworkRequestOptions} options Network request options 
     * @returns {Promise<NetworkResponse>} Network response
     */
    async sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): Promise<NetworkResponse<T>> {
        const request: AxiosRequestConfig = {
            method: HttpMethod.GET,
            url: url,
            headers: options && options.headers,
            validateStatus: () => true
        };

        return this.sendAxiosRequest(request, url);
    }

    /**
     * Http Post request
     *
     * @param {string} url URL for request 
     * @param {NetworkRequestOptions} options Network request options 
     * @returns {Promise<NetworkResponse>} Network response
     */
    async sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): Promise<NetworkResponse<T>> {
        const request: AxiosRequestConfig = {
            method: HttpMethod.POST,
            url: url,
            data: (options && options.body) || "",
            headers: options && options.headers,
            validateStatus: () => true
        };

        return this.sendAxiosRequest(request, url);
    }

    /**
     * Helper function to handle network retries for Axios requests.
     * Function will retry axios request twice when response is returned with HTTP status code indicating request timeout or service unavailable. 
     * 
     * @param {AxiosRequestConfig} request Axios request
     * @param {string} url URL for request
     * @returns 
     */
    private async sendAxiosRequest<T>(request: AxiosRequestConfig, url: string): Promise<NetworkResponse<T>> {
        let response;
        const maxNetworkAttempts = 3;
        const maxRetryAttempts = 2;

        for (let i = 0; i < maxNetworkAttempts; i++) {
            try {
                response = await axios(request);

                if (!response) {
                    break;
                }

                // Allows retries if HttpStatusCode indicates request timeout or service unavailable
                if (response.status === HttpStatusCode.RequestTimeout || response.status === HttpStatusCode.ServiceUnavailable) {
                    if (i < maxRetryAttempts) {
                        continue;
                    } else {
                        // Throws network error if more than 2 retries and response status still indicates request timeout or service unavailable
                        throw ClientAuthError.createNetworkError(url, `Retries failed with status ${response.status}`);
                    }
                } else {
                    // Does not allow retries for other responses
                    break;
                }
            } catch(e) {
                throw ClientAuthError.createNetworkError(url, `Axios error: ${e}`);
            }
        }

        if (!response) {
            throw ClientAuthError.createNetworkError(url, `No server response for ${request.method} request`);
        }

        return {
            headers: response.headers,
            body: response.data as T,
            status: response.status
        };
    }
}
