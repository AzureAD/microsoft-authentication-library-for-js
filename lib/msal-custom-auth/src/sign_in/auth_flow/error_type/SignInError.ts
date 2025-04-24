/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Enum for sign-in error types
 */
export enum SignInErrorType {
    /**
     * User provided invalid credentials
     */
    INVALID_CREDENTIALS = "invalid_credentials",

    /**
     * User account is locked
     */
    ACCOUNT_LOCKED = "account_locked",

    /**
     * User account is disabled
     */
    ACCOUNT_DISABLED = "account_disabled",

    /**
     * User account requires MFA verification
     */
    MFA_REQUIRED = "mfa_required",

    /**
     * Network error occurred during sign-in
     */
    NETWORK_ERROR = "network_error",

    /**
     * Password reset is required
     */
    PASSWORD_RESET_REQUIRED = "password_reset_required",

    /**
     * Unknown error occurred during sign-in
     */
    UNKNOWN_ERROR = "unknown_error"
}