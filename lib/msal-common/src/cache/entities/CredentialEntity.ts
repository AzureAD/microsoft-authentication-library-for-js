/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CredentialType, AuthenticationScheme } from "../../utils/Constants.js";

/**
 * Credential Cache Type
 */
export type CredentialEntity = {
    /** Identifier for the user in their home tenant*/
    homeAccountId: string;
    /** Entity that issued the token, represented as a full host */
    environment: string;
    /** Type of credential */
    credentialType: CredentialType;
    /** Client ID of the application */
    clientId: string;
    /** Actual credential as a string */
    secret: string;
    /** Family ID identifier, usually only used for refresh tokens */
    familyId?: string;
    /** Full tenant or organizational identifier that the account belongs to */
    realm?: string;
    /** Permissions that are included in the token, or for refresh tokens, the resource identifier. */
    target?: string;
    /** Matches the SHA 256 hash of the obo_assertion for the OBO flow */
    userAssertionHash?: string;
    /** Matches the authentication scheme for which the token was issued (i.e. Bearer or pop) */
    tokenType?: AuthenticationScheme;
    /** KeyId for PoP and SSH tokens stored in the kid claim */
    keyId?: string;
    /** Additional cache key components for cache isolation (e.g., { fmi_path: "..." }). Stored as raw key-value pairs; a combined hash is computed at key-generation time. */
    additionalCacheKeyComponents?: Record<string, string>;
    /**
     * Precomputed SHA-256 base64url hash of the deterministic payload derived from
     * `additionalCacheKeyComponents`. Written once at cache-write time so that
     * synchronous credential-key generators (e.g., in msal-browser) can append the
     * hash segment without needing async crypto. Consumers that recompute the hash
     * synchronously (e.g., msal-node) may treat this as an optimization/index.
     */
    additionalCacheKeyComponentsHash?: string;
    /** Timestamp when the entry was last updated */
    lastUpdatedAt: string;
};
