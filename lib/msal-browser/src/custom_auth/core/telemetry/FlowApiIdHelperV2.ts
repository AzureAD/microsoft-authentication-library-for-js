/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthFlowScenarioV2 } from "../auth_flow/v2/CustomAuthFlowScenarioV2.js";
import {
    RESET_PASSWORD_V2_CHALLENGE,
    RESET_PASSWORD_V2_RESEND_CODE,
    RESET_PASSWORD_V2_SUBMIT,
    RESET_PASSWORD_V2_SUBMIT_CODE,
    SIGN_IN_AFTER_PASSWORD_RESET,
} from "./PublicApiId.js";

export type FlowStepV2 =
    | "requestChallenge"
    | "submitCode"
    | "resendCode"
    | "submitPassword"
    | "signInWithContinuation";

const FLOW_STEP_API_IDS_V2: Partial<
    Record<CustomAuthFlowScenarioV2, Record<FlowStepV2, number>>
> = {
    [CustomAuthFlowScenarioV2.PasswordReset]: {
        requestChallenge: RESET_PASSWORD_V2_CHALLENGE,
        submitCode: RESET_PASSWORD_V2_SUBMIT_CODE,
        resendCode: RESET_PASSWORD_V2_RESEND_CODE,
        submitPassword: RESET_PASSWORD_V2_SUBMIT,
        signInWithContinuation: SIGN_IN_AFTER_PASSWORD_RESET,
    },
};

export function getPublicApiIdV2(
    scenario: CustomAuthFlowScenarioV2,
    step: FlowStepV2
): number | undefined {
    return FLOW_STEP_API_IDS_V2[scenario]?.[step];
}
