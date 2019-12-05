/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { INetworkModule } from "msal-common";

export class FetchClient implements INetworkModule {

    /**
     * XHR client for JSON endpoints
     * https://www.npmjs.com/package/async-promise
     * @param url 
     * @param requestParams 
     * @param enableCaching 
     */
    async sendRequestAsync(url: string, requestParams: RequestInit, enableCaching?: boolean): Promise<any> {
        return await fetch(url, requestParams).then(resp => {
            return resp.json();
        });
    }
}
