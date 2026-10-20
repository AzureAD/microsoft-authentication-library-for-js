/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

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

export const EMAIL_METHOD = {
    id: "email-1",
    type: "email",
    hint: "u***@contoso.com",
    _links: {
        challenge: {
            href: "/tenant/api/v0.1/email/challenge",
        },
    },
};

export const SMS_METHOD = {
    id: "sms-1",
    type: "sms",
    hint: "+1******1234",
    _links: {
        challenge: {
            href: "/tenant/api/v0.1/sms/challenge",
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

export const EMAIL_START_RESPONSE = {
    ...START_RESPONSE,
    _embedded: {
        methods: [EMAIL_METHOD],
    },
};

export const PASSWORD_AND_EMAIL_START_RESPONSE = {
    ...START_RESPONSE,
    _embedded: {
        methods: [PASSWORD_METHOD, EMAIL_METHOD],
    },
};

export const PASSWORD_EMAIL_AND_SMS_START_RESPONSE = {
    ...START_RESPONSE,
    _embedded: {
        methods: [PASSWORD_METHOD, EMAIL_METHOD, SMS_METHOD],
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

export const EMAIL_CHALLENGE_RESPONSE = {
    continuationToken: "ct-email-challenge",
    action: "verify",
    type: "email",
    codeLength: 6,
    hint: "u***@contoso.com",
    _links: {
        verify: { href: "/tenant/api/v0.1/email/verify" },
        resend: { href: "/tenant/api/v0.1/email/resend" },
    },
};

export const EMAIL_RESEND_RESPONSE = {
    ...EMAIL_CHALLENGE_RESPONSE,
    continuationToken: "ct-email-resend",
};

export const SMS_CHALLENGE_RESPONSE = {
    continuationToken: "ct-sms-challenge",
    action: "verify",
    type: "sms",
    codeLength: 6,
    hint: "+1******1234",
    _links: {
        verify: { href: "/tenant/api/v0.1/sms/verify" },
        resend: { href: "/tenant/api/v0.1/sms/resend" },
    },
};

export const SIGN_IN_CONTINUE_RESPONSE = {
    continuationToken: "ct-password-verify",
    state: "continue",
    _links: {
        continue: { href: "/tenant/oauth2/v2.0/authorize-challenge" },
    },
};

export const EMAIL_MFA_REQUIRED_RESPONSE = {
    continuationToken: "ct-email-mfa",
    state: "interactionRequired",
    action: "challenge",
    challengeContext: {
        authenticationFactor: "multiFactor",
    },
    _embedded: {
        methods: [
            {
                id: "email-mfa",
                type: "email",
                hint: "u***@contoso.com",
                _links: {
                    challenge: {
                        href: "/tenant/api/v0.1/mfa/email/challenge",
                    },
                },
            },
        ],
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

export const EMAIL_MFA_CHALLENGE_RESPONSE = {
    continuationToken: "ct-email-mfa-challenge",
    action: "verify",
    codeLength: 6,
    hint: "u***@contoso.com",
    type: "email",
    _links: {
        verify: { href: "/tenant/api/v0.1/mfa/email/verify" },
        resend: { href: "/tenant/api/v0.1/mfa/email/resend" },
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

export const MFA_VERIFY_RESPONSE = {
    continuationToken: "ct-mfa-verify",
    state: "continue",
    _links: {
        continue: { href: "/tenant/oauth2/v2.0/authorize-challenge" },
    },
};

export const CONTINUE_RESPONSE = { code: "auth-code-1" };
