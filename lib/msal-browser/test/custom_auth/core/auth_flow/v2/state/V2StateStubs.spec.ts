/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { MethodNotImplementedError } from "../../../../../../src/custom_auth/core/error/MethodNotImplementedError.js";
import { AuthenticationMethodSelectionRequiredState } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/AuthenticationMethodSelectionRequiredState.js";
import { ChallengeVerificationRequiredState } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/ChallengeVerificationRequiredState.js";
import { NewPasswordRequiredState } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/NewPasswordRequiredState.js";
import { SignInAfterResetPasswordState } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/SignInAfterResetPasswordState.js";
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

    it("AuthenticationMethodSelectionRequiredState.requestChallenge rejects with MethodNotImplementedError", async () => {
        const state = new AuthenticationMethodSelectionRequiredState({
            correlationId,
            logger: getDefaultLogger(),
            config: mockConfig,
            methods: [method],
        });

        await expect(state.requestChallenge("email")).rejects.toThrow(
            MethodNotImplementedError
        );
    });

    it("ChallengeVerificationRequiredState.verifyChallenge / requestNewChallenge reject with MethodNotImplementedError", async () => {
        const state = new ChallengeVerificationRequiredState({
            correlationId,
            logger: getDefaultLogger(),
            config: mockConfig,
            method,
        });

        await expect(state.verifyChallenge("12345678")).rejects.toThrow(
            MethodNotImplementedError
        );
        await expect(state.requestNewChallenge()).rejects.toThrow(
            MethodNotImplementedError
        );
    });

    it("NewPasswordRequiredState.submitNewPassword rejects with MethodNotImplementedError", async () => {
        const state = new NewPasswordRequiredState({
            correlationId,
            logger: getDefaultLogger(),
            config: mockConfig,
        });

        await expect(state.submitNewPassword("new-password")).rejects.toThrow(
            MethodNotImplementedError
        );
    });

    it("SignInAfterResetPasswordState.signIn rejects with MethodNotImplementedError", async () => {
        const state = new SignInAfterResetPasswordState({
            correlationId,
            logger: getDefaultLogger(),
            config: mockConfig,
            continuationToken: "continuation-token",
            username: "user@contoso.com",
        });

        await expect(state.signIn()).rejects.toThrow(MethodNotImplementedError);
    });
});
