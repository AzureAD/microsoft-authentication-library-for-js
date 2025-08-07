/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthPublicClientApplication } from "../../../src/custom_auth/CustomAuthPublicClientApplication.js";
import { SignInResult } from "../../../src/custom_auth/sign_in/auth_flow/result/SignInResult.js";
import { SignInSubmitCodeResult } from "../../../src/custom_auth/sign_in/auth_flow/result/SignInSubmitCodeResult.js";
import { SignInSubmitPasswordResult } from "../../../src/custom_auth/sign_in/auth_flow/result/SignInSubmitPasswordResult.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { CustomAuthAccountData } from "../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { CustomAuthStandardController } from "../../../src/custom_auth/controller/CustomAuthStandardController.js";
import { SignInCodeRequiredState } from "../../../src/custom_auth/sign_in/auth_flow/state/SignInCodeRequiredState.js";
import { SignInPasswordRequiredState } from "../../../src/custom_auth/sign_in/auth_flow/state/SignInPasswordRequiredState.js";
import { TestServerTokenResponse } from "../test_resources/TestConstants.js";

describe("Sign in", () => {
    let app: CustomAuthPublicClientApplication;
    const correlationId = "test-correlation-id";

    beforeEach(async () => {
        app = (await CustomAuthPublicClientApplication.create(
            customAuthConfig
        )) as CustomAuthPublicClientApplication;

        global.fetch = jest.fn(); // Mock the fetch API
    });

    afterEach(() => {
        const activeUser = app.getAllAccounts();
        if (activeUser.length > 0) {
            app.clearCache();
        }

        const controller = app[
            "customAuthController"
        ] as CustomAuthStandardController;
        if (
            controller &&
            controller["eventHandler"] &&
            controller["eventHandler"]["broadcastChannel"]
        ) {
            controller["eventHandler"]["broadcastChannel"].close();
        }

        jest.clearAllMocks(); // Clear mocks between tests
    });

    it("should sign in successfully if the challenge type is password and password is provided initially", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => {
                return {
                    continuation_token: "test-continuation-token-1",
                    challenge_type: "oob password redirect",
                };
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => {
                return {
                    continuation_token: "test-continuation-token-2",
                    challenge_type: "password",
                };
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => {
                return TestServerTokenResponse;
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        const signInInputs = {
            username: "test@test.com",
            password: "password",
            correlationId: correlationId,
        };

        const result = await app.signIn(signInInputs);

        expect(result).toBeInstanceOf(SignInResult);
        expect(result.error).toBeUndefined();
        expect(result.isCompleted()).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data).toBeInstanceOf(CustomAuthAccountData);

        // Sign out the user for clean up the state for the other tests.
        result.data?.signOut();
    });

    it("should sign in successfully if the challenge type is oob", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => {
                return {
                    correlation_id: correlationId,
                    continuation_token: "test-continuation-token-1",
                    challenge_type: "oob password redirect",
                };
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => {
                return {
                    correlation_id: correlationId,
                    continuation_token: "test-continuation-token-2",
                    challenge_type: "oob",
                    code_length: 8,
                };
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => {
                return TestServerTokenResponse;
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        const signInInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const signInResult = await app.signIn(signInInputs);

        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.isCodeRequired()).toBe(true);

        const state = signInResult.state as SignInCodeRequiredState;
        const submitCodeResult = await state.submitCode("12345678");

        expect(submitCodeResult).toBeDefined();
        expect(submitCodeResult).toBeInstanceOf(SignInSubmitCodeResult);
        expect(submitCodeResult.data).toBeInstanceOf(CustomAuthAccountData);

        // Sign out the user for clean up the state for the other tests.
        submitCodeResult.data?.signOut();
    });

    it("should sign in successfully if the challenge type is password", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => {
                return {
                    correlation_id: correlationId,
                    continuation_token: "test-continuation-token-1",
                    challenge_type: "oob password redirect",
                };
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => {
                return {
                    correlation_id: correlationId,
                    continuation_token: "test-continuation-token-2",
                    challenge_type: "password",
                };
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => {
                return TestServerTokenResponse;
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        const signInInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const signInResult = await app.signIn(signInInputs);

        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.isPasswordRequired()).toBe(true);

        const state = signInResult.state as SignInPasswordRequiredState;

        const submitCodeResult = await state.submitPassword("valid-password");

        expect(submitCodeResult).toBeDefined();
        expect(submitCodeResult).toBeInstanceOf(SignInSubmitPasswordResult);
        expect(submitCodeResult.data).toBeInstanceOf(CustomAuthAccountData);

        // Sign out the user for clean up the state for the other tests.
        submitCodeResult.data?.signOut();
    });

    it("should sign in failed with error if the challenge type is redirect", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => {
                return {
                    correlation_id: correlationId,
                    continuation_token: "test-continuation-token-1",
                    challenge_type: "oob password redirect",
                };
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => {
                return {
                    correlation_id: correlationId,
                    challenge_type: "redirect",
                };
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        const signInInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const signInResult = await app.signIn(signInInputs);

        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeDefined();
        expect(signInResult.isFailed()).toBe(true);
        expect(signInResult.error?.isRedirectRequired()).toBe(true);
    });

    it("should sign in failed with error if the given user is not found", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => {
                return {
                    error: "user_not_found",
                };
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        const signInInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const signInResult = await app.signIn(signInInputs);

        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeDefined();
        expect(signInResult.isFailed()).toBe(true);
        expect(signInResult.error?.isUserNotFound()).toBe(true);
    });

    it("should sign in failed if the challenge type is password but given password is incorrect", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => {
                return {
                    correlation_id: correlationId,
                    continuation_token: "test-continuation-token-1",
                    challenge_type: "oob password redirect",
                };
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => {
                return {
                    correlation_id: correlationId,
                    continuation_token: "test-continuation-token-2",
                    challenge_type: "password",
                };
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => {
                return {
                    error: "invalid_grant",
                    error_description:
                        "AADSTS901007: Error validating credentials due to invalid username or password.",
                    error_codes: [50126],
                };
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        const signInInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            password: "invalid-password",
        };

        const signInResult = await app.signIn(signInInputs);

        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeDefined();
        expect(signInResult.isFailed()).toBe(true);
        expect(signInResult.error?.isPasswordIncorrect()).toBe(true);
    });

    it("should sign in failed if the challenge type is oob but given code is incorrect", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => {
                return {
                    correlation_id: correlationId,
                    continuation_token: "test-continuation-token-1",
                    challenge_type: "oob password redirect",
                };
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => {
                return {
                    correlation_id: correlationId,
                    continuation_token: "test-continuation-token-2",
                    challenge_type: "oob",
                };
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => {
                return {
                    error: "invalid_grant",
                    error_description:
                        "AADSTS901007: Error validating credentials due to invalid username or password.",
                    error_codes: [],
                    suberror: "invalid_oob_value",
                };
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        const signInInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const signInResult = await app.signIn(signInInputs);

        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.isCodeRequired()).toBe(true);

        const state = signInResult.state as SignInCodeRequiredState;

        const submitCodeResult = await state.submitCode("invalid-code");

        expect(submitCodeResult).toBeDefined();
        expect(submitCodeResult).toBeInstanceOf(SignInSubmitCodeResult);
        expect(submitCodeResult.error).toBeDefined();
        expect(submitCodeResult.error?.isInvalidCode()).toBe(true);
    });

    it("should sign in successfully if giving custom claims with password as the challenge type", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => {
                return {
                    continuation_token: "test-continuation-token-1",
                    challenge_type: "oob password redirect",
                };
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => {
                return {
                    continuation_token: "test-continuation-token-2",
                    challenge_type: "password",
                };
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => {
                return TestServerTokenResponse;
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        const claims = JSON.stringify({
            access_token: {
                acrs: {
                    essential: true,
                    value: "c1",
                },
            },
        });

        const signInInputs = {
            username: "test@test.com",
            password: "password",
            correlationId: correlationId,
            claims: claims,
        };

        const result = await app.signIn(signInInputs);

        expect(result).toBeInstanceOf(SignInResult);
        expect(result.error).toBeUndefined();
        expect(result.isCompleted()).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data).toBeInstanceOf(CustomAuthAccountData);
    });
});
