/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export const CustomAuthApiEndpoint = {
    SIGNIN_INITIATE: `/oauth2/v2.0/initiate`,
    SIGNIN_CHALLENGE: `/oauth2/v2.0/challenge`,
    SIGNIN_TOKEN: `/oauth2/v2.0/token`,

    SIGNUP_START: `/signup/v1.0/start`,
    SIGNUP_CHALLENGE: `/signup/v1.0/challenge`,
    SIGNUP_CONTINUE: `/signup/v1.0/continue`,

    RESET_PWD_START: `/resetpassword/v1.0/start`,
    RESET_PWD_CHALLENGE: `/resetpassword/v1.0/challenge`,
    RESET_PWD_CONTINUE: `/resetpassword/v1.0/continue`,
    RESET_PWD_SUBMIT: `/resetpassword/v1.0/submit`,
    RESET_PWD_POLL: `/resetpassword/v1.0/poll_completion`,
} as const;
