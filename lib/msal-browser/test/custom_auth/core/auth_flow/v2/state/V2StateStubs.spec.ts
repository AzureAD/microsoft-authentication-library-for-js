/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { MethodNotImplementedError } from "../../../../../../src/custom_auth/core/error/MethodNotImplementedError.js";
import { AuthenticationMethodSelectionRequiredState } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/AuthenticationMethodSelectionRequiredState.js";
import { ChallengeVerificationRequiredState } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/ChallengeVerificationRequiredState.js";
import { NewPasswordRequiredState } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/NewPasswordRequiredState.js";
import { AuthenticationMethodV2 } from "../../../../../../src/custom_auth/core/auth_flow/v2/AuthenticationMethodV2.js";
import { getDefaultLogger } from "../../../../test_resources/TestModules.js";

describe("Native auth V2 action-required state stubs", () => {
    const correlationId = "test-correlation-id";
    const mockConfig = {
        auth: { clientId: "test-client-id" },
        customAuth: { challengeTypes: ["password"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const method: AuthenticationMethodV2 = {
        id: "email",
        type: "email",
    };

    it("AuthenticationMethodSelectionRequiredState.requestChallenge throws MethodNotImplementedError", () => {
        const state = new AuthenticationMethodSelectionRequiredState({
            correlationId,
            logger: getDefaultLogger(),
            config: mockConfig,
            methods: [method],
        });

        expect(() => state.requestChallenge("email")).toThrow(
            MethodNotImplementedError
        );
    });

    it("ChallengeVerificationRequiredState.verifyChallenge / requestNewChallenge throw MethodNotImplementedError", () => {
        const state = new ChallengeVerificationRequiredState({
            correlationId,
            logger: getDefaultLogger(),
            config: mockConfig,
            method,
        });

        expect(() => state.verifyChallenge("12345678")).toThrow(
            MethodNotImplementedError
        );
        expect(() => state.requestNewChallenge()).toThrow(
            MethodNotImplementedError
        );
    });

    it("NewPasswordRequiredState.submitNewPassword throws MethodNotImplementedError", () => {
        const state = new NewPasswordRequiredState({
            correlationId,
            logger: getDefaultLogger(),
            config: mockConfig,
        });

        expect(() => state.submitNewPassword("new-password")).toThrow(
            MethodNotImplementedError
        );
    });
});
