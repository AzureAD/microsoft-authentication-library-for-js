/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CredentialType, AuthenticationScheme } from "../../utils/Constants";

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
    /** Matches the SHA 256 hash of the claims object included in the token request */
    requestedClaimsHash?: string;
};
