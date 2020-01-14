/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface DecodedJwt {
    header: string,
    JWSPayload: string,
    JWSSig: string
}
