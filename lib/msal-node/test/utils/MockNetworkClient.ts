/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    INetworkModule,
    NetworkRequestOptions,
    NetworkResponse,
} from "@azure/msal-common";

export const mockNetworkClient = (
    getRequestResult: Object,
    postRequestResult: Object
): INetworkModule => {
    return {
        sendGetRequestAsync<T>(
            _url: string,
            _options?: NetworkRequestOptions,
            _timeout?: number
        ): Promise<NetworkResponse<T>> {
            return new Promise<NetworkResponse<T>>((resolve, _reject) => {
                resolve(getRequestResult as NetworkResponse<T>);
            });
        },
        sendPostRequestAsync<T>(
            _url: string,
            _options?: NetworkRequestOptions
        ): Promise<NetworkResponse<T>> {
            return new Promise<NetworkResponse<T>>((resolve, _reject) => {
                resolve(postRequestResult as NetworkResponse<T>);
            });
        },
    };
};
