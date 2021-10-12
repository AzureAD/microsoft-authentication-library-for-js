/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type TokenValidationParameters = {
    rawTokenString: string,
    scp?: Array<string>,
    iss?: string,
    aud?: string
};
