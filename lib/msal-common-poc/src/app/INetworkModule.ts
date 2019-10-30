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
     * Interface function for async network requests
     * @param url 
     * @param method 
     * @param enableCaching 
     */
    sendRequestAsync(url: string, method: string, enableCaching?:boolean): Promise<any>
}
