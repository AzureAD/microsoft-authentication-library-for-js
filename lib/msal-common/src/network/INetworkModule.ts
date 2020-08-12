/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {NetworkResponse} from "./NetworkManager";

/**
 * Options allowed by network request APIs.
 */
export type NetworkRequestOptions = {
    headers?: Map<string, string>,
    body?: string;
};

/**
 * Client network interface to send backend requests.
 * @hidden
 */
export interface INetworkModule {

    /**
     * Interface function for async network "GET" requests. Based on the Fetch standard: https://fetch.spec.whatwg.org/
     * @param url
     * @param requestParams
     * @param enableCaching
     */
    sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): Promise<NetworkResponse<T>>;

    /**
     * Interface function for async network "POST" requests. Based on the Fetch standard: https://fetch.spec.whatwg.org/
     * @param url
     * @param requestParams
     * @param enableCaching
     */
    sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): Promise<NetworkResponse<T>>;
}
