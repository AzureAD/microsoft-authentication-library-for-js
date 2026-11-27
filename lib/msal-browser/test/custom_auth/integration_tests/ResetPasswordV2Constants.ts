/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type {
    AuthorizeChallengeEntryResponseV2,
    ContinueResponseV2,
    PasswordResetStartResponseV2,
    PollResponseV2,
    UpdatePasswordResponseV2,
    VerifyResponseV2,
} from "../../../src/custom_auth/core/network_client/custom_auth_api/v2/response/ResponsesV2.js";
import {
    EMAIL_START_RESPONSE,
    EMAIL_CHALLENGE_RESPONSE as SIGN_IN_EMAIL_CHALLENGE_RESPONSE,
    EMAIL_MFA_REQUIRED_RESPONSE,
    EMAIL_MFA_CHALLENGE_RESPONSE,
} from "./SignInV2Constants.js";
import type {
    AuthorizeChallengeEntryResultV2,
    ChallengeVerificationResultV2,
    ContinueResultV2,
    EnrollmentRequiredResultV2,
    EnrollmentResultV2,
    ResetPasswordStartApiResultV2,
    RiskVerificationRequiredResultV2,
    VerifyResultV2,
} from "../../../src/custom_auth/core/network_client/custom_auth_api/v2/result/BaseResultsV2.js";
import type {
    ResetPasswordPollResultV2,
    ResetPasswordUpdateResultV2,
} from "../../../src/custom_auth/core/network_client/custom_auth_api/v2/result/ResetPasswordResultsV2.js";

export const ENTRY_RESPONSE: AuthorizeChallengeEntryResultV2 = {
    continuationToken: "ct-entry",
    resetPasswordHref: "/tenant/api/v0.1/auth/resetpassword?dc=X",
};

const emailMethod = {
    id: "email",
    type: "email",
    hint: "u***@contoso.com",
    challengeHref: "/tenant/api/v0.1/methods/email/challenge",
};

const smsMethod = {
    id: "sms",
    type: "sms",
    hint: "+*** *******11",
    challengeHref: "/tenant/api/v0.1/methods/sms/challenge",
};

export const EMAIL_ONLY_START_RESPONSE: ResetPasswordStartApiResultV2 = {
    continuationToken: "ct-start",
    authenticationFactor: "singleFactor",
    scenario: "recovery",
    methods: [emailMethod],
};

export const SMS_ONLY_START_RESPONSE: ResetPasswordStartApiResultV2 = {
    ...EMAIL_ONLY_START_RESPONSE,
    methods: [smsMethod],
};

export const EMAIL_AND_SMS_START_RESPONSE: ResetPasswordStartApiResultV2 = {
    ...EMAIL_ONLY_START_RESPONSE,
    methods: [emailMethod, smsMethod],
};

export const EMAIL_CHALLENGE_RESPONSE: ChallengeVerificationResultV2 = {
    nextAction: "verify",
    continuationToken: "ct-email-challenge",
    type: "email",
    codeLength: 6,
    hint: "u***@contoso.com",
    verifyHref: "/tenant/api/v0.1/email/verify",
    resendHref: "/tenant/api/v0.1/email/resend",
};

export const SMS_CHALLENGE_RESPONSE: RiskVerificationRequiredResultV2 = {
    nextAction: "riskverify",
    continuationToken: "ct-sms-risk",
    riskVerifyHref: "/tenant/api/v1.0-internal/risk/phone/verify",
};

export const SMS_RISK_VERIFY_RESPONSE: ChallengeVerificationResultV2 = {
    nextAction: "verify",
    continuationToken: "ct-sms-verify",
    type: "sms",
    codeLength: 6,
    hint: "+*** *******11",
    verifyHref: "/tenant/api/v1.0-internal/sms/verify",
    resendHref: "/tenant/api/v1.0-internal/sms/challenge",
};

export const SMS_RESEND_CHALLENGE_RESPONSE: RiskVerificationRequiredResultV2 = {
    ...SMS_CHALLENGE_RESPONSE,
    continuationToken: "ct-sms-resend-risk",
};

export const SMS_RESEND_RISK_VERIFY_RESPONSE: ChallengeVerificationResultV2 = {
    ...SMS_RISK_VERIFY_RESPONSE,
    continuationToken: "ct-sms-resend-verify",
};

