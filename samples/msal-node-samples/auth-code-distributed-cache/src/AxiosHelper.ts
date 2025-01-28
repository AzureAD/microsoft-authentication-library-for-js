/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import axios from "axios";

class AxiosHelper {
    /**
     * Makes an Authorization "Bearer" request with the given accessToken to the given endpoint.
     * @param endpoint
     * @param accessToken
     */
    static async callDownstreamApi(
        endpoint: string,
        accessToken?: string,
        params?: Record<string, string>
    ): Promise<any> {
        console.log(`Request to ${endpoint} made at: ${new Date()}`);

        const response = await axios.get(endpoint, {
            headers:
                (accessToken && { Authorization: `Bearer ${accessToken}` }) ||
                undefined,
            params: params || undefined,
        });

        if (response.status !== 200) {
            throw new Error(`Response: ${response.status}`);
        }

        return response.data;
    }
}

export default AxiosHelper;
