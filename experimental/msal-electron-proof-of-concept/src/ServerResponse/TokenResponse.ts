// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { TokenRequestError } from '../ServerRequest/Error/TokenRequestError';

/**
 * The TokenResponse class is used to expose
 * the relevant elements of the token endpoint's
 * response when an access token request has taken place.
 */
export class TokenResponse {
    private token?: string;
    private responseBody?: any;

    constructor(body: any) {
        this.responseBody = body;
        this.token = body.access_token;
    }

    public get accessToken(): string {
        return this.token;
    }
}
