/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// eslint-disable @typescript-eslint/no-explicit-any

export type TokenValidationResponse = {
    protectedHeader?: any;
    payload?: any;
    exception?: any;
    token?: string;
    tokenType?: string;
};
