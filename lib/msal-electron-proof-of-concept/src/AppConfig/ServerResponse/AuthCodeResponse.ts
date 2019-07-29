// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AuthorizationCodeRequestError } from '../Error/AuthorizationCodeRequestError';
import { ServerResponse } from './ServerResponse';

/**
 * The AuthCodeResponse class is used to expose
 * the relevant elements of the authorization endpoint's
 * response when an authorization code request has taken place.
 */
export class AuthCodeReponse extends ServerResponse {
    private authorizationCode?: string;
    private authError?: AuthorizationCodeRequestError;

    constructor(rawUrl: string) {
        super(rawUrl);
        if (this.queryParams.error) {
            this.authError = AuthorizationCodeRequestError.createAuthCodeAccessDeniedError(
                this.queryParams.error_description
            );
        } else {
            this.authorizationCode = this.queryParams.code;
        }
    }

    public get code(): string {
        return this.authorizationCode;
    }

    public get error(): AuthorizationCodeRequestError {
        return this.authError;
    }
}
