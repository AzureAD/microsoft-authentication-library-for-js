/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { HalErrorResponseV2 } from "../../../src/custom_auth/core/network_client/custom_auth_api/v2/response/ErrorResponsesV2.js";
import type {
    SignUpStartResponseV2,
    SignUpSubmitAttributesResponseV2,
} from "../../../src/custom_auth/core/network_client/custom_auth_api/v2/response/ResponsesV2.js";
import type { SignUpStartRequestV2 } from "../../../src/custom_auth/core/network_client/custom_auth_api/v2/request/RequestsV2.js";

export const ENTRY_RESPONSE = {
    error: "InsufficientAuthorization",
    error_description: "No authenticated credentials found in request.",
    continuation_token: "ct-entry",
    sign_up: "/tenant/api/v0.1/signup/start",
};

export const START_RESPONSE = {
    continuationToken: "ct-start",
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
} satisfies SignUpStartResponseV2;

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

export const USERNAME_START_REQUEST = {
    continuationToken: "ct-entry",
    username: "user@contoso.com",
} satisfies SignUpStartRequestV2;

export const FLAT_USERNAME_REQUIRED_RESPONSE = {
    continuationToken: "ct-flat-username",
    state: "interactionRequired",
    action: "collectAttributes",
    _links: {
        submitAttributes: {
            href: "/tenant/api/v0.1/signup/submitattributes",
        },
    },
    attributes: [
        {
            attributeId: "username",
            inputType: "text",
            required: true,
            canChange: true,
            label: "Username",
        },
    ],
} satisfies SignUpSubmitAttributesResponseV2;

export const PASSWORD_AND_PROFILE_REQUIRED_RESPONSE = {
    ...FLAT_USERNAME_REQUIRED_RESPONSE,
    continuationToken: "ct-password-profile",
    attributes: [
        {
            attributeId: "password",
            inputType: "password",
            required: true,
        },
        {
            attributeId: "username",
            inputType: "text",
            required: true,
        },
        {
            attributeId: "givenName",
            inputType: "text",
            required: true,
        },
    ],
} satisfies SignUpSubmitAttributesResponseV2;

export const INCREMENTAL_ATTRIBUTES_RESPONSES = [
    {
        ...FLAT_USERNAME_REQUIRED_RESPONSE,
        continuationToken: "ct-profile-round-1",
        attributes: [
            {
                attributeId: "givenName",
                inputType: "text",
                required: true,
            },
            {
                attributeId: "surname",
                inputType: "text",
                required: true,
            },
        ],
    },
    {
        ...FLAT_USERNAME_REQUIRED_RESPONSE,
        continuationToken: "ct-profile-round-2",
        attributes: [
            {
                attributeId: "surname",
                inputType: "text",
                required: true,
            },
        ],
        _links: {
            submitAttributes: {
                href: "/tenant/api/v0.1/signup/submitattributes?round=2",
            },
        },
    },
] satisfies SignUpSubmitAttributesResponseV2[];

export const INVALID_ATTRIBUTE_RESPONSE = {
    error: {
        code: "invalidRequest",
        message: "A submitted attribute failed validation.",
        correlationId: "corr-invalid-attribute",
        innerError: {
            code: "attributeValidationError",
            details: [
                {
                    attributeIds: ["username"],
                    code: "attributeValidationFailed",
                    message: "The username does not meet the requirements.",
                },
            ],
        },
    },
} satisfies HalErrorResponseV2;

export const PASSWORD_POLICY_ERROR_RESPONSE = {
    error: {
        code: "invalidRequest",
        message: "A submitted attribute failed validation.",
        correlationId: "corr-password-policy",
        innerError: {
            code: "attributeValidationError",
            details: [
                {
                    attributeIds: ["password"],
                    code: "passwordPolicyViolation",
                    message: "The password does not meet the requirements.",
                },
            ],
        },
    },
} satisfies HalErrorResponseV2;

export const WEAK_PASSWORD_ERROR_RESPONSE = {
    error: {
        code: "invalidRequest",
        message: "The password does not meet the requirements.",
        correlationId: "corr-weak-password",
        innerError: {
            code: "passwordTooWeak",
        },
    },
} satisfies HalErrorResponseV2;

export const UNKNOWN_SIGN_UP_ERROR_RESPONSE = {
    error: {
        code: "unknownSignUpError",
        message: "An unrecognized sign-up failure.",
        correlationId: "corr-unknown-sign-up",
    },
} satisfies HalErrorResponseV2;
