/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { OAuthErrorResponseV2, ServerErrorV2 } from "./ErrorResponsesV2.js";
import { HalLink, HalResource } from "./HalResource.js";
import {
    CHALLENGE_RELATION,
    VERIFY_RELATION,
} from "../ApiClientConstantsV2.js";

export interface HalResponseBaseV2 extends HalResource {
    continuationToken?: string;
    state?: string;
    action?: string;
    scenario?: string;
    challengeContext?: {
        authenticationFactor?: string;
    };
    correlationId?: string;
}

export interface EmbeddedMethodV2 extends Omit<HalResource, "_links"> {
    id?: string;
    type?: string;
    hint?: string;
    _links?: {
        challenge?: HalLink;
    };
}

export interface EmbeddedEnrollmentMethodV2
    extends Omit<HalResource, "_links"> {
    type?: string;
    channels?: string[];
    _links?: {
        enroll?: HalLink;
    };
}

export interface EnrollmentRequiredResponseV2
    extends Omit<HalResponseBaseV2, "_embedded"> {
    _embedded?: {
        methods?: EmbeddedEnrollmentMethodV2[];
    };
}

export interface AuthorizeChallengeContinueResponseV2 {
    code?: string;
}

export interface AuthorizeChallengeEntryResponseV2
    extends OAuthErrorResponseV2 {
    continuation_token?: string;
    reset_password?: string;
    sign_in?: string;
    sign_up?: string;
}

interface StartResponseV2 extends Omit<HalResponseBaseV2, "_embedded"> {
    action: typeof CHALLENGE_RELATION;
    _embedded: {
        methods: EmbeddedMethodV2[];
    };
}

export type PasswordResetStartResponseV2 = StartResponseV2;
export type SignInStartResponseV2 = StartResponseV2;

export interface SignUpAttributeResponseV2 {
    attributeId: string;
    inputType?: string;
    required?: boolean;
    canChange?: boolean;
    label?: string;
    regex?: string;
    confirmationInput?: string;
}

export interface SignUpStartVerifyResponseV2 extends CodeChallengeResponseV2 {
    action: typeof VERIFY_RELATION;
}

export type SignUpStartResponseV2 =
    | SignUpStartVerifyResponseV2
    | SignInStartResponseV2;

interface ChallengeResponseBaseV2 extends Omit<HalResponseBaseV2, "_links"> {
    id?: string;
    type?: string;
}

export interface CodeChallengeResponseV2 extends ChallengeResponseBaseV2 {
    hint?: string;
    codeLength?: number;
    payload?: { codeLength?: number };
    _links?: {
        verify?: HalLink;
        resend?: HalLink;
    };
}

export interface PasswordChallengeResponseV2 extends ChallengeResponseBaseV2 {
    _links?: {
        verify?: HalLink;
    };
}

export type VerificationChallengeResponseV2 =
    | CodeChallengeResponseV2
    | PasswordChallengeResponseV2;

export interface RiskVerificationRequiredResponseV2
    extends ChallengeResponseBaseV2 {
    _links?: {
        riskverify?: HalLink;
    };
}

export type ChallengeResponseV2 =
    | VerificationChallengeResponseV2
    | RiskVerificationRequiredResponseV2;

export type RiskVerificationResponseV2 = CodeChallengeResponseV2;

export interface SignUpSubmitAttributesResponseV2
    extends Omit<CodeChallengeResponseV2, "_links" | "_embedded"> {
    attributes?: SignUpAttributeResponseV2[];
    _links?: {
        verify?: HalLink;
        resend?: HalLink;
        submitAttributes?: HalLink;
    };
    _embedded?: {
        methods?: EmbeddedEnrollmentMethodV2[];
    };
}

export interface VerifyResponseV2 extends Omit<HalResponseBaseV2, "_links"> {
    id?: string;
    type?: string;
    payload?: Record<string, unknown>;
    attributes?: SignUpAttributeResponseV2[];
    _links?: {
        update?: HalLink;
        submitAttributes?: HalLink;
    };
    _embedded?: {
        methods?: (EmbeddedMethodV2 | EmbeddedEnrollmentMethodV2)[];
    };
}

export interface EnrollmentResponseV2
    extends Omit<HalResponseBaseV2, "_links"> {
    codeLength?: number;
    type?: string;
    hint?: string;
    _links?: {
        activate?: HalLink;
        resend?: HalLink;
    };
}

export interface UpdatePasswordResponseV2
    extends Omit<HalResponseBaseV2, "_links"> {
    id?: string;
    type?: string;
    payload?: Record<string, unknown>;
    _links?: {
        poll?: HalLink;
    };
}

export interface PollResponseV2 extends Omit<HalResponseBaseV2, "_links"> {
    _links?: {
        poll?: HalLink;
    };
    _embedded?: {
        methods?: (EmbeddedMethodV2 | EmbeddedEnrollmentMethodV2)[];
    };
}

export interface TokenResponseV2 {
    token_type: string;
    expires_in: number;
    access_token: string;
    refresh_token?: string;
    scope?: string;
    id_token?: string;
    client_info?: string;
    ext_expires_in?: number;
}

export interface ParsedResponseV2<T> {
    statusCode: number;
    correlationId: string;
    continuationToken?: string;
    isWebFallbackRequired: boolean;
    error?: ServerErrorV2;
    body: T;
}
