/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Token request which broker will use to acquire tokens
 */
export type TokenRequest = {
    /**
     * client_id of the application asking token using broker
     */
    clientId: string;

    /**
     * scope paramer value as passed on OAuth2 calls
     * It is all requested scopes in a single string separated by a space
     * The parameter value is same as scope defined in auth code grant https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow
     */
    scope: string;

    /**
     * A unique identifier to track the request
     */
    correlationId: string;

    /**
     * prompt behavior as defined at https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow
     * Valid values in broker scenarios are none, consent and login
     */
    prompt?: string;

    /**
     * A unique server nonce
     */
    nonce?: string;

    /**
     * Opaque to client, claims challenge value when the resource provider throws unauthorized along with error code insufficient_claims
     * When this value is supplied, any token cache on local device are bypassed
     * Details at https://learn.microsoft.com/en-us/azure/active-directory/develop/claims-challenge
     */
    claims?: string;

    /**
     * Type of token requested
     * Valid values are bearer and pop
     */
    tokenType?: string;

    /**
     * SHR claims to be signed inside PoP token
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/shr-client-claims.md
     */
    shrClaims?: KeyValue[];

    /**
     * SHR nonce to be signed inside PoP token
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/shr-server-nonce.md
     */
    shrNonce?: string;
};

export type KeyValue = {
    [key: string]: string;
};
