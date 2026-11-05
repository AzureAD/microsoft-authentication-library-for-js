/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ApiRequestBase } from "../../types/ApiTypesBase.js";
import { UserAccountAttributes } from "../../../../../UserAccountAttributes.js";
import { PhoneRegistrationChannelV2 } from "../ApiClientConstantsV2.js";

export type RequestContextV2 = ApiRequestBase;

/*
 * OAuth entry and token requests require `client_id` in the form body.
 */
export interface OAuthFormRequestV2 {
    client_id: string;
}

export interface AuthorizeChallengeEntryRequestV2 extends OAuthFormRequestV2 {
    scope?: string;
    claims?: string;
}

/*
 * Continuation requests send only `continuation_token`, without `client_id`.
 */
export interface AuthorizeChallengeContinueRequestV2 {
    continuation_token: string;
}

/*
 * `client_info` is required to obtain the account identifiers used by MSAL.
 */
export interface TokenRequestV2 extends OAuthFormRequestV2 {
    grant_type: string;
    code: string;
    client_info: string;
}

export interface CompleteWithTokensRequestV2 {
    continuationToken: string;
}

export interface ActionRequestBaseV2 {
    continuationToken: string;
}

interface StartRequestV2 extends ActionRequestBaseV2 {
    username: string;
}
export type PasswordResetStartRequestV2 = StartRequestV2;

export type SignInStartRequestV2 = StartRequestV2;

export type SignUpStartRequestV2 = ActionRequestBaseV2;

export interface SignUpSubmitAttributesRequestV2 extends ActionRequestBaseV2 {
    attributes: UserAccountAttributes & {
        email?: string;
        password?: string;
    };
}

export type ChallengeRequestV2 = ActionRequestBaseV2;

export interface EmailAuthMethodRegistrationRequestV2
    extends ActionRequestBaseV2 {
    email: string;
}

export interface PhoneAuthMethodRegistrationRequestV2
    extends ActionRequestBaseV2 {
    phoneNumber: string;
    channel: typeof PhoneRegistrationChannelV2.SMS;
}

export type AuthMethodRegistrationRequestV2 =
    | EmailAuthMethodRegistrationRequestV2
    | PhoneAuthMethodRegistrationRequestV2;

export interface AuthMethodRegistrationVerificationRequestV2
    extends ActionRequestBaseV2 {
    otp: string;
}

type VerifyRequestBaseV2 = ActionRequestBaseV2;

interface VerifyOtpRequestV2 extends VerifyRequestBaseV2 {
    otp: string;
}

interface VerifyPasswordRequestV2 extends VerifyRequestBaseV2 {
    password: string;
}

export type VerifyRequestV2 = VerifyOtpRequestV2 | VerifyPasswordRequestV2;

export interface UpdatePasswordRequestV2 extends ActionRequestBaseV2 {
    newPassword: string;
}

export type PollRequestV2 = ActionRequestBaseV2;
