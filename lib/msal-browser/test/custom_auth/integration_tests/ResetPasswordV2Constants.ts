/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export const ENTRY_RESPONSE = {
    continuation_token: "ct-entry",
    reset_password: "/tenant/api/v0.1/auth/resetpassword?dc=X",
};

export const EMAIL_METHOD = {
    id: "email",
    type: "email",
    hint: "u***@contoso.com",
    _links: {
        challenge: {
            href: "/tenant/api/v0.1/methods/email/challenge",
        },
    },
};

export const SMS_METHOD = {
    id: "sms",
    type: "sms",
    hint: "+*** *******11",
    _links: {
        challenge: {
            href: "/tenant/api/v0.1/methods/sms/challenge",
        },
    },
};

const START_RESPONSE = {
    continuationToken: "ct-start",
    challengeContext: {
        authenticationFactor: "singleFactor",
    },
    scenario: "recovery",
    _links: {},
};

export const EMAIL_ONLY_START_RESPONSE = {
    ...START_RESPONSE,
    _embedded: {
        methods: [EMAIL_METHOD],
    },
};

export const SMS_ONLY_START_RESPONSE = {
    ...START_RESPONSE,
    _embedded: {
        methods: [SMS_METHOD],
    },
};

export const EMAIL_AND_SMS_START_RESPONSE = {
    ...START_RESPONSE,
    _embedded: {
        methods: [EMAIL_METHOD, SMS_METHOD],
    },
};

export const EMAIL_CHALLENGE_RESPONSE = {
    continuationToken: "ct-email-challenge",
    action: "verify",
    codeLength: 6,
    hint: "u***@contoso.com",
    type: "email",
    _links: {
        verify: { href: "/tenant/api/v0.1/email/verify" },
        resend: { href: "/tenant/api/v0.1/email/resend" },
    },
};

export const SMS_CHALLENGE_RESPONSE = {
    continuationToken: "ct-sms-risk",
    state: "interactionRequired",
    action: "riskverify",
    _links: {
        riskverify: {
            href: "/tenant/api/v1.0-internal/risk/phone/verify",
        },
    },
};

export const SMS_RISK_VERIFY_RESPONSE = {
    continuationToken: "ct-sms-verify",
    state: "interactionRequired",
    action: "verify",
    scenario: "recovery",
    id: "sms",
    type: "sms",
    hint: "+*** *******11",
    payload: { codeLength: 6 },
    _links: {
        verify: { href: "/tenant/api/v1.0-internal/sms/verify" },
        resend: { href: "/tenant/api/v1.0-internal/sms/challenge" },
    },
};

export const SMS_RESEND_CHALLENGE_RESPONSE = {
    ...SMS_CHALLENGE_RESPONSE,
    continuationToken: "ct-sms-resend-risk",
};

export const SMS_RESEND_RISK_VERIFY_RESPONSE = {
    ...SMS_RISK_VERIFY_RESPONSE,
    continuationToken: "ct-sms-resend-verify",
};

export const VERIFY_RESPONSE = {
    continuationToken: "ct-verify",
    action: "update",
    _links: { update: { href: "/tenant/api/v0.1/update" } },
};

export const UPDATE_RESPONSE = {
    continuationToken: "ct-update",
    _links: { poll: { href: "/tenant/api/v0.1/poll" } },
};

export const POLL_COMPLETED_RESPONSE = {
    state: "continue",
    continuationToken: "ct-poll",
    _links: { continue: { href: "/tenant/api/v0.1/continue" } },
};

export const CONTINUE_RESPONSE = { code: "auth-code-1" };
