/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, NetworkResponse } from "@azure/msal-common";
import { HttpClient } from "../network/HttpClient";

export class NetworkUtils {
    /**
     * Returns best compatible network client object.
     */
    static getNetworkClient(): INetworkModule {
        return new HttpClient();
    }

    static getNetworkResponse<T>(headers: Record<string, string>, body: T, statusCode: number): NetworkResponse<T> {
        return {
            headers: headers,
            body: body,
            status: statusCode,
        };
    }
}
