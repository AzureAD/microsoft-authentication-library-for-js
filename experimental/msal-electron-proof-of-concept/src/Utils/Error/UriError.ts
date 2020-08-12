// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { UtilityErrorBase } from './UtilityError';

/**
 * The UriErrorMessage object holds all
 * the code-description pairs for their respective
 * UriError type.
 */

export const UriErrorMessage = {
    uriRequired: {
        code: 'null_uri_error',
        description: 'URI string is required to obtain canonical URI.',
    },
};

/**
 * The UriError class handles errors
 * that result incorrect use of the URI Utility class.
 */
export class UriError extends UtilityErrorBase {
    static createUriRequiredError(uri: any): UriError {
        const errorMessage = UriErrorMessage.uriRequired;
        return new UriError(errorMessage.code,
            `${errorMessage.description} Given value: ${uri}`);
    }

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = 'UriError';
        Object.setPrototypeOf(this, UriError.prototype);
    }
}
