/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type TokenRequest = {
    userObjectId?: string; // Account identifier used by OneAuth
    clientId: string;
    authority?: string;
    scope: string;
    correlationId: string;
    prompt?: string; // Prompt used to identify interactive request
    nonce?: string;
    claims?: string;
    state?: string;
    reqCnf?: string; // Having OneAuth own the keypair is better for hardware token binding support
    keyId?: string; // Having OneAuth own the keypair is better for hardware token binding support
    authenticationScheme?: string;
    shrClaims?: string;
    shrNonce?: string;
    clientCapabilities?: string[]; // CP1 for CAE support
    resourceRequestMethod?: string;
    resourceRequestUri?: string;
    extendedExpiryToken?: boolean;
    extraParameters?: Map<string, string>;
};
