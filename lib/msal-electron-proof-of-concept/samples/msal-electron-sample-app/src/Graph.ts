// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as request from 'request-promise';

export class Graph {
    static async fetchUserData(accessToken: string): Promise<any> {
        const graphUrl: string = `https://graph.microsoft.com/v1.0/me`;
        const options: any = {
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            json: true
        };
        return request(graphUrl, options);
    }
}
