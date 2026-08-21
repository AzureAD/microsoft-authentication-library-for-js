/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2FlowScenario } from "../auth_flow/v2/CustomAuthV2FlowScenario.js";
import {
    RESET_PASSWORD_V2_CHALLENGE,
    RESET_PASSWORD_V2_RESEND_CODE,
    RESET_PASSWORD_V2_SUBMIT,
    RESET_PASSWORD_V2_SUBMIT_CODE,
    SIGN_IN_AFTER_PASSWORD_RESET,
} from "./PublicApiId.js";

export type V2FlowStep =
    | "requestChallenge"
    | "submitCode"
    | "resendCode"
    | "submitPassword"
    | "signInWithContinuation";

const V2_FLOW_STEP_API_IDS: Partial<
    Record<CustomAuthV2FlowScenario, Record<V2FlowStep, number>>
> = {
    [CustomAuthV2FlowScenario.PasswordReset]: {
        requestChallenge: RESET_PASSWORD_V2_CHALLENGE,
        submitCode: RESET_PASSWORD_V2_SUBMIT_CODE,
        resendCode: RESET_PASSWORD_V2_RESEND_CODE,
        submitPassword: RESET_PASSWORD_V2_SUBMIT,
        signInWithContinuation: SIGN_IN_AFTER_PASSWORD_RESET,
    },
};

export function getPublicApiIdV2(
    scenario: CustomAuthV2FlowScenario,
    step: V2FlowStep
): number | undefined {
    return V2_FLOW_STEP_API_IDS[scenario]?.[step];
}
