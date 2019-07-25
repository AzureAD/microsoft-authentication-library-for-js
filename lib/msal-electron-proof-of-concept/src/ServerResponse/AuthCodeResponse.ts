// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AuthorizationCodeRequestError } from './Error/AuthorizationCodeRequestError';
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

    constructor(rawUrl: string, state: string) {
        this.url = url.parse(rawUrl, true);
        this.query = this.url.query;
        const responseIsValid = this.isValidResponse(this.query, state);
        this.authorizationCode = this.query.code;
    }

    private isValidResponse(query: QueryParameters, state: string): boolean {
        let isValid = false;

        // If response contained an error
        if (query.error) {
            this.authError = AuthorizationCodeRequestError.createAuthCodeAccessDeniedError(this.query.error_description);
        // If response state doesn't match request state
        } else if (query.state !== state) {
            this.authError = AuthorizationCodeRequestError.createNonMatchingStateError();
        // Otherwise, response is valid, safe to assume it contains an authorization code
        } else {
            isValid = true;
        }

        return isValid;
    }

    public get code(): string {
        return this.authorizationCode;
    }

    public get error(): AuthorizationCodeRequestError {
        return this.authError;
    }
}
