/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Enum for possible error types in Microsoft Entra signup
 */
export enum SignupErrorType {
    INVALID_REQUEST = "invalid_request",
    INVALID_CLIENT = "invalid_client",
    UNAUTHORIZED_CLIENT = "unauthorized_client",
    UNSUPPORTED_CHALLENGE_TYPE = "unsupported_challenge_type",
    USER_ALREADY_EXISTS = "user_already_exists",
    INVALID_GRANT = "invalid_grant",
}

export enum SignupErrorChallengeType {
    INVALID_REQUEST = "invalid_request",
    EXPIRED_TOKEN = "expired_token",
    UNSUPPORTED_CHALLENGE_TYPE = "unsupported_challenge_type",
    INVALID_GRANT = "invalid_grant",
}

export enum SignupContinueErrorType {
    INVALID_REQUEST = "invalid_request",
    EXPIRED_TOKEN = "expired_token",
    CREDENTIAL_REQUIRED = "credential_required",
    INVALID_GRANT = "invalid_grant",
}

/**
 * Enum for invalid client suberrors
 */
export enum InvalidClientSuberror {
    NATIVEAUTHAPI_DISABLED = "nativeauthapi_disabled",
}

export enum InvalidContinueSuberror {
    INVALID_OOB_VALUE = "invalid_oob_value",
}

/**
 * Enum for invalid grant suberrors (password-related)
 */
export enum InvalidGrantSuberror {
    PASSWORD_TOO_WEAK = "password_too_weak",
    PASSWORD_TOO_SHORT = "password_too_short",
    PASSWORD_TOO_LONG = "password_too_long",
    PASSWORD_RECENTLY_USED = "password_recently_used",
    PASSWORD_BANNED = "password_banned",
    PASSWORD_IS_INVALID = "password_is_invalid",
}

/**
 * Interface for invalid attribute details
 */
export interface InvalidAttribute {
    name: string;
    reason: string;
}

/**
 * Detailed error interface for Microsoft Entra signup errors
 */
export interface SignUpErrorResponse {
    error: SignupErrorType | SignupErrorChallengeType | SignupContinueErrorType;
    error_description: string;
    error_codes: number[];
    timestamp: string;
    trace_id: string;
    correlation_id: string;
    suberror?:
        | InvalidClientSuberror
        | InvalidGrantSuberror
        | InvalidContinueSuberror;
    invalid_attributes?: InvalidAttribute[];
}
