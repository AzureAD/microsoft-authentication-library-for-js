/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type SignedHttpRequest = {
    at?: string;
    cnf?: string;
    m?: string;
    u?: string;
    p?: string;
    q?: [Array<string>, string];
    ts?: string;
    nonce?: string;
};
