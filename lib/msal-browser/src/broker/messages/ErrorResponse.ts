/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * AuthError thrown to the MSAL.js developer
 * All error codes and messages here should map to MSAL.js
 * These messages are thrown to the developer, the error strings might be visible to the end user
 */
export type ErrorResponse = {
    /**
     * Name of the auth errors, as defined by MSAL
     * See the list at https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_common.autherror.html
     */
    name: string,

    /**
     * MSAL error code
     */
    errorCode: string,

    /**
     * Error message representing error code.
     */
    errorMessage: string,

    /**
     * CorrelationId that resulted in the this error
     */
    correlationId: string,

    /**
     * Any sub error
     */
    subError: string
};
