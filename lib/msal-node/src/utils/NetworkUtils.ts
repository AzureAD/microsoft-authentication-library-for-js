/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { NetworkResponse } from "@azure/msal-common";

export class NetworkUtils {
    static getNetworkResponse<T>(headers: Record<string, string>, body: T, statusCode: number): NetworkResponse<T> {
        return {
            headers: headers,
            body: body,
            status: statusCode,
        };
    }
}
