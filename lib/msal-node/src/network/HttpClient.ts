/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, NetworkRequestOptions } from '@azure/msal-common';
import { HttpMethod } from './../utils/Constants';
import axios, {AxiosRequestConfig} from 'axios';

/**
 * This class implements the Fetch API for GET and POST requests. See more here: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 */
export class HttpClient implements INetworkModule {
    /**
     * Axios CLient library for REST endpoints - Get request
     * @param url
     * @param headers
     * @param body
     */
    async sendGetRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): Promise<T> {
        // axios config
        const request: AxiosRequestConfig = {
            method: HttpMethod.GET,
            url: url,
            headers: options && options.headers,
        };

        // GET call
        const response = await axios(request);
        return response.data as T;
    }

    /**
     * Axios Client for REST endpoints - Post request
     * @param url
     * @param headers
     * @param body
     */
    async sendPostRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): Promise<T> {
        const request: AxiosRequestConfig = {
            method: HttpMethod.POST,
            url: url,
            data: (options && options.body) || '',
            headers: options && options.headers,
        };

        const response = await axios(request);
        return response.data as T;
    }
}
