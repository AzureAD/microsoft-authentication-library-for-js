/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, NetworkRequestOptions } from '@azure/msal-common';
import { HttpMethod } from './../utils/Constants';
import axios from 'axios';

/**
 * This class implements the API for network requests.
 */
export class HttpClient implements INetworkModule {
    /**
     * Client library for REST endpoints - Get request
     * @param url
     * @param headers
     * @param body
     */
    async sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): Promise<T> {

        const request = {
            method: HttpMethod.GET,
            url,
            headers: (options && options.headers)
        };

        const response = await axios(request);
        return response.data as T;
    }

    /**
     * Axios Client for REST endpoints - Post request
     * @param url
     * @param headers
     * @param body
     */
    async sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): Promise<T> {

        const request = {
            method: HttpMethod.POST,
            url,
            body: (options && options.body) || '',
            headers: (options && options.headers)
        };

        const response = await axios(request);
        return response.data as T;
    }
}
