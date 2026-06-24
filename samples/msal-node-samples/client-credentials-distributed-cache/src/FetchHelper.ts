/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

class FetchHelper {
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
