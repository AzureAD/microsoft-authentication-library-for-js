/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type TokenValidationResponse = {
    isValid: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protectedHeader: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any;
};
