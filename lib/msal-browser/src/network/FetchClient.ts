/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { INetworkClient } from "./INetworkClient";

export class FetchClient implements INetworkClient {

    /**
     * XHR client for JSON endpoints
     * https://www.npmjs.com/package/async-promise
     * @param url 
     * @param requestParams 
     * @param enableCaching 
     */
    async sendRequestAsync(url: string, requestParams: RequestInit): Promise<any> {
        const response = await fetch(url, requestParams);
        return response.json();
    }
}
