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
import { AuthMethodRegistrationRequiredState } from "../../../src/custom_auth/core/auth_flow/jit/state/AuthMethodRegistrationState.js";
import { AuthMethodVerificationRequiredState } from "../../../src/custom_auth/core/auth_flow/jit/state/AuthMethodRegistrationState.js";
import { AuthMethodRegistrationChallengeMethodResult } from "../../../src/custom_auth/core/auth_flow/jit/result/AuthMethodRegistrationChallengeMethodResult.js";
import { AuthMethodRegistrationSubmitChallengeResult } from "../../../src/custom_auth/core/auth_flow/jit/result/AuthMethodRegistrationSubmitChallengeResult.js";
import {
    MfaAwaitingState,
    MfaVerificationRequiredState,
} from "../../../src/custom_auth/core/auth_flow/mfa/state/MfaState.js";
import { MfaRequestChallengeResult } from "../../../src/custom_auth/core/auth_flow/mfa/result/MfaRequestChallengeResult.js";
import { MfaSubmitChallengeResult } from "../../../src/custom_auth/core/auth_flow/mfa/result/MfaSubmitChallengeResult.js";

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

    it("should handle JIT registration required after signIn() and complete flow with email verification", async () => {
        // Step 1: Mock /oauth2/initiate - successful initiate
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-1",
                challenge_type: "oob password redirect",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /oauth2/challenge - password challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-2",
                challenge_type: "password",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /oauth2/token - JIT registration required response
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "invalid_grant",
                error_description:
                    "Strong authentication method registration is required.",
                suberror: "registration_required",
                continuation_token: "jit-continuation-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /register/v1.0/introspect - available authentication methods
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "jit-introspect-token",
                methods: [
                    {
                        id: "email",
                        login_hint: "user@contoso.com",
                    },
                ],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 5: Mock /register/v1.0/challenge - email challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "jit-challenge-token",
                challenge_type: "oob",
                challenge_channel: "email",
                challenge_target: "us**@co***so.com",
                code_length: 6,
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 6: Mock /register/v1.0/continue - verification successful
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "jit-verified-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 7: Mock /oauth2/token - successful completion after JIT registration
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => TestServerTokenResponse,
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Start sign-in with password
        const signInInputs = {
            username: "test@test.com",
            password: "password",
            correlationId: correlationId,
        };

        const result = await app.signIn(signInInputs);

        // Verify JIT registration is required
        expect(result).toBeInstanceOf(SignInResult);
        expect(result.error).toBeUndefined();
        expect(result.isAuthMethodRegistrationRequired()).toBe(true);
        expect(result.state).toBeInstanceOf(
            AuthMethodRegistrationRequiredState
        );

        const jitState = result.state as AuthMethodRegistrationRequiredState;

        // Verify available authentication methods
        const authMethods = jitState.getAuthMethods();
        expect(authMethods).toHaveLength(1);
        expect(authMethods[0].id).toBe("email");
        expect(authMethods[0].login_hint).toBe("user@contoso.com");

        // Challenge the email authentication method
        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: authMethods[0],
            verificationContact: "user@contoso.com",
        });

        expect(challengeResult).toBeInstanceOf(
            AuthMethodRegistrationChallengeMethodResult
        );
        expect(challengeResult.error).toBeUndefined();
        expect(challengeResult.isVerificationRequired()).toBe(true);
        expect(challengeResult.state).toBeInstanceOf(
            AuthMethodVerificationRequiredState
        );

        const verificationState =
            challengeResult.state as AuthMethodVerificationRequiredState;

        // Verify verification state properties
        expect(verificationState.getChannel()).toBe("email");
        expect(verificationState.getSentTo()).toBe("us**@co***so.com");
        expect(verificationState.getCodeLength()).toBe(6);

        // Submit verification code
        const submitResult = await verificationState.submitChallenge("123456");

        expect(submitResult).toBeInstanceOf(
            AuthMethodRegistrationSubmitChallengeResult
        );
        expect(submitResult.error).toBeUndefined();
        expect(submitResult.isCompleted()).toBe(true);
        expect(submitResult.data).toBeInstanceOf(CustomAuthAccountData);
    });

    it("should handle JIT registration required after submitPassword() and complete flow with email verification", async () => {
        // Step 1: Mock /oauth2/initiate - successful initiate
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-1",
                challenge_type: "oob password redirect",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /oauth2/challenge - password challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-2",
                challenge_type: "password",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /oauth2/token - JIT registration required response
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "invalid_grant",
                error_description:
                    "Strong authentication method registration is required.",
                suberror: "registration_required",
                continuation_token: "jit-continuation-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /register/v1.0/introspect - available authentication methods
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "jit-introspect-token",
                methods: [
                    {
                        id: "email",
                        login_hint: "user@contoso.com",
                    },
                ],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 5: Mock /register/v1.0/challenge - email challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "jit-challenge-token",
                challenge_type: "oob",
                challenge_channel: "email",
                challenge_target: "us**@co***so.com",
                code_length: 6,
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 6: Mock /register/v1.0/continue - verification successful
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "jit-verified-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 7: Mock /oauth2/token - successful completion after JIT registration
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => TestServerTokenResponse,
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Start sign-in with password
        const signInInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const result = await app.signIn(signInInputs);

        // Verify JIT registration is required
        expect(result).toBeInstanceOf(SignInResult);
        expect(result.error).toBeUndefined();
        expect(result.isPasswordRequired()).toBe(true);

        const state = result.state as SignInPasswordRequiredState;
        const submissionResult = await state.submitPassword("password");

        expect(submissionResult.error).toBeUndefined();
        expect(submissionResult.isAuthMethodRegistrationRequired()).toBe(true);

        const jitState =
            submissionResult.state as AuthMethodRegistrationRequiredState;

        // Verify available authentication methods
        const authMethods = jitState.getAuthMethods();
        expect(authMethods).toHaveLength(1);
        expect(authMethods[0].id).toBe("email");
        expect(authMethods[0].login_hint).toBe("user@contoso.com");

        // Challenge the email authentication method
        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: authMethods[0],
            verificationContact: "user@contoso.com",
        });

        expect(challengeResult).toBeInstanceOf(
            AuthMethodRegistrationChallengeMethodResult
        );
        expect(challengeResult.error).toBeUndefined();
        expect(challengeResult.isVerificationRequired()).toBe(true);
        expect(challengeResult.state).toBeInstanceOf(
            AuthMethodVerificationRequiredState
        );

        const verificationState =
            challengeResult.state as AuthMethodVerificationRequiredState;

        // Verify verification state properties
        expect(verificationState.getChannel()).toBe("email");
        expect(verificationState.getSentTo()).toBe("us**@co***so.com");
        expect(verificationState.getCodeLength()).toBe(6);

        // Submit verification code
        const submitResult = await verificationState.submitChallenge("123456");

        expect(submitResult).toBeInstanceOf(
            AuthMethodRegistrationSubmitChallengeResult
        );
        expect(submitResult.error).toBeUndefined();
        expect(submitResult.isCompleted()).toBe(true);
        expect(submitResult.data).toBeInstanceOf(CustomAuthAccountData);
    });

    it("should handle JIT registration required after submitCode() and complete flow with email verification", async () => {
        // Step 1: Mock /oauth2/initiate - successful initiate
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-1",
                challenge_type: "oob password redirect",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /oauth2/challenge - oob challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-2",
                challenge_type: "oob",
                binding_method: "prompt",
                challenge_channel: "",
                challenge_target_label: "jo**@co***so.com",
                code_length: 6,
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /oauth2/token - JIT registration required response
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "invalid_grant",
                error_description:
                    "Strong authentication method registration is required.",
                suberror: "registration_required",
                continuation_token: "jit-continuation-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /register/v1.0/introspect - available authentication methods
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "jit-introspect-token",
                methods: [
                    {
                        id: "sms",
                        login_hint: "0000000000",
                    },
                ],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 5: Mock /register/v1.0/challenge - sms challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "jit-challenge-token",
                challenge_type: "oob",
                challenge_channel: "sms",
                challenge_target: "0000000000",
                code_length: 6,
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 6: Mock /register/v1.0/continue - verification successful
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "jit-verified-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 7: Mock /oauth2/token - successful completion after JIT registration
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => TestServerTokenResponse,
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Start sign-in with password
        const signInInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const result = await app.signIn(signInInputs);

        // Verify JIT registration is required
        expect(result).toBeInstanceOf(SignInResult);
        expect(result.error).toBeUndefined();
        expect(result.isCodeRequired()).toBe(true);

        const state = result.state as SignInCodeRequiredState;
        const submissionResult = await state.submitCode("123456");

        expect(submissionResult.error).toBeUndefined();
        expect(submissionResult.isAuthMethodRegistrationRequired()).toBe(true);

        const jitState =
            submissionResult.state as AuthMethodRegistrationRequiredState;

        // Verify available authentication methods
        const authMethods = jitState.getAuthMethods();
        expect(authMethods).toHaveLength(1);
        expect(authMethods[0].id).toBe("sms");
        expect(authMethods[0].login_hint).toBe("0000000000");

        // Challenge the sms authentication method
        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: authMethods[0],
            verificationContact: "0000000000",
        });

        expect(challengeResult).toBeInstanceOf(
            AuthMethodRegistrationChallengeMethodResult
        );
        expect(challengeResult.error).toBeUndefined();
        expect(challengeResult.isVerificationRequired()).toBe(true);
        expect(challengeResult.state).toBeInstanceOf(
            AuthMethodVerificationRequiredState
        );

        const verificationState =
            challengeResult.state as AuthMethodVerificationRequiredState;

        // Verify verification state properties
        expect(verificationState.getChannel()).toBe("sms");
        expect(verificationState.getSentTo()).toBe("0000000000");
        expect(verificationState.getCodeLength()).toBe(6);

        // Submit verification code
        const submitResult = await verificationState.submitChallenge("123456");

        expect(submitResult).toBeInstanceOf(
            AuthMethodRegistrationSubmitChallengeResult
        );
        expect(submitResult.error).toBeUndefined();
        expect(submitResult.isCompleted()).toBe(true);
        expect(submitResult.data).toBeInstanceOf(CustomAuthAccountData);
    });

    it("should handle JIT registration with fast-pass scenario (same email as sign-up)", async () => {
        // Step 1: Mock /oauth2/initiate - successful initiate
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-1",
                challenge_type: "oob password redirect",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /oauth2/challenge - password challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-2",
                challenge_type: "password",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /oauth2/token - JIT registration required response
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "invalid_grant",
                error_description:
                    "Strong authentication method registration is required.",
                suberror: "registration_required",
                continuation_token: "jit-continuation-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /register/v1.0/introspect - available authentication methods
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "jit-introspect-token",
                methods: [
                    {
                        id: "email",
                        login_hint: "user@contoso.com",
                    },
                ],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 5: Mock /register/v1.0/challenge - fast-pass (preverified)
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "jit-challenge-token",
                challenge_type: "preverified",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 6: Mock /register/v1.0/continue - fast-pass registration
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "jit-verified-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 7: Mock /oauth2/token - successful completion after fast-pass JIT registration
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => TestServerTokenResponse,
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Start sign-in with password
        const signInInputs = {
            username: "test@test.com",
            password: "password",
            correlationId: correlationId,
        };

        const result = await app.signIn(signInInputs);

        // Verify JIT registration is required
        expect(result).toBeInstanceOf(SignInResult);
        expect(result.error).toBeUndefined();
        expect(result.isAuthMethodRegistrationRequired()).toBe(true);

        const jitState = result.state as AuthMethodRegistrationRequiredState;

        // Challenge the email authentication method (same as sign-up email)
        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "user@contoso.com",
        });

        // Fast-pass should complete immediately
        expect(challengeResult).toBeInstanceOf(
            AuthMethodRegistrationChallengeMethodResult
        );
        expect(challengeResult.error).toBeUndefined();
        expect(challengeResult.isCompleted()).toBe(true);
        expect(challengeResult.data).toBeInstanceOf(CustomAuthAccountData);
    });

    it("should handle JIT registration error scenarios", async () => {
        // Step 1: Mock /oauth2/initiate - successful initiate
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-1",
                challenge_type: "oob password redirect",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /oauth2/challenge - password challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-2",
                challenge_type: "password",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /oauth2/token - JIT registration required response
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "invalid_grant",
                error_description:
                    "Strong authentication method registration is required.",
                suberror: "registration_required",
                continuation_token: "jit-continuation-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /register/v1.0/introspect - available authentication methods
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "jit-introspect-token",
                methods: [
                    {
                        id: "email",
                        login_hint: "user@contoso.com",
                    },
                ],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 5: Mock /register/v1.0/challenge - email challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "jit-challenge-token",
                challenge_type: "oob",
                challenge_channel: "email",
                challenge_target: "us**@co***so.com",
                code_length: 6,
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 6: Mock /register/v1.0/continue - incorrect verification code
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "invalid_grant",
                error_description: "The verification code is incorrect.",
                suberror: "incorrect_challenge",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Start sign-in with password
        const signInInputs = {
            username: "test@test.com",
            password: "password",
            correlationId: correlationId,
        };

        const result = await app.signIn(signInInputs);

        // Verify JIT registration is required
        expect(result.isAuthMethodRegistrationRequired()).toBe(true);

        const jitState = result.state as AuthMethodRegistrationRequiredState;

        // Challenge the email authentication method
        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "user@contoso.com",
        });

        expect(challengeResult.isVerificationRequired()).toBe(true);

        const verificationState =
            challengeResult.state as AuthMethodVerificationRequiredState;

        // Submit incorrect verification code
        const submitResult = await verificationState.submitChallenge(
            "wrong-code"
        );

        expect(submitResult).toBeInstanceOf(
            AuthMethodRegistrationSubmitChallengeResult
        );
        expect(submitResult.error).toBeDefined();
        expect(submitResult.isFailed()).toBe(true);
        expect(submitResult.error?.isIncorrectChallenge()).toBe(true);
    });

    it("should handle resending JIT verification code", async () => {
        // Step 1: Mock /oauth2/initiate - successful initiate
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-1",
                challenge_type: "oob password redirect",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /oauth2/challenge - password challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-2",
                challenge_type: "password",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /oauth2/token - JIT registration required response
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "invalid_grant",
                error_description:
                    "Strong authentication method registration is required.",
                suberror: "registration_required",
                continuation_token: "jit-continuation-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /register/v1.0/introspect - available authentication methods
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "jit-introspect-token",
                methods: [
                    {
                        id: "email",
                        login_hint: "user@contoso.com",
                    },
                ],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 5: Mock /register/v1.0/challenge - initial email challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "jit-challenge-token",
                challenge_type: "oob",
                challenge_channel: "email",
                challenge_target: "us**@co***so.com",
                code_length: 6,
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 6: Mock /register/v1.0/challenge - resend challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "jit-resend-token",
                challenge_type: "oob",
                challenge_channel: "email",
                challenge_target: "us**@co***so.com",
                code_length: 6,
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Start sign-in with password
        const signInInputs = {
            username: "test@test.com",
            password: "password",
            correlationId: correlationId,
        };

        const result = await app.signIn(signInInputs);

        // Verify JIT registration is required
        expect(result.isAuthMethodRegistrationRequired()).toBe(true);

        const jitState = result.state as AuthMethodRegistrationRequiredState;

        // Challenge the email authentication method
        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "user@contoso.com",
        });

        expect(challengeResult.isVerificationRequired()).toBe(true);

        const verificationState =
            challengeResult.state as AuthMethodVerificationRequiredState;

        // Resend the challenge (equivalent to calling challengeAuthMethod again)
        const resendResult = await verificationState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "user@contoso.com",
        });

        expect(resendResult).toBeInstanceOf(
            AuthMethodRegistrationChallengeMethodResult
        );
        expect(resendResult.error).toBeUndefined();
        expect(resendResult.isVerificationRequired()).toBe(true);
        expect(resendResult.state).toBeInstanceOf(
            AuthMethodVerificationRequiredState
        );

        const newVerificationState =
            resendResult.state as AuthMethodVerificationRequiredState;
        expect(newVerificationState.getChannel()).toBe("email");
        expect(newVerificationState.getSentTo()).toBe("us**@co***so.com");
        expect(newVerificationState.getCodeLength()).toBe(6);
    });

    it("should handle MFA required after signIn() and complete MFA flow", async () => {
        // Step 1: Mock /oauth2/initiate - successful initiate
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-1",
                challenge_type: "oob password redirect",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /oauth2/challenge - password challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-2",
                challenge_type: "password",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /oauth2/token - MFA required response
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "invalid_grant",
                error_description: "Multi-factor authentication is required.",
                suberror: "mfa_required",
                continuation_token: "mfa-continuation-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /oauth2/introspect - return available methods
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "method-selection-token",
                methods: [
                    {
                        id: "email-method-id",
                        challenge_type: "oob",
                        challenge_channel: "email",
                        login_hint: "jo**@co***so.com",
                    },
                    {
                        id: "sms-method-id",
                        challenge_type: "oob",
                        challenge_channel: "sms",
                        login_hint: "+1***5678",
                    },
                ],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 5: Mock /oauth2/challenge - MFA challenge request
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "mfa-challenge-token",
                challenge_type: "oob",
                challenge_channel: "email",
                challenge_target_label: "jo**@co***so.com",
                code_length: 6,
                binding_method: "prompt",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 6: Mock /oauth2/token - successful MFA completion
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => TestServerTokenResponse,
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Start sign-in with password
        const signInInputs = {
            username: "test@test.com",
            password: "password",
            correlationId: correlationId,
        };

        const result = await app.signIn(signInInputs);

        // Verify MFA is required
        expect(result).toBeInstanceOf(SignInResult);
        expect(result.error).toBeUndefined();
        expect(result.isMfaRequired()).toBe(true);
        expect(result.state).toBeInstanceOf(MfaAwaitingState);

        const mfaState = result.state as MfaAwaitingState;

        // Request MFA challenge
        const requestChallengeResult = await mfaState.requestChallenge(
            "email-method-id"
        );

        expect(requestChallengeResult).toBeInstanceOf(
            MfaRequestChallengeResult
        );
        expect(requestChallengeResult.error).toBeUndefined();
        expect(requestChallengeResult.isVerificationRequired()).toBe(true);
        expect(requestChallengeResult.state).toBeInstanceOf(
            MfaVerificationRequiredState
        );

        const verificationState =
            requestChallengeResult.state as MfaVerificationRequiredState;

        // Verify MFA verification state properties
        expect(verificationState.getChannel()).toBe("email");
        expect(verificationState.getSentTo()).toBe("jo**@co***so.com");
        expect(verificationState.getCodeLength()).toBe(6);

        // Submit MFA challenge
        const submitChallengeResult = await verificationState.submitChallenge(
            "123456"
        );

        expect(submitChallengeResult).toBeInstanceOf(MfaSubmitChallengeResult);
        expect(submitChallengeResult.error).toBeUndefined();
        expect(submitChallengeResult.isCompleted()).toBe(true);
        expect(submitChallengeResult.data).toBeInstanceOf(
            CustomAuthAccountData
        );
    });

    it("should handle MFA required after submitCode() and complete flow", async () => {
        // Step 1: Mock /oauth2/initiate - successful initiate
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-1",
                challenge_type: "oob password redirect",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /oauth2/challenge - oob challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-2",
                challenge_type: "oob",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /oauth2/token - MFA required response
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "invalid_grant",
                error_description: "Multi-factor authentication is required.",
                suberror: "mfa_required",
                continuation_token: "mfa-continuation-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /oauth2/introspect - return available methods
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "method-selection-token",
                methods: [
                    {
                        id: "01488-13...",
                        challenge_type: "oob",
                        challenge_channel: "email",
                        login_hint: "jo**@co***so.com",
                    },
                    {
                        id: "01489-14...",
                        challenge_type: "oob",
                        challenge_channel: "sms",
                        login_hint: "+1***5678",
                    },
                ],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 5: Mock /oauth2/challenge - MFA challenge request
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "mfa-challenge-token",
                challenge_type: "oob",
                challenge_channel: "sms",
                challenge_target_label: "000000***0000",
                code_length: 6,
                binding_method: "prompt",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 6: Mock /oauth2/token - successful MFA completion
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => TestServerTokenResponse,
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Start sign-in without password
        const signInInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const signInResult = await app.signIn(signInInputs);

        // Verify password is required
        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.isCodeRequired()).toBe(true);

        const codeState = signInResult.state as SignInCodeRequiredState;

        // Submit code - should trigger MFA
        const submitCodeResult = await codeState.submitCode("123456");

        // Verify MFA is required after code submission
        expect(submitCodeResult).toBeInstanceOf(SignInSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.isMfaRequired()).toBe(true);
        expect(submitCodeResult.state).toBeInstanceOf(MfaAwaitingState);

        const mfaState = submitCodeResult.state as MfaAwaitingState;

        // Request MFA challenge
        const requestChallengeResult = await mfaState.requestChallenge(
            "sms-method-id"
        );

        expect(requestChallengeResult).toBeInstanceOf(
            MfaRequestChallengeResult
        );
        expect(requestChallengeResult.error).toBeUndefined();
        expect(requestChallengeResult.isVerificationRequired()).toBe(true);

        const verificationState =
            requestChallengeResult.state as MfaVerificationRequiredState;

        // Submit MFA challenge
        const submitChallengeResult = await verificationState.submitChallenge(
            "123456"
        );

        expect(submitChallengeResult).toBeInstanceOf(MfaSubmitChallengeResult);
        expect(submitChallengeResult.error).toBeUndefined();
        expect(submitChallengeResult.isCompleted()).toBe(true);
        expect(submitChallengeResult.data).toBeInstanceOf(
            CustomAuthAccountData
        );
    });

    it("should handle MFA required after submitPassword() and complete flow", async () => {
        // Step 1: Mock /oauth2/initiate - successful initiate
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-1",
                challenge_type: "oob password redirect",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /oauth2/challenge - password challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-2",
                challenge_type: "password",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /oauth2/token - MFA required response
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "invalid_grant",
                error_description: "Multi-factor authentication is required.",
                suberror: "mfa_required",
                continuation_token: "mfa-continuation-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /oauth2/introspect - return available methods
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "method-selection-token",
                methods: [
                    {
                        id: "01488-13...",
                        challenge_type: "oob",
                        challenge_channel: "email",
                        login_hint: "jo**@co***so.com",
                    },
                    {
                        id: "01489-14...",
                        challenge_type: "oob",
                        challenge_channel: "sms",
                        login_hint: "+1***5678",
                    },
                ],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 5: Mock /oauth2/challenge - MFA challenge request
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "mfa-challenge-token",
                challenge_type: "oob",
                challenge_channel: "email",
                challenge_target_label: "jo**@co***so.com",
                code_length: 6,
                binding_method: "prompt",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 6: Mock /oauth2/token - successful MFA completion
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => TestServerTokenResponse,
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Start sign-in without password
        const signInInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const signInResult = await app.signIn(signInInputs);

        // Verify password is required
        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.isPasswordRequired()).toBe(true);

        const passwordState = signInResult.state as SignInPasswordRequiredState;

        // Submit password - should trigger MFA
        const submitPasswordResult = await passwordState.submitPassword(
            "password"
        );

        // Verify MFA is required after password submission
        expect(submitPasswordResult).toBeInstanceOf(SignInSubmitPasswordResult);
        expect(submitPasswordResult.error).toBeUndefined();
        expect(submitPasswordResult.isMfaRequired()).toBe(true);
        expect(submitPasswordResult.state).toBeInstanceOf(MfaAwaitingState);

        const mfaState = submitPasswordResult.state as MfaAwaitingState;

        // Request MFA challenge
        const requestChallengeResult = await mfaState.requestChallenge(
            "email-method-id"
        );

        expect(requestChallengeResult).toBeInstanceOf(
            MfaRequestChallengeResult
        );
        expect(requestChallengeResult.error).toBeUndefined();
        expect(requestChallengeResult.isVerificationRequired()).toBe(true);

        const verificationState =
            requestChallengeResult.state as MfaVerificationRequiredState;

        // Submit MFA challenge
        const submitChallengeResult = await verificationState.submitChallenge(
            "123456"
        );

        expect(submitChallengeResult).toBeInstanceOf(MfaSubmitChallengeResult);
        expect(submitChallengeResult.error).toBeUndefined();
        expect(submitChallengeResult.isCompleted()).toBe(true);
        expect(submitChallengeResult.data).toBeInstanceOf(
            CustomAuthAccountData
        );

        // Clean up
        submitChallengeResult.data?.signOut();
    });

    it("should handle MFA errors - invalid MFA code", async () => {
        // Step 1: Mock /oauth2/initiate - successful initiate
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-1",
                challenge_type: "oob password redirect",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /oauth2/challenge - password challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-2",
                challenge_type: "password",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /oauth2/token - MFA required response
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "invalid_grant",
                error_description: "Multi-factor authentication is required.",
                suberror: "mfa_required",
                continuation_token: "mfa-continuation-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /oauth2/introspect - return available methods
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "method-selection-token",
                methods: [
                    {
                        id: "email-method-id",
                        challenge_type: "oob",
                        challenge_channel: "email",
                        login_hint: "jo**@co***so.com",
                    },
                    {
                        id: "sms-method-id",
                        challenge_type: "oob",
                        challenge_channel: "sms",
                        login_hint: "+1***5678",
                    },
                ],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 5: Mock /oauth2/challenge - MFA challenge request
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "mfa-challenge-token",
                challenge_type: "oob",
                challenge_channel: "email",
                challenge_target_label: "jo**@co***so.com",
                code_length: 6,
                binding_method: "prompt",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 6: Mock /oauth2/token - invalid MFA code response
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "invalid_grant",
                error_description: "The verification code is incorrect.",
                suberror: "invalid_oob_value",
                error_codes: [50125],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Start sign-in with password
        const signInInputs = {
            username: "test@test.com",
            password: "password",
            correlationId: correlationId,
        };

        const result = await app.signIn(signInInputs);

        // Verify MFA is required
        expect(result).toBeInstanceOf(SignInResult);
        expect(result.error).toBeUndefined();
        expect(result.isMfaRequired()).toBe(true);
        expect(result.state).toBeInstanceOf(MfaAwaitingState);

        const mfaState = result.state as MfaAwaitingState;

        // Request MFA challenge
        const requestChallengeResult = await mfaState.requestChallenge(
            "email-method-id"
        );

        expect(requestChallengeResult).toBeInstanceOf(
            MfaRequestChallengeResult
        );
        expect(requestChallengeResult.error).toBeUndefined();
        expect(requestChallengeResult.isVerificationRequired()).toBe(true);
        expect(requestChallengeResult.state).toBeInstanceOf(
            MfaVerificationRequiredState
        );

        const verificationState =
            requestChallengeResult.state as MfaVerificationRequiredState;

        // Verify MFA verification state properties
        expect(verificationState.getChannel()).toBe("email");
        expect(verificationState.getSentTo()).toBe("jo**@co***so.com");
        expect(verificationState.getCodeLength()).toBe(6);

        // Submit MFA challenge
        const submitChallengeResult = await verificationState.submitChallenge(
            "000000"
        );

        expect(submitChallengeResult).toBeInstanceOf(MfaSubmitChallengeResult);
        expect(submitChallengeResult.error).toBeDefined();
        expect(submitChallengeResult.isFailed()).toBe(true);
        expect(submitChallengeResult.error?.isIncorrectChallenge()).toBe(true);
    });

    it("should handle MFA errors - challenge request failure", async () => {
        // Step 1: Mock /oauth2/initiate - successful initiate
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-1",
                challenge_type: "oob password redirect",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /oauth2/challenge - password challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-2",
                challenge_type: "password",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /oauth2/token - MFA required response
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "invalid_grant",
                error_description: "Multi-factor authentication is required.",
                suberror: "mfa_required",
                continuation_token: "mfa-continuation-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /oauth2/introspect - return available methods
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "method-selection-token",
                methods: [
                    {
                        id: "email-method-id",
                        challenge_type: "oob",
                        challenge_channel: "email",
                        login_hint: "jo**@co***so.com",
                    },
                    {
                        id: "sms-method-id",
                        challenge_type: "oob",
                        challenge_channel: "sms",
                        login_hint: "+1***5678",
                    },
                ],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 5: Mock /oauth2/challenge - challenge request failure
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "invalid_request",
                error_description: "Failed to send challenge.",
                error_codes: [90210],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Start sign-in with password
        const signInInputs = {
            username: "test@test.com",
            password: "password",
            correlationId: correlationId,
        };

        const result = await app.signIn(signInInputs);

        // Verify MFA is required
        expect(result).toBeInstanceOf(SignInResult);
        expect(result.error).toBeUndefined();
        expect(result.isMfaRequired()).toBe(true);
        expect(result.state).toBeInstanceOf(MfaAwaitingState);

        const mfaState = result.state as MfaAwaitingState;

        // Request MFA challenge
        const requestChallengeResult = await mfaState.requestChallenge(
            "email-method-id"
        );

        expect(requestChallengeResult).toBeInstanceOf(
            MfaRequestChallengeResult
        );
        expect(requestChallengeResult.error).toBeDefined();
        expect(requestChallengeResult.isFailed()).toBe(true);
        expect(requestChallengeResult.error?.errorData?.error).toBe(
            "invalid_request"
        );
    });

    it("should handle resend challenge in MfaVerificationRequiredState", async () => {
        // Step 1: Mock /oauth2/initiate - successful initiate
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-1",
                challenge_type: "oob password redirect",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /oauth2/challenge - password challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-2",
                challenge_type: "password",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /oauth2/token - MFA required response
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "invalid_grant",
                error_description: "Multi-factor authentication is required.",
                suberror: "mfa_required",
                continuation_token: "mfa-continuation-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /oauth2/introspect - return available methods
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "method-selection-token",
                methods: [
                    {
                        id: "email-method-id",
                        challenge_type: "oob",
                        challenge_channel: "email",
                        login_hint: "jo**@co***so.com",
                    },
                    {
                        id: "sms-method-id",
                        challenge_type: "oob",
                        challenge_channel: "sms",
                        login_hint: "+1***5678",
                    },
                ],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 5: Mock /oauth2/challenge - initial MFA challenge request
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "mfa-challenge-token",
                challenge_type: "oob",
                challenge_channel: "email",
                challenge_target_label: "jo**@co***so.com",
                code_length: 6,
                binding_method: "prompt",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 6: Mock /oauth2/challenge - resend challenge request
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "mfa-resend-token",
                challenge_type: "oob",
                challenge_channel: "email",
                challenge_target_label: "jo**@co***so.com",
                code_length: 6,
                binding_method: "prompt",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Start sign-in with password
        const signInInputs = {
            username: "test@test.com",
            password: "password",
            correlationId: correlationId,
        };

        const result = await app.signIn(signInInputs);

        // Verify MFA is required
        expect(result).toBeInstanceOf(SignInResult);
        expect(result.error).toBeUndefined();
        expect(result.isMfaRequired()).toBe(true);

        const mfaState = result.state as MfaAwaitingState;

        // Request MFA challenge
        const requestChallengeResult = await mfaState.requestChallenge(
            "email-method-id"
        );

        expect(requestChallengeResult).toBeInstanceOf(
            MfaRequestChallengeResult
        );
        expect(requestChallengeResult.error).toBeUndefined();
        expect(requestChallengeResult.isVerificationRequired()).toBe(true);

        const verificationState =
            requestChallengeResult.state as MfaVerificationRequiredState;

        // Resend challenge (equivalent to calling requestChallenge again)
        const resendResult = await verificationState.requestChallenge(
            "email-method-id"
        );

        expect(resendResult).toBeInstanceOf(MfaRequestChallengeResult);
        expect(resendResult.error).toBeUndefined();
        expect(resendResult.isVerificationRequired()).toBe(true);
        expect(resendResult.state).toBeInstanceOf(MfaVerificationRequiredState);

        const newVerificationState =
            resendResult.state as MfaVerificationRequiredState;
        expect(newVerificationState.getChannel()).toBe("email");
        expect(newVerificationState.getSentTo()).toBe("jo**@co***so.com");
        expect(newVerificationState.getCodeLength()).toBe(6);
    });
});
