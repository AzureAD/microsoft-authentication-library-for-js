/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * The public API id for telemetry purpose.
 */
export const PublicApiId = {
    /*
     * The public API ids should be claim in the MSAL telemtry tracker.
     * All the following ids are hardcoded, so we need to find a way to claim them in the future and update them here.
     */

    // Sign in
    SIGN_IN_WITH_CODE_START: 100001,
    SIGN_IN_WITH_PASSWORD_START: 100002,
    SIGN_IN_SUBMIT_CODE: 100003,
    SIGN_IN_SUBMIT_PASSWORD: 100004,
    SIGN_IN_RESEND_CODE: 100005,
    SIGN_IN_AFTER_SIGN_UP: 100006,
    SIGN_IN_AFTER_PASSWORD_RESET: 100007,

    // Sign up
    SIGN_UP_WITH_PASSWORD_START: 100021,
    SIGN_UP_START: 100022,
    SIGN_UP_SUBMIT_CODE: 100023,
    SIGN_UP_SUBMIT_PASSWORD: 100024,
    SIGN_UP_SUBMIT_ATTRIBUTES: 100025,
    SIGN_UP_RESEND_CODE: 100026,

    // Password reset
    PASSWORD_RESET_START: 100041,
    PASSWORD_RESET_SUBMIT_CODE: 100042,
    PASSWORD_RESET_SUBMIT_PASSWORD: 100043,
    PASSWORD_RESET_RESEND_CODE: 100044,

    // Get account
    ACCOUNT_GET_ACCOUNT: 100061,
    ACCOUNT_SIGN_OUT: 100062,
    ACCOUNT_GET_ACCESS_TOKEN: 100063,
};
