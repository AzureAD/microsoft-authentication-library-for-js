/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Protocol modes supported by MSAL.
 */
export const ProtocolMode = {
    AAD: "AAD",
    OIDC: "OIDC",
} as const;
export type ProtocolMode = (typeof ProtocolMode)[keyof typeof ProtocolMode];
