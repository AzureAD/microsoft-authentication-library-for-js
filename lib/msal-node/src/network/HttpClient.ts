/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, NetworkRequestOptions } from '@azure/msal-common';
import { HttpMethod } from './../utils/Constants';
import axios from 'axios';

/**
 * This class implements the Fetch API for GET and POST requests. See more here: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 */
export class HttpClient implements INetworkModule {
    /**
     * Axios library for REST endpoints - Get request
     * @param url
     * @param headers
     * @param body
     */
    async sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): Promise<T> {

        // axios config
        const config = {
            method: HttpMethod.GET,
            url: url,
            headers: (options && options.headers)
        };

        // GET call
        const response = await axios(config);
        return await response.data as T;
    }

    /**
     * Axios Client for REST endpoints - Post request
     * @param url
     * @param headers
     * @param body
     */
    async sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): Promise<T> {

        // axios config
        const config = {
            method: HttpMethod.POST,
            url: url,
            body: (options && options.body) || '',
            headers: (options && options.headers)
        };

        const response = await axios(config);
        return await response.data as T;
    }
}
