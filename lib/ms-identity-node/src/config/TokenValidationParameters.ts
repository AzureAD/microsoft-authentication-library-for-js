/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type TokenValidationParameters = {
    rawTokenString: string,
    issuer: string,
    audience?: string,
    jweKeyStore?: any,
    jwksUri?: string,
    subject?: string
    nonce?: string,
    scopes?: Array<string>
};
