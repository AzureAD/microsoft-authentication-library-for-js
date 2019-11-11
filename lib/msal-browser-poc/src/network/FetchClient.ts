/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IXhrClient } from "./IXHRClient";

/**
 * XHR client for JSON endpoints
 * https://www.npmjs.com/package/async-promise
 * @hidden
 */
export class FetchClient implements IXhrClient {
    async sendRequestAsync(url: string, requestParams: RequestInit, enableCaching?: boolean): Promise<any> {
        return await fetch(url, requestParams).then(resp => {
            return resp.json();
        });
    }
}
