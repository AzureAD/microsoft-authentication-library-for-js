/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Basic authentication stages used to determine
 * appropriate action after redirect occurs
 */
export const AppStages = {
    SIGN_IN: "sign_in",
    SIGN_OUT: "sign_out",
    ACQUIRE_TOKEN: "acquire_token",
};

/**
 * OpenID Connect scopes
 */
export const OIDCScopes = {
    OPENID: "openid",
    PROFILE: "profile",
    OFFLINE_ACCESS: "offline_access"
}

/**
 * String constants related to AAD Authority
 */
export const AADAuthorityConstants = {
    COMMON: "common",
    ORGANIZATIONS: "organizations",  
    CONSUMERS: "consumers"
}

/**
 * Global AAD cloud authority
 */
export const AuthorityStrings = {
    AAD: "https://login.microsoftonline.com/",
}

/**
 * AAD Error codes
 * For more information, visit: https://login.microsoftonline.com/error
 */
export const ErrorCodes = {
    65001: "AADSTS65001",
    90118: "AADB2C90118"
}

/**
 * Various error constants
 */
export const ErrorMessages = {
    NOT_PERMITTED: "Not permitted",
    INVALID_TOKEN: "Invalid token",
    CANNOT_DETERMINE_APP_STAGE: "Cannot determine application stage",
    NONCE_MISMATCH: "Nonce does not match",
    INTERACTION_REQUIRED: "interaction_required",
    TOKEN_NOT_FOUND: "No token found",
    TOKEN_NOT_DECODED: "Token cannot be decoded",
    TOKEN_NOT_VERIFIED: "Token cannot be verified",
    KEYS_NOT_OBTAINED: "Signing keys cannot be obtained",
    STATE_NOT_FOUND: "State not found",
}