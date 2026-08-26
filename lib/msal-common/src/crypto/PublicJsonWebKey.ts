/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Environment-neutral representation of the public asymmetric JWK fields
 * used by token-binding implementations.
 *
 * @internal
 */
export type PublicJsonWebKey = {
    alg?: string;
    crv?: string;
    e?: string;
    ext?: boolean;
    key_ops?: string[];
    kid?: string;
    kty?: string;
    n?: string;
    use?: string;
    x?: string;
    y?: string;
};
