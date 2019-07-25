// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AuthorizationCodeRequestError } from '../ServerRequest/Error/AuthorizationCodeRequestError';
import { QueryParameters } from './QueryParameters';

import * as url from 'url';

/**
 * The AuthCodeResponse class is used to expose
 * the relevant elements of the authorization endpoint's
 * response when an authorization code request has taken place.
 */
export class AuthCodeReponse {
    private url: url.UrlWithParsedQuery;
    private query: QueryParameters;
    private authorizationCode?: string;
    private authError?: AuthorizationCodeRequestError;

    constructor(rawUrl: string) {
        this.url = url.parse(rawUrl, true);
        this.query = this.url.query;

        if (this.query.error) {
            this.authError = AuthorizationCodeRequestError.createAuthCodeAccessDeniedError(
                this.query.error_description
            );
        } else {
            this.authorizationCode = this.query.code;
        }
    }

    public get code(): string {
        return this.authorizationCode;
    }

    public get error(): AuthorizationCodeRequestError {
        return this.authError;
    }
}