export const VERIFY_RESPONSE: VerifyResultV2 = {
    nextAction: "update",
    continuationToken: "ct-verify",
    updateHref: "/tenant/api/v0.1/update",
};

export const UPDATE_RESPONSE: ResetPasswordUpdateResultV2 = {
    continuationToken: "ct-update",
    pollHref: "/tenant/api/v0.1/poll",
};

export const POLL_COMPLETED_RESPONSE: ContinueResultV2 = {
    nextAction: "continue",
    continuationToken: "ct-poll",
    continueHref: "/tenant/api/v0.1/continue",
};

export const POLL_MFA_REQUIRED_RESPONSE = {
    nextAction: "challenge",
    continuationToken: "ct-mfa-selection",
    authenticationFactor: "multiFactor",
    methods: [
        {
            id: "email-mfa",
            type: "email",
            hint: "u***@contoso.com",
            challengeHref: "/tenant/api/v0.1/mfa/email/challenge",
        },
    ],
} satisfies ResetPasswordPollResultV2;

export const MFA_EMAIL_CHALLENGE_RESPONSE: ChallengeVerificationResultV2 = {
    ...EMAIL_CHALLENGE_RESPONSE,
    continuationToken: "ct-mfa-challenge",
    verifyHref: "/tenant/api/v0.1/mfa/email/verify",
    resendHref: "/tenant/api/v0.1/mfa/email/resend",
};

export const MFA_VERIFY_RESPONSE: ContinueResultV2 = {
    ...POLL_COMPLETED_RESPONSE,
    continuationToken: "ct-mfa-verified",
};

export const POLL_ENROLL_REQUIRED_RESPONSE: EnrollmentRequiredResultV2 = {
    nextAction: "enroll",
    continuationToken: "ct-enroll",
    methods: [{ type: "email", enrollHref: "/tenant/api/v0.1/enroll/email" }],
};

export const ENROLL_ACTIVATION_RESPONSE: EnrollmentResultV2 = {
    nextAction: "activate",
    continuationToken: "ct-activation",
    codeLength: 6,
    activateHref: "/tenant/api/v0.1/activate/email",
    resendHref: "/tenant/api/v0.1/enroll/email",
};

export const ACTIVATED_CONTINUE_RESPONSE: ContinueResultV2 = {
    ...POLL_COMPLETED_RESPONSE,
    continuationToken: "ct-activated",
};

// Keep wire responses distinct from the parsed API results above.
export const HTTP_ENTRY_RESPONSE = {
    continuation_token: "ct-entry",
    reset_password: "/tenant/api/v0.1/auth/resetpassword?dc=X",
} satisfies AuthorizeChallengeEntryResponseV2;

export const HTTP_EMAIL_ONLY_START_RESPONSE = {
    ...EMAIL_START_RESPONSE,
    scenario: "recovery",
} satisfies PasswordResetStartResponseV2;

export const HTTP_EMAIL_CHALLENGE_RESPONSE = SIGN_IN_EMAIL_CHALLENGE_RESPONSE;

export const HTTP_VERIFY_RESPONSE = {
    continuationToken: "ct-verify",
    action: "update",
    _links: { update: { href: "/tenant/api/v0.1/update" } },
} satisfies VerifyResponseV2;

export const HTTP_UPDATE_RESPONSE = {
    continuationToken: "ct-update",
    _links: { poll: { href: "/tenant/api/v0.1/poll" } },
} satisfies UpdatePasswordResponseV2;

export const HTTP_POLL_COMPLETED_RESPONSE = {
    state: "continue",
    continuationToken: "ct-poll",
    _links: { continue: { href: "/tenant/api/v0.1/continue" } },
} satisfies PollResponseV2;

export const HTTP_POLL_MFA_REQUIRED_RESPONSE = {
    ...EMAIL_MFA_REQUIRED_RESPONSE,
    continuationToken: "ct-mfa-selection",
} satisfies PollResponseV2;

export const HTTP_MFA_EMAIL_CHALLENGE_RESPONSE = {
    ...EMAIL_MFA_CHALLENGE_RESPONSE,
    continuationToken: "ct-mfa-challenge",
};

export const HTTP_MFA_VERIFY_RESPONSE = {
    ...HTTP_POLL_COMPLETED_RESPONSE,
    continuationToken: "ct-mfa-verified",
} satisfies ContinueResponseV2;
