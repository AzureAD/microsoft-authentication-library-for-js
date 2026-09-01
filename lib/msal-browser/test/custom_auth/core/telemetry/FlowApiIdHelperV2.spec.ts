/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthFlowScenarioV2 } from "../../../../src/custom_auth/core/auth_flow/v2/CustomAuthFlowScenarioV2.js";
import { getPublicApiIdV2 } from "../../../../src/custom_auth/core/telemetry/FlowApiIdHelperV2.js";
import {
    RESET_PASSWORD_V2_SUBMIT_CODE,
    SIGN_IN_V2_SUBMIT_CODE,
    SIGN_IN_V2_SUBMIT_PASSWORD,
    SIGN_UP_V2_CHALLENGE,
    SIGN_UP_V2_COMPLETE,
    SIGN_UP_V2_RESEND_CODE,
    SIGN_UP_V2_SUBMIT_ATTRIBUTES,
    SIGN_UP_V2_SUBMIT_CODE,
} from "../../../../src/custom_auth/core/telemetry/PublicApiId.js";

describe("getPublicApiIdV2", () => {
    it.each([
        {
            scenario: CustomAuthFlowScenarioV2.SignIn,
            step: "submitCode" as const,
            expectedApiId: SIGN_IN_V2_SUBMIT_CODE,
        },
        {
            scenario: CustomAuthFlowScenarioV2.SignIn,
            step: "submitPassword" as const,
            expectedApiId: SIGN_IN_V2_SUBMIT_PASSWORD,
        },
        {
            scenario: CustomAuthFlowScenarioV2.PasswordReset,
            step: "submitCode" as const,
            expectedApiId: RESET_PASSWORD_V2_SUBMIT_CODE,
        },
        {
            scenario: CustomAuthFlowScenarioV2.SignUp,
            step: "requestChallenge" as const,
            expectedApiId: SIGN_UP_V2_CHALLENGE,
        },
        {
            scenario: CustomAuthFlowScenarioV2.SignUp,
            step: "submitCode" as const,
            expectedApiId: SIGN_UP_V2_SUBMIT_CODE,
        },
        {
            scenario: CustomAuthFlowScenarioV2.SignUp,
            step: "resendCode" as const,
            expectedApiId: SIGN_UP_V2_RESEND_CODE,
        },
        {
            scenario: CustomAuthFlowScenarioV2.SignUp,
            step: "submitAttributes" as const,
            expectedApiId: SIGN_UP_V2_SUBMIT_ATTRIBUTES,
        },
        {
            scenario: CustomAuthFlowScenarioV2.SignUp,
            step: "signInWithContinuation" as const,
            expectedApiId: SIGN_UP_V2_COMPLETE,
        },
    ])(
        "maps $scenario $step to $expectedApiId",
        ({ scenario, step, expectedApiId }) => {
            expect(getPublicApiIdV2(scenario, step)).toBe(expectedApiId);
        }
    );

    it("uses distinct API IDs for sign-in code and password submission", () => {
        expect(SIGN_IN_V2_SUBMIT_CODE).not.toBe(SIGN_IN_V2_SUBMIT_PASSWORD);
    });

    it("uses a distinct API ID for every sign-up step", () => {
        const signUpApiIds = [
            SIGN_UP_V2_CHALLENGE,
            SIGN_UP_V2_SUBMIT_CODE,
            SIGN_UP_V2_RESEND_CODE,
            SIGN_UP_V2_SUBMIT_ATTRIBUTES,
            SIGN_UP_V2_COMPLETE,
        ];

        expect(new Set(signUpApiIds).size).toBe(signUpApiIds.length);
    });
});
