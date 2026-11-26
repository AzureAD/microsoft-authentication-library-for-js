/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type {
    AuthorizeChallengeEntryResultV2,
    ChallengeVerificationResultV2,
    ContinueResultV2,
    EnrollmentRequiredResultV2,
    EnrollmentResultV2,
    SignInStartApiResultV2,
    VerifyResultV2,
} from "../../../src/custom_auth/core/network_client/custom_auth_api/v2/result/BaseResultsV2.js";

export const ENTRY_RESULT: AuthorizeChallengeEntryResultV2 = {
    continuationToken: "ct-entry",
    signInHref: "/tenant/api/v0.1/signin/start",
};

export const PASSWORD_METHOD_RESULT = {
    id: "password-1",
    type: "password",
    challengeHref: "/tenant/api/v0.1/password/challenge",
};

const emailMethod = {
    id: "email-1",
    type: "email",
    hint: "u***@contoso.com",
    challengeHref: "/tenant/api/v0.1/email/challenge",
};

const smsMethod = {
    id: "sms-1",
    type: "sms",
    hint: "+1******1234",
    challengeHref: "/tenant/api/v0.1/sms/challenge",
};

export const START_RESULT: SignInStartApiResultV2 = {
    continuationToken: "ct-start",
    authenticationFactor: "singleFactor",
    methods: [PASSWORD_METHOD_RESULT],
};

export const EMAIL_START_RESULT: SignInStartApiResultV2 = {
    ...START_RESULT,
    methods: [emailMethod],
};

export const PASSWORD_AND_EMAIL_START_RESULT: SignInStartApiResultV2 = {
    ...START_RESULT,
    methods: [PASSWORD_METHOD_RESULT, emailMethod],
};

export const PASSWORD_EMAIL_AND_SMS_START_RESULT: SignInStartApiResultV2 = {
    ...START_RESULT,
    methods: [PASSWORD_METHOD_RESULT, emailMethod, smsMethod],
};

export const PASSWORD_CHALLENGE_RESULT: ChallengeVerificationResultV2 = {
    nextAction: "verify",
    continuationToken: "ct-password-challenge",
    type: "password",
    verifyHref: "/tenant/api/v0.1/password/verify",
};

export const EMAIL_CHALLENGE_RESULT: ChallengeVerificationResultV2 = {
    nextAction: "verify",
    continuationToken: "ct-email-challenge",
    type: "email",
    codeLength: 6,
    hint: "u***@contoso.com",
    verifyHref: "/tenant/api/v0.1/email/verify",
    resendHref: "/tenant/api/v0.1/email/resend",
};

export const EMAIL_RESEND_RESULT: ChallengeVerificationResultV2 = {
    ...EMAIL_CHALLENGE_RESULT,
    continuationToken: "ct-email-resend",
};

export const SMS_CHALLENGE_RESULT: ChallengeVerificationResultV2 = {
    ...EMAIL_CHALLENGE_RESULT,
    continuationToken: "ct-sms-challenge",
    type: "sms",
    hint: "+1******1234",
    verifyHref: "/tenant/api/v0.1/sms/verify",
    resendHref: "/tenant/api/v0.1/sms/resend",
};

export const SIGN_IN_CONTINUE_RESULT: ContinueResultV2 = {
    nextAction: "continue",
    continuationToken: "ct-password-verify",
    continueHref: "/tenant/oauth2/v2.0/authorize-challenge",
};

export const EMAIL_REGISTRATION_REQUIRED_RESULT: EnrollmentRequiredResultV2 = {
    nextAction: "enroll",
    continuationToken: "ct-email-enroll",
    methods: [{ type: "email", enrollHref: "/tenant/api/v0.1/enroll/email" }],
};

export const PHONE_REGISTRATION_REQUIRED_RESULT: EnrollmentRequiredResultV2 = {
    nextAction: "enroll",
    continuationToken: "ct-phone-enroll",
    methods: [
        {
            type: "phone",
            channels: ["sms"],
            enrollHref: "/tenant/api/v0.1/enroll/phone",
        },
    ],
};

export const EMAIL_REGISTRATION_ACTIVATION_RESULT: EnrollmentResultV2 = {
    nextAction: "activate",
    continuationToken: "ct-email-activate",
    codeLength: 6,
    hint: "u***@contoso.com",
    activateHref: "/tenant/api/v0.1/activate/email",
    resendHref: "/tenant/api/v0.1/enroll/email",
};

