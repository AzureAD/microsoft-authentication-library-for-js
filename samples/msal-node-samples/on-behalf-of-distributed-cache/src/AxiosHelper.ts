/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import axios from "axios";

class AxiosHelper {

    /**
     * Makes an HTTP GET to the endpoint uri. If an access token exists, it adds an Authroization header to the request, where it adds the Bearer token.
     * @param endpoint
     * @param accessToken
     */
    static async callDownstreamApi(endpoint: string, accessToken?: string, params?: Record<string, string>): Promise<any> {
        console.log(`Request to ${endpoint} made at: ${new Date().toString()}`);

        const response = await axios.get(endpoint, {
            headers: (accessToken && { Authorization: `Bearer ${accessToken}`}) || undefined,
            params: params || undefined
        });

        if (response.status !== 200) {
            throw new Error(`Response: ${response.status}`);
        }

        return (await response.data);
    }
}

export default AxiosHelper;
