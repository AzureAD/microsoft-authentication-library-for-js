/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * IdentityToken claims object with the following signature:
 * - aud                    - Audience of the token
 * - iss                    - Token issuer
 * - iat                    - Issued at
 * - nbf                    - Not valid before
 * - exp                    - Expiration time
 * - amr                    - Subject validation method(s) ["mfa", "rsa", "pwd"]
 * - email                  - Users' email
 * - family_name            - Family name
 * - given_name             - Given name
 * - idp                    - Identity provider, is the same as the issuer unless it's a guest user.
 * - ipaddr                 - Users' IP address
 * - name                   - Mutable username
 * - oid                    - Immutable object identifier, this ID uniquely identifies the user across applications
 * - sub                    - Immutable subject identifier, this is a pairwise identifier - it is unique to a particular application ID
 * - tid                    - The Users' tenant, or '9188040d-6c67-4c5b-b112-36a304b66dad' for personal accounts.
 * - roles                  - The application roles the user has assigned
 */
export type IdentityToken = {
    aud?: string;
    iss?: string;
    iat?: number;
    nbf?: number;
    exp?: number;
    amr?: string[];
    email?: string;
    family_name?: string;
    given_name?: string;
    idp?: string;
    ipaddr?: string;
    name?: string;
    oid?: string;
    sub?: string;
    tid?: string;
    roles?: string[];
} & { [key: string]: string | number | string[] | undefined | unknown };