export const PHONE_REGISTRATION_ACTIVATION_RESULT: EnrollmentResultV2 = {
    ...EMAIL_REGISTRATION_ACTIVATION_RESULT,
    continuationToken: "ct-phone-activate",
    hint: "+1******1234",
    activateHref: "/tenant/api/v0.1/activate/phone",
    resendHref: "/tenant/api/v0.1/enroll/phone",
};

export const EMAIL_MFA_REQUIRED_RESULT: VerifyResultV2 = {
    nextAction: "challenge",
    continuationToken: "ct-email-mfa",
    authenticationFactor: "multiFactor",
    methods: [
        {
            id: "email-mfa",
            type: "email",
            hint: "u***@contoso.com",
            challengeHref: "/tenant/api/v0.1/mfa/email/challenge",
        },
    ],
};

export const SMS_MFA_REQUIRED_RESULT: VerifyResultV2 = {
    nextAction: "challenge",
    continuationToken: "ct-sms-mfa",
    authenticationFactor: "multiFactor",
    methods: [
        {
            id: "sms-mfa",
            type: "sms",
            hint: "+1******1234",
            challengeHref: "/tenant/api/v0.1/mfa/sms/challenge",
        },
    ],
};

export const EMAIL_MFA_CHALLENGE_RESULT: ChallengeVerificationResultV2 = {
    ...EMAIL_CHALLENGE_RESULT,
    continuationToken: "ct-email-mfa-challenge",
    verifyHref: "/tenant/api/v0.1/mfa/email/verify",
    resendHref: "/tenant/api/v0.1/mfa/email/resend",
};

export const SMS_MFA_CHALLENGE_RESULT: ChallengeVerificationResultV2 = {
    ...SMS_CHALLENGE_RESULT,
    continuationToken: "ct-sms-mfa-challenge",
    verifyHref: "/tenant/api/v0.1/mfa/sms/verify",
    resendHref: "/tenant/api/v0.1/mfa/sms/resend",
};

export const SMS_MFA_RESEND_RESULT: ChallengeVerificationResultV2 = {
    ...SMS_MFA_CHALLENGE_RESULT,
    continuationToken: "ct-sms-mfa-resend",
};

export const MFA_VERIFY_RESULT: ContinueResultV2 = {
    ...SIGN_IN_CONTINUE_RESULT,
    continuationToken: "ct-mfa-verify",
};

export const ENTRY_RESPONSE = {
    continuation_token: "ct-entry",
    sign_in: "/tenant/api/v0.1/signin/start",
};

export const PASSWORD_METHOD = {
    id: "password-1",
    type: "password",
    _links: {
        challenge: {
            href: "/tenant/api/v0.1/password/challenge",
        },
    },
};

export const START_RESPONSE = {
    continuationToken: "ct-start",
    challengeContext: {
        authenticationFactor: "singleFactor",
    },
    _embedded: {
        methods: [PASSWORD_METHOD],
    },
};

export const PASSWORD_CHALLENGE_RESPONSE = {
    continuationToken: "ct-password-challenge",
    action: "verify",
    id: "password-1",
    type: "password",
    _links: {
        verify: { href: "/tenant/api/v0.1/password/verify" },
    },
};

export const SMS_MFA_REQUIRED_RESPONSE = {
    continuationToken: "ct-sms-mfa",
    state: "interactionRequired",
    action: "challenge",
    challengeContext: {
        authenticationFactor: "multiFactor",
    },
    _embedded: {
        methods: [
            {
                id: "sms-mfa",
                type: "sms",
                hint: "+1******1234",
                _links: {
                    challenge: {
                        href: "/tenant/api/v0.1/mfa/sms/challenge",
                    },
                },
            },
        ],
    },
};

export const SMS_MFA_CHALLENGE_RESPONSE = {
    continuationToken: "ct-sms-mfa-challenge",
    action: "verify",
    codeLength: 6,
    hint: "+1******1234",
    type: "sms",
    _links: {
        verify: { href: "/tenant/api/v0.1/mfa/sms/verify" },
        resend: { href: "/tenant/api/v0.1/mfa/sms/resend" },
    },
};

export const SMS_MFA_RESEND_RESPONSE = {
    ...SMS_MFA_CHALLENGE_RESPONSE,
    continuationToken: "ct-sms-mfa-resend",
};
