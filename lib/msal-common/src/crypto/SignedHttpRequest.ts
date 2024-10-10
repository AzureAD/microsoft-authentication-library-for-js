/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { JoseHeaderOptions } from "./JoseHeader.js";

export type SignedHttpRequest = {
    at?: string;
    cnf?: object;
    m?: string;
    u?: string;
    p?: string;
    q?: [Array<string>, string];
    ts?: number;
    nonce?: string;
    client_claims?: string;
};

export type ShrOptions = {
    header: JoseHeaderOptions;
};
