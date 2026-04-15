/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

class FetchHelper {
    /**
     * Makes an HTTP GET to the endpoint uri. If an access token exists, it includes
     * an Authorization header in the request. The header contains the bearer token.
     * @param endpoint - endpoint uri
     * @param accessToken - raw access token
     * @param params - parameters object for the request in the form of key-value pairs
     */
    static async callDownstreamApi(
        endpoint: string,
        accessToken?: string,
        params?: Record<string, string>
    ): Promise<any> {
        console.log(`Request to ${endpoint} made at: ${new Date().toString()}`);

        const url = new URL(endpoint);
        if (params) {
            Object.entries(params).forEach(([key, value]) =>
                url.searchParams.append(key, value)
            );
        }

        const response = await fetch(url.toString(), {
            headers:
                (accessToken && { Authorization: `Bearer ${accessToken}` }) ||
                undefined,
        });

        if (!response.ok) {
            throw new Error(`Response: ${response.status}`);
        }

        return await response.json();
    }
}

export default FetchHelper;
