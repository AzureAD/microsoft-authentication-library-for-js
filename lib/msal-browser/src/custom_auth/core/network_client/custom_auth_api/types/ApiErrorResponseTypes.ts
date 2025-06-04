/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export const CustomAuthApiErrorCode = {
    CONTINUATION_TOKEN_MISSING: "continuation_token_missing",
    INVALID_RESPONSE_BODY: "invalid_response_body",
    EMPTY_RESPONSE: "empty_response",
    UNSUPPORTED_CHALLENGE_TYPE: "unsupported_challenge_type",
    ACCESS_TOKEN_MISSING: "access_token_missing",
    ID_TOKEN_MISSING: "id_token_missing",
    REFRESH_TOKEN_MISSING: "refresh_token_missing",
    INVALID_EXPIRES_IN: "invalid_expires_in",
    INVALID_TOKEN_TYPE: "invalid_token_type",
    HTTP_REQUEST_FAILED: "http_request_failed",
    INVALID_REQUEST: "invalid_request",
    USER_NOT_FOUND: "user_not_found",
    INVALID_GRANT: "invalid_grant",
    CREDENTIAL_REQUIRED: "credential_required",
    ATTRIBUTES_REQUIRED: "attributes_required",
    USER_ALREADY_EXISTS: "user_already_exists",
    INVALID_POLL_STATUS: "invalid_poll_status",
    PASSWORD_CHANGE_FAILED: "password_change_failed",
    PASSWORD_RESET_TIMEOUT: "password_reset_timeout",
    CLIENT_INFO_MISSING: "client_info_missing",
    EXPIRED_TOKEN: "expired_token",
};

export const CustomAuthApiSuberror = {
    PASSWORD_TOO_WEAK: "password_too_weak",
    PASSWORD_TOO_SHORT: "password_too_short",
    PASSWORD_TOO_LONG: "password_too_long",
    PASSWORD_RECENTLY_USED: "password_recently_used",
    PASSWORD_BANNED: "password_banned",
    PASSWORD_IS_INVALID: "password_is_invalid",
    INVALID_OOB_VALUE: "invalid_oob_value",
    ATTRIBUTE_VALIATION_FAILED: "attribute_validation_failed",
    NATIVEAUTHAPI_DISABLED: "nativeauthapi_disabled",
};

export interface InvalidAttribute {
    name: string;
    reason: string;
}

/**
 * Detailed error interface for Microsoft Entra signup errors
 */
export interface ApiErrorResponse {
    error: string;
    error_description: string;
    correlation_id: string;
    error_codes?: number[];
    suberror?: string;
    continuation_token?: string;
    timestamp?: string;
    trace_id?: string;
    required_attributes?: Array<UserAttribute>;
    invalid_attributes?: Array<UserAttribute>;
}

export interface UserAttribute {
    name: string;
    type?: string;
    required?: boolean;
    options?: UserAttributeOption;
}

export interface UserAttributeOption {
    regex?: string;
}
