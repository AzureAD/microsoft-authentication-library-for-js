/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Interface for Decoded JWT tokens.
 */
export interface DecodedJwt {
    header: string,
    JWSPayload: string,
    JWSSig: string
}
