/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export const ENTRY_RESPONSE = {
    error: "InsufficientAuthorization",
    error_description: "No authenticated credentials found in request.",
    continuation_token: "ct-entry",
    sign_up: "/tenant/api/v0.1/signup/start",
};

export const START_RESPONSE = {
    continuationToken: "ct-start",
    state: "interactionRequired",
    action: "collectAttributes",
    attributes: [
        {
            attributeId: "email",
            inputType: "text",
            required: true,
            canChange: true,
            label: "Email Address",
            regex: "^.*",
        },
    ],
    _links: {
        submitAttributes: {
            href: "/tenant/api/v0.1/signup/submitattributes",
            name: "submitAttributes",
        },
    },
};

export const SUBMIT_ATTRIBUTES_RESPONSE = {
    continuationToken: "ct-challenge",
    state: "interactionRequired",
    action: "verify",
    id: "email-1",
    codeLength: 8,
    hint: "u***@contoso.com",
    type: "email",
    _links: {
        verify: { href: "/tenant/api/v0.1/email/verify" },
        resend: { href: "/tenant/api/v0.1/email/resend" },
    },
};

export const CONTINUE_RESPONSE = { code: "auth-code-1" };

export const ENROLL_REQUIRED_RESPONSE = {
    continuationToken: "ct-enroll",
    state: "interactionRequired",
    action: "enroll",
    _embedded: {
        methods: [
            {
                type: "phone",
                channels: ["sms"],
                _links: {
                    enroll: { href: "/tenant/api/v0.1/enroll/phone" },
                },
            },
            {
                type: "email",
                _links: {
                    enroll: { href: "/tenant/api/v0.1/enroll/email" },
                },
            },
        ],
    },
};

export const ENROLL_ACTIVATION_RESPONSE = {
    continuationToken: "ct-activation",
    action: "activate",
    codeLength: 6,
    hint: "u***@contoso.com",
    _links: {
        activate: { href: "/tenant/api/v0.1/activate/email" },
        resend: { href: "/tenant/api/v0.1/enroll/email" },
    },
};

export const ACTIVATED_CONTINUE_RESPONSE = {
    continuationToken: "ct-activated",
    state: "continue",
    _links: {
        continue: {
            href: "/tenant/oauth2/v2.0/authorize-challenge?route=placeholder",
        },
    },
};
