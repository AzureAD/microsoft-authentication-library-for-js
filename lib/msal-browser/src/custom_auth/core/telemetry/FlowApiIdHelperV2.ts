/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthFlowScenarioV2 } from "../auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { AuthenticationFactorV2 } from "../network_client/custom_auth_api/v2/result/BaseResultsV2.js";
import {
    MFA_V2_RESEND_CHALLENGE,
    MFA_V2_SELECT_AUTH_METHOD,
    MFA_V2_SUBMIT_CHALLENGE,
    RESET_PASSWORD_V2_CHALLENGE,
    RESET_PASSWORD_V2_RESEND_CODE,
    RESET_PASSWORD_V2_SUBMIT,
    RESET_PASSWORD_V2_SUBMIT_CODE,
    SIGN_IN_AFTER_PASSWORD_RESET,
    SIGN_IN_V2_CHALLENGE,
    SIGN_IN_V2_COMPLETE,
    SIGN_IN_V2_SUBMIT_CODE,
    SIGN_IN_V2_SUBMIT_PASSWORD,
    SIGN_UP_V2_CHALLENGE,
    SIGN_UP_V2_COMPLETE,
    SIGN_UP_V2_RESEND_CODE,
    SIGN_UP_V2_SUBMIT_ATTRIBUTES,
    SIGN_UP_V2_SUBMIT_CODE,
    SIGN_UP_V2_SUBMIT_PASSWORD,
} from "./PublicApiId.js";

export type FlowStepV2 =
    | "requestChallenge"
    | "submitCode"
    | "resendCode"
    | "submitNewPassword"
    | "submitPassword"
    | "submitAttributes"
    | "signInWithContinuation";

const FLOW_STEP_API_IDS_V2: Partial<
    Record<CustomAuthFlowScenarioV2, Partial<Record<FlowStepV2, number>>>
> = {
    [CustomAuthFlowScenarioV2.PasswordReset]: {
        requestChallenge: RESET_PASSWORD_V2_CHALLENGE,
        submitCode: RESET_PASSWORD_V2_SUBMIT_CODE,
        resendCode: RESET_PASSWORD_V2_RESEND_CODE,
        submitNewPassword: RESET_PASSWORD_V2_SUBMIT,
        signInWithContinuation: SIGN_IN_AFTER_PASSWORD_RESET,
    },
    [CustomAuthFlowScenarioV2.SignIn]: {
        requestChallenge: SIGN_IN_V2_CHALLENGE,
        submitCode: SIGN_IN_V2_SUBMIT_CODE,
        resendCode: SIGN_IN_V2_CHALLENGE,
        submitPassword: SIGN_IN_V2_SUBMIT_PASSWORD,
        signInWithContinuation: SIGN_IN_V2_COMPLETE,
    },
    [CustomAuthFlowScenarioV2.SignUp]: {
        requestChallenge: SIGN_UP_V2_CHALLENGE,
        submitCode: SIGN_UP_V2_SUBMIT_CODE,
        submitPassword: SIGN_UP_V2_SUBMIT_PASSWORD,
        resendCode: SIGN_UP_V2_RESEND_CODE,
        submitAttributes: SIGN_UP_V2_SUBMIT_ATTRIBUTES,
        signInWithContinuation: SIGN_UP_V2_COMPLETE,
    },
};

const MFA_STEP_API_IDS_V2: Partial<Record<FlowStepV2, number>> = {
    requestChallenge: MFA_V2_SELECT_AUTH_METHOD,
    submitCode: MFA_V2_SUBMIT_CHALLENGE,
    resendCode: MFA_V2_RESEND_CHALLENGE,
};

/**
 * Resolves the telemetry API ID for a flow step. MFA challenge operations use
 * distinct IDs when the sign-in caller identifies the second factor.
 */
export function getPublicApiIdV2(
    scenario: CustomAuthFlowScenarioV2,
    step: FlowStepV2,
    authenticationFactor?: AuthenticationFactorV2
): number | undefined {
    if (
        scenario === CustomAuthFlowScenarioV2.SignIn &&
        authenticationFactor === AuthenticationFactorV2.MULTI_FACTOR
    ) {
        return (
            MFA_STEP_API_IDS_V2[step] ?? FLOW_STEP_API_IDS_V2[scenario]?.[step]
        );
    }

    return FLOW_STEP_API_IDS_V2[scenario]?.[step];
}
