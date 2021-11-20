/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type TokenValidationParameters = {
    rawTokenString: string,
    issuer: string,
    scopes?: Array<string>,
    audience?: string
};
