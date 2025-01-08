/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export const CustomAuthApiEndpoint = {
    SIGN_IN_INITIATE_ENDPOINT: "oauth2/v2.0/initiate",
    SIGN_IN_CHALLENGE_ENDPOINT: "oauth2/v2.0/challenge",
    SIGN_IN_TOKEN_ENDPOINT: "oauth2/v2.0/token",
    SIGN_UP_START_ENDPOINT: "signup/v1.0/start",
    SIGN_UP_CHALLENGE_ENDPOINT: "signup/v1.0/challenge",
    SIGN_UP_CONTINUE_ENDPOINT: "signup/v1.0/continue",
    RESET_PASSWORD_START_ENDPOINT: "resetpassword/v1.0/start",
    RESET_PASSWORD_CHALLENGE_ENDPOINT: "resetpassword/v1.0/challenge",
    RESET_PASSWORD_CONTINUE_ENDPOINT: "resetpassword/v1.0/continue",
    RESET_PASSWORD_SUBMIT_ENDPOINT: "resetpassword/v1.0/submit",
    RESET_PASSWORD_POLL_COMPLETION_ENDPOINT:
        "resetpassword/v1.0/poll_completion",
} as const;
