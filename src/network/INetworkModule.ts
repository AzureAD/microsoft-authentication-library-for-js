/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

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
    sendGetRequestAsync(url: string, headers?: Map<string, string>, body?: string): Promise<any>;

    /**
     * Interface function for async network "POST" requests. Based on the Fetch standard: https://fetch.spec.whatwg.org/
     * @param url 
     * @param requestParams 
     * @param enableCaching 
     */
    sendPostRequestAsync(url: string, headers?: Map<string, string>, body?: string): Promise<any>;
}
