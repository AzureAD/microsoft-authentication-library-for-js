/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthAccountData } from "../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { CustomAuthPublicClientApplication } from "../../../src/custom_auth/CustomAuthPublicClientApplication.js";
import { ResetPasswordStartResult } from "../../../src/custom_auth/reset_password/auth_flow/result/ResetPasswordStartResult.js";
import { ResetPasswordSubmitCodeResult } from "../../../src/custom_auth/reset_password/auth_flow/result/ResetPasswordSubmitCodeResult.js";
import { ResetPasswordSubmitPasswordResult } from "../../../src/custom_auth/reset_password/auth_flow/result/ResetPasswordSubmitPasswordResult.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { SignInResult } from "../../../src/custom_auth/sign_in/auth_flow/result/SignInResult.js";
import { CustomAuthStandardController } from "../../../src/custom_auth/controller/CustomAuthStandardController.js";
import { ResetPasswordCodeRequiredState } from "../../../src/custom_auth/reset_password/auth_flow/state/ResetPasswordCodeRequiredState.js";
import { ResetPasswordPasswordRequiredState } from "../../../src/custom_auth/reset_password/auth_flow/state/ResetPasswordPasswordRequiredState.js";
import { ResetPasswordCompletedState } from "../../../src/custom_auth/reset_password/auth_flow/state/ResetPasswordCompletedState.js";
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

describe("Reset password", () => {
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

    it("should reset password successfully if the new password is valid", async () => {
        (fetch as jest.Mock)
            // Step 1: Mock /resetpassword/v1.0/start - successful start
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-1",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 2: Mock /resetpassword/v1.0/challenge - successful challenge
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-2",
                        challenge_type: "oob",
                        binding_method: "prompt",
                        challenge_channel: "email",
                        challenge_target_label: "s****n@o*********m",
                        code_length: 8,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 3: Mock /resetpassword/v1.0/continue - submit code successfully
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-3",
                        expires_in: 600,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 4: Mock /resetpassword/v1.0/submit - successful submit password
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-4",
                        poll_interval: 1,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 5: Mock /resetpassword/v1.0/poll_completion - poll once and still in progress
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        status: "in_progress",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 6: Mock /resetpassword/v1.0/poll_completion - poll twice and still in progress
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        status: "in_progress",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 7: Mock /resetpassword/v1.0/poll_completion - poll three times and succeeded
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-5",
                        status: "succeeded",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 8: Mock /oauth/v2.0/token - acquire tokens
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return TestServerTokenResponse;
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            });

        const resetPasswordInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const startResult = await app.resetPassword(resetPasswordInputs);

        expect(startResult).toBeInstanceOf(ResetPasswordStartResult);
        expect(startResult.error).toBeUndefined();
        expect(startResult.isCodeRequired()).toBe(true);

        const submitCodeResult = await (
            startResult.state as ResetPasswordCodeRequiredState
        ).submitCode("12345678");

        expect(submitCodeResult).toBeInstanceOf(ResetPasswordSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.isPasswordRequired()).toBe(true);

        const submitPasswordResult = await (
            submitCodeResult.state as ResetPasswordPasswordRequiredState
        ).submitNewPassword("valid-password");

        expect(submitPasswordResult).toBeInstanceOf(
            ResetPasswordSubmitPasswordResult
        );
        expect(submitPasswordResult.error).toBeUndefined();
        expect(submitPasswordResult.isCompleted()).toBe(true);

        const signInResult = await (
            submitPasswordResult.state as ResetPasswordCompletedState
        ).signIn();

        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.isCompleted()).toBe(true);
        expect(signInResult.data).toBeDefined();
        expect(signInResult.data).toBeInstanceOf(CustomAuthAccountData);
        expect(signInResult.data?.getAccount()?.idToken).toStrictEqual(
            TestServerTokenResponse.id_token
        );
    });

    it("should sign in with custom claims after reset password successfully", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-1",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-2",
                        challenge_type: "oob",
                        binding_method: "prompt",
                        challenge_channel: "email",
                        challenge_target_label: "s****n@o*********m",
                        code_length: 8,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-3",
                        expires_in: 600,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-4",
                        poll_interval: 1,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        status: "in_progress",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        status: "in_progress",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-5",
                        status: "succeeded",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return TestServerTokenResponse;
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            });

        const resetPasswordInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const startResult = await app.resetPassword(resetPasswordInputs);

        expect(startResult).toBeInstanceOf(ResetPasswordStartResult);
        expect(startResult.error).toBeUndefined();
        expect(startResult.isCodeRequired()).toBe(true);

        const submitCodeResult = await (
            startResult.state as ResetPasswordCodeRequiredState
        ).submitCode("12345678");

        expect(submitCodeResult).toBeInstanceOf(ResetPasswordSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.isPasswordRequired()).toBe(true);

        const submitPasswordResult = await (
            submitCodeResult.state as ResetPasswordPasswordRequiredState
        ).submitNewPassword("valid-password");

        expect(submitPasswordResult).toBeInstanceOf(
            ResetPasswordSubmitPasswordResult
        );
        expect(submitPasswordResult.error).toBeUndefined();
        expect(submitPasswordResult.isCompleted()).toBe(true);

        const claims = JSON.stringify({
            access_token: {
                acrs: {
                    essential: true,
                    value: "c1",
                },
            },
        });

        const signInResult = await (
            submitPasswordResult.state as ResetPasswordCompletedState
        ).signIn({
            claims: claims,
        });

        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.isCompleted()).toBe(true);
        expect(signInResult.data).toBeDefined();
        expect(signInResult.data).toBeInstanceOf(CustomAuthAccountData);
        expect(signInResult.data?.getAccount()?.idToken).toStrictEqual(
            TestServerTokenResponse.id_token
        );
    });

    it("should reset password failed if the redirect challenge returned", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-1",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        challenge_type: "redirect",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            });

        const resetPasswordInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const startResult = await app.resetPassword(resetPasswordInputs);

        expect(startResult).toBeInstanceOf(ResetPasswordStartResult);
        expect(startResult.error).toBeDefined();
        expect(startResult.isFailed()).toBe(true);
        expect(startResult.error?.isRedirectRequired()).toBe(true);
    });

    it("should reset password failed if the given user is not found", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => {
                return {
                    error: "user_not_found",
                    error_description:
                        "The user account could not be found. Please check the username and try again.",
                    error_codes: [1003037],
                    timestamp: "yyyy-mm-dd 10:15:00Z",
                    trace_id: "test-trace-id",
                    correlation_id: correlationId,
                };
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        const resetPasswordInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const startResult = await app.resetPassword(resetPasswordInputs);

        expect(startResult).toBeInstanceOf(ResetPasswordStartResult);
        expect(startResult.error).toBeDefined();
        expect(startResult.isFailed()).toBe(true);
        expect(startResult.error?.isUserNotFound()).toBe(true);
    });

    it("should handle JIT registration required with email during reset password flow sign in", async () => {
        (fetch as jest.Mock)
            // Step 1: Mock /resetpassword/v1.0/start - successful start
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-1",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 2: Mock /resetpassword/v1.0/challenge - successful challenge
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-2",
                        challenge_type: "oob",
                        binding_method: "prompt",
                        challenge_channel: "email",
                        challenge_target_label: "s****n@o*********m",
                        code_length: 8,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 3: Mock /resetpassword/v1.0/continue - submit code successfully
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-3",
                        expires_in: 600,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 4: Mock /resetpassword/v1.0/submit - successful submit password
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-4",
                        poll_interval: 1,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 5: Mock /resetpassword/v1.0/poll_completion - poll and succeeded
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-5",
                        status: "succeeded",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 6: Mock /oauth/v2.0/token - returns registration_required error
            .mockResolvedValueOnce({
                status: 400,
                json: async () => {
                    return {
                        error: "invalid_grant",
                        error_description:
                            "AADSTS50076: Strong authentication is required.",
                        error_codes: [50076],
                        suberror: "registration_required",
                        timestamp: "yyyy-mm-dd 10:15:00Z",
                        trace_id: "test-trace-id",
                        correlation_id: correlationId,
                        continuation_token: "jit-continuation-token-1",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            // Step 7: Mock /register/v1.0/introspect - get available auth methods
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "jit-continuation-token-2",
                        methods: [
                            {
                                id: "email",
                                challenge_type: "oob",
                                challenge_channel: "email",
                                login_hint: "user@example.com",
                            },
                        ],
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 8: Mock /register/v1.0/challenge - challenge auth method
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "jit-continuation-token-3",
                        challenge_type: "oob",
                        binding_method: "prompt",
                        challenge_target: "user@example.com",
                        challenge_channel: "email",
                        code_length: 6,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 9: Mock /register/v1.0/continue - submit challenge
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "jit-continuation-token-4",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 10: Mock /oauth/v2.0/token - successful token acquisition
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return TestServerTokenResponse;
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            });

        const resetPasswordInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        // Complete reset password flow
        const startResult = await app.resetPassword(resetPasswordInputs);
        expect(startResult.isCodeRequired()).toBe(true);

        const submitCodeResult = await (
            startResult.state as ResetPasswordCodeRequiredState
        ).submitCode("12345678");
        expect(submitCodeResult.isPasswordRequired()).toBe(true);

        const submitPasswordResult = await (
            submitCodeResult.state as ResetPasswordPasswordRequiredState
        ).submitNewPassword("valid-password");
        expect(submitPasswordResult.isCompleted()).toBe(true);

        // Attempt sign in - should trigger JIT
        const signInResult = await (
            submitPasswordResult.state as ResetPasswordCompletedState
        ).signIn();

        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.isAuthMethodRegistrationRequired()).toBe(true);

        const jitState =
            signInResult.state as AuthMethodRegistrationRequiredState;
        expect(jitState.getAuthMethods()).toHaveLength(1);
        expect(jitState.getAuthMethods()[0].id).toBe("email");

        // Challenge the authentication method
        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "user@example.com",
        });

        expect(challengeResult).toBeInstanceOf(
            AuthMethodRegistrationChallengeMethodResult
        );
        expect(challengeResult.error).toBeUndefined();
        expect(challengeResult.isVerificationRequired()).toBe(true);

        const verificationState =
            challengeResult.state as AuthMethodVerificationRequiredState;
        expect(verificationState.getCodeLength()).toBe(6);
        expect(verificationState.getChannel()).toBe("email");
        expect(verificationState.getSentTo()).toBe("user@example.com");

        // Submit the verification challenge
        const submitChallengeResult = await verificationState.submitChallenge(
            "123456"
        );

        expect(submitChallengeResult).toBeInstanceOf(
            AuthMethodRegistrationSubmitChallengeResult
        );
        expect(submitChallengeResult.error).toBeUndefined();
        expect(submitChallengeResult.isCompleted()).toBe(true);
        expect(submitChallengeResult.data).toBeDefined();
        expect(submitChallengeResult.data).toBeInstanceOf(
            CustomAuthAccountData
        );
    });

    it("should handle JIT registration required with SMS during reset password flow sign in", async () => {
        (fetch as jest.Mock)
            // Step 1: Mock /resetpassword/v1.0/start - successful start
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-1",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 2: Mock /resetpassword/v1.0/challenge - successful challenge
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-2",
                        challenge_type: "oob",
                        binding_method: "prompt",
                        challenge_channel: "email",
                        challenge_target_label: "s****n@o*********m",
                        code_length: 8,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 3: Mock /resetpassword/v1.0/continue - submit code successfully
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-3",
                        expires_in: 600,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 4: Mock /resetpassword/v1.0/submit - successful submit password
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-4",
                        poll_interval: 1,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 5: Mock /resetpassword/v1.0/poll_completion - poll and succeeded
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-5",
                        status: "succeeded",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 6: Mock /oauth/v2.0/token - returns registration_required error
            .mockResolvedValueOnce({
                status: 400,
                json: async () => {
                    return {
                        error: "invalid_grant",
                        error_description:
                            "AADSTS50076: Strong authentication is required.",
                        error_codes: [50076],
                        suberror: "registration_required",
                        timestamp: "yyyy-mm-dd 10:15:00Z",
                        trace_id: "test-trace-id",
                        correlation_id: correlationId,
                        continuation_token: "jit-continuation-token-1",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            // Step 7: Mock /register/v1.0/introspect - get available auth methods
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "jit-continuation-token-2",
                        methods: [
                            {
                                id: "sms",
                                challenge_type: "oob",
                                challenge_channel: "sms",
                                login_hint: "000000000",
                            },
                        ],
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 8: Mock /register/v1.0/challenge - challenge auth method
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "jit-continuation-token-3",
                        challenge_type: "oob",
                        binding_method: "prompt",
                        challenge_target: "000000000",
                        challenge_channel: "sms",
                        code_length: 6,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 9: Mock /register/v1.0/continue - submit challenge
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "jit-continuation-token-4",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 10: Mock /oauth/v2.0/token - successful token acquisition
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return TestServerTokenResponse;
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            });

        const resetPasswordInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        // Complete reset password flow
        const startResult = await app.resetPassword(resetPasswordInputs);
        expect(startResult.isCodeRequired()).toBe(true);

        const submitCodeResult = await (
            startResult.state as ResetPasswordCodeRequiredState
        ).submitCode("12345678");
        expect(submitCodeResult.isPasswordRequired()).toBe(true);

        const submitPasswordResult = await (
            submitCodeResult.state as ResetPasswordPasswordRequiredState
        ).submitNewPassword("valid-password");
        expect(submitPasswordResult.isCompleted()).toBe(true);

        // Attempt sign in - should trigger JIT
        const signInResult = await (
            submitPasswordResult.state as ResetPasswordCompletedState
        ).signIn();

        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.isAuthMethodRegistrationRequired()).toBe(true);

        const jitState =
            signInResult.state as AuthMethodRegistrationRequiredState;
        expect(jitState.getAuthMethods()).toHaveLength(1);
        expect(jitState.getAuthMethods()[0].id).toBe("sms");

        // Challenge the authentication method
        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "000000000",
        });

        expect(challengeResult).toBeInstanceOf(
            AuthMethodRegistrationChallengeMethodResult
        );
        expect(challengeResult.error).toBeUndefined();
        expect(challengeResult.isVerificationRequired()).toBe(true);

        const verificationState =
            challengeResult.state as AuthMethodVerificationRequiredState;
        expect(verificationState.getCodeLength()).toBe(6);
        expect(verificationState.getChannel()).toBe("sms");
        expect(verificationState.getSentTo()).toBe("000000000");

        // Submit the verification challenge
        const submitChallengeResult = await verificationState.submitChallenge(
            "123456"
        );

        expect(submitChallengeResult).toBeInstanceOf(
            AuthMethodRegistrationSubmitChallengeResult
        );
        expect(submitChallengeResult.error).toBeUndefined();
        expect(submitChallengeResult.isCompleted()).toBe(true);
        expect(submitChallengeResult.data).toBeDefined();
        expect(submitChallengeResult.data).toBeInstanceOf(
            CustomAuthAccountData
        );
    });

    it("should handle JIT fast-pass scenario during reset password flow sign in", async () => {
        (fetch as jest.Mock)
            // Reset password flow mocks (Steps 1-5)
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-1",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-2",
                    challenge_type: "oob",
                    binding_method: "prompt",
                    challenge_channel: "email",
                    challenge_target_label: "s****n@o*********m",
                    code_length: 8,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-3",
                    expires_in: 600,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-4",
                    poll_interval: 1,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-5",
                    status: "succeeded",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // JIT flow mocks
            .mockResolvedValueOnce({
                status: 400,
                json: async () => ({
                    error: "invalid_grant",
                    error_description:
                        "AADSTS50076: Strong authentication is required.",
                    error_codes: [50076],
                    suberror: "registration_required",
                    timestamp: "yyyy-mm-dd 10:15:00Z",
                    trace_id: "test-trace-id",
                    correlation_id: correlationId,
                    continuation_token: "jit-continuation-token-1",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "jit-continuation-token-2",
                    methods: [
                        {
                            id: "email",
                            challenge_type: "oob",
                            challenge_channel: "email",
                            login_hint: "test@test.com", // Same email as reset password
                        },
                    ],
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Fast-pass challenge response
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "jit-continuation-token-3",
                    challenge_type: "preverified", // Fast-pass scenario
                    binding_method: "none",
                    challenge_target: "test@test.com",
                    challenge_channel: "email",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Fast-pass continue response
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "jit-continuation-token-4",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Token acquisition after fast-pass
            .mockResolvedValueOnce({
                status: 200,
                json: async () => TestServerTokenResponse,
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            });

        const resetPasswordInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        // Complete reset password flow
        const startResult = await app.resetPassword(resetPasswordInputs);
        const submitCodeResult = await (
            startResult.state as ResetPasswordCodeRequiredState
        ).submitCode("12345678");
        const submitPasswordResult = await (
            submitCodeResult.state as ResetPasswordPasswordRequiredState
        ).submitNewPassword("valid-password");

        // Attempt sign in - should trigger JIT
        const signInResult = await (
            submitPasswordResult.state as ResetPasswordCompletedState
        ).signIn();

        expect(signInResult.isAuthMethodRegistrationRequired()).toBe(true);

        const jitState =
            signInResult.state as AuthMethodRegistrationRequiredState;

        // Challenge the same email as reset password (fast-pass scenario)
        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "test@test.com", // Same email as reset password
        });

        // Fast-pass should complete immediately
        expect(challengeResult).toBeInstanceOf(
            AuthMethodRegistrationChallengeMethodResult
        );
        expect(challengeResult.error).toBeUndefined();
        expect(challengeResult.isCompleted()).toBe(true);
        expect(challengeResult.data).toBeInstanceOf(CustomAuthAccountData);
    });

    it("should handle incorrect verification contact during JIT registration", async () => {
        (fetch as jest.Mock)
            // Reset password flow mocks (abbreviated)
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-1",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-2",
                    challenge_type: "oob",
                    binding_method: "prompt",
                    challenge_channel: "email",
                    challenge_target_label: "s****n@o*********m",
                    code_length: 8,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-3",
                    expires_in: 600,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-4",
                    poll_interval: 1,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-5",
                    status: "succeeded",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // JIT registration_required error
            .mockResolvedValueOnce({
                status: 400,
                json: async () => ({
                    error: "invalid_grant",
                    error_description:
                        "AADSTS50076: Strong authentication is required.",
                    error_codes: [50076],
                    suberror: "registration_required",
                    continuation_token: "jit-continuation-token-1",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            // JIT introspect
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "jit-continuation-token-2",
                    methods: [
                        {
                            id: "email",
                            challenge_type: "oob",
                            challenge_channel: "email",
                            login_hint: "user@example.com",
                        },
                    ],
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Challenge with incorrect contact
            .mockResolvedValueOnce({
                status: 400,
                json: async () => ({
                    error: "invalid_request",
                    error_description: "The verification contact is incorrect.",
                    error_codes: [901001],
                    timestamp: "yyyy-mm-dd 10:15:00Z",
                    trace_id: "test-trace-id",
                    correlation_id: correlationId,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            });

        const resetPasswordInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        // Complete reset password flow
        const startResult = await app.resetPassword(resetPasswordInputs);
        const submitCodeResult = await (
            startResult.state as ResetPasswordCodeRequiredState
        ).submitCode("12345678");
        const submitPasswordResult = await (
            submitCodeResult.state as ResetPasswordPasswordRequiredState
        ).submitNewPassword("valid-password");

        const signInResult = await (
            submitPasswordResult.state as ResetPasswordCompletedState
        ).signIn();
        const jitState =
            signInResult.state as AuthMethodRegistrationRequiredState;

        // Challenge with incorrect verification contact
        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "wrong@example.com", // Incorrect email
        });

        expect(challengeResult).toBeInstanceOf(
            AuthMethodRegistrationChallengeMethodResult
        );
        expect(challengeResult.error).toBeDefined();
        expect(challengeResult.isFailed()).toBe(true);
        expect(challengeResult.error?.isInvalidInput()).toBe(true);
    });

    it("should handle incorrect challenge code during JIT verification", async () => {
        (fetch as jest.Mock)
            // Reset password and JIT setup mocks (abbreviated)
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-1",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-2",
                    challenge_type: "oob",
                    binding_method: "prompt",
                    challenge_channel: "email",
                    challenge_target_label: "s****n@o*********m",
                    code_length: 8,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-3",
                    expires_in: 600,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-4",
                    poll_interval: 1,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-5",
                    status: "succeeded",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 400,
                json: async () => ({
                    error: "invalid_grant",
                    suberror: "registration_required",
                    continuation_token: "jit-continuation-token-1",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "jit-continuation-token-2",
                    methods: [
                        {
                            id: "email",
                            challenge_type: "oob",
                            challenge_channel: "email",
                            login_hint: "user@example.com",
                        },
                    ],
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "jit-continuation-token-3",
                    challenge_type: "oob",
                    binding_method: "prompt",
                    challenge_target: "user@example.com",
                    challenge_channel: "email",
                    code_length: 6,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Incorrect challenge code
            .mockResolvedValueOnce({
                status: 400,
                json: async () => ({
                    error: "invalid_grant",
                    error_description:
                        "The out-of-band authentication is incorrect.",
                    error_codes: [50076],
                    timestamp: "yyyy-mm-dd 10:15:00Z",
                    trace_id: "test-trace-id",
                    correlation_id: correlationId,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            });

        const resetPasswordInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        // Complete reset password and JIT challenge
        const startResult = await app.resetPassword(resetPasswordInputs);
        const submitCodeResult = await (
            startResult.state as ResetPasswordCodeRequiredState
        ).submitCode("12345678");
        const submitPasswordResult = await (
            submitCodeResult.state as ResetPasswordPasswordRequiredState
        ).submitNewPassword("valid-password");
        const signInResult = await (
            submitPasswordResult.state as ResetPasswordCompletedState
        ).signIn();
        const jitState =
            signInResult.state as AuthMethodRegistrationRequiredState;

        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "user@example.com",
        });

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

    it("should handle resending JIT verification code during reset password flow", async () => {
        (fetch as jest.Mock)
            // Reset password setup (abbreviated)
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-1",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-2",
                    challenge_type: "oob",
                    binding_method: "prompt",
                    challenge_channel: "email",
                    challenge_target_label: "s****n@o*********m",
                    code_length: 8,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-3",
                    expires_in: 600,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-4",
                    poll_interval: 1,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-5",
                    status: "succeeded",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // JIT registration flow
            .mockResolvedValueOnce({
                status: 400,
                json: async () => ({
                    error: "invalid_grant",
                    suberror: "registration_required",
                    continuation_token: "jit-continuation-token-1",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "jit-continuation-token-2",
                    methods: [
                        {
                            id: "email",
                            challenge_type: "oob",
                            challenge_channel: "email",
                            login_hint: "user@example.com",
                        },
                    ],
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Initial challenge
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "jit-continuation-token-3",
                    challenge_type: "oob",
                    binding_method: "prompt",
                    challenge_target: "user@example.com",
                    challenge_channel: "email",
                    code_length: 6,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Resend challenge
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "jit-continuation-token-4",
                    challenge_type: "oob",
                    binding_method: "prompt",
                    challenge_target: "user@example.com",
                    challenge_channel: "email",
                    code_length: 6,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Submit correct code after resend
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "jit-continuation-token-5",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => TestServerTokenResponse,
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            });

        const resetPasswordInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        // Complete reset password and get to JIT verification
        const startResult = await app.resetPassword(resetPasswordInputs);
        const submitCodeResult = await (
            startResult.state as ResetPasswordCodeRequiredState
        ).submitCode("12345678");
        const submitPasswordResult = await (
            submitCodeResult.state as ResetPasswordPasswordRequiredState
        ).submitNewPassword("valid-password");
        const signInResult = await (
            submitPasswordResult.state as ResetPasswordCompletedState
        ).signIn();
        const jitState =
            signInResult.state as AuthMethodRegistrationRequiredState;

        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "user@example.com",
        });

        const verificationState =
            challengeResult.state as AuthMethodVerificationRequiredState;

        // Resend verification code
        const resendResult = await verificationState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "user@example.com",
        });

        expect(resendResult).toBeInstanceOf(
            AuthMethodRegistrationChallengeMethodResult
        );
        expect(resendResult.error).toBeUndefined();
        expect(resendResult.isVerificationRequired()).toBe(true);

        const newVerificationState =
            resendResult.state as AuthMethodVerificationRequiredState;

        // Submit the verification code
        const submitResult = await newVerificationState.submitChallenge(
            "123456"
        );

        expect(submitResult).toBeInstanceOf(
            AuthMethodRegistrationSubmitChallengeResult
        );
        expect(submitResult.error).toBeUndefined();
        expect(submitResult.isCompleted()).toBe(true);
        expect(submitResult.data).toBeInstanceOf(CustomAuthAccountData);
    });

    it("should handle redirect required error during JIT registration", async () => {
        (fetch as jest.Mock)
            // Reset password setup
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-1",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-2",
                    challenge_type: "oob",
                    binding_method: "prompt",
                    challenge_channel: "email",
                    challenge_target_label: "s****n@o*********m",
                    code_length: 8,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-3",
                    expires_in: 600,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-4",
                    poll_interval: 1,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-5",
                    status: "succeeded",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // JIT registration_required
            .mockResolvedValueOnce({
                status: 400,
                json: async () => ({
                    error: "invalid_grant",
                    suberror: "registration_required",
                    continuation_token: "jit-continuation-token-1",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "jit-continuation-token-2",
                    methods: [
                        {
                            id: "email",
                            challenge_type: "oob",
                            challenge_channel: "email",
                            login_hint: "user@example.com",
                        },
                    ],
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Redirect required during challenge
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    challenge_type: "redirect",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            });

        const resetPasswordInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        // Complete reset password and get to JIT
        const startResult = await app.resetPassword(resetPasswordInputs);
        const submitCodeResult = await (
            startResult.state as ResetPasswordCodeRequiredState
        ).submitCode("12345678");
        const submitPasswordResult = await (
            submitCodeResult.state as ResetPasswordPasswordRequiredState
        ).submitNewPassword("valid-password");
        const signInResult = await (
            submitPasswordResult.state as ResetPasswordCompletedState
        ).signIn();
        const jitState =
            signInResult.state as AuthMethodRegistrationRequiredState;

        // Challenge method - should return redirect required
        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "user@example.com",
        });

        expect(challengeResult).toBeInstanceOf(
            AuthMethodRegistrationChallengeMethodResult
        );
        expect(challengeResult.error).toBeDefined();
        expect(challengeResult.isFailed()).toBe(true);
        expect(challengeResult.error?.isRedirectRequired()).toBe(true);
    });

    it("should handle JIT registration with custom claims during reset password flow", async () => {
        (fetch as jest.Mock)
            // Reset password setup
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-1",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-2",
                    challenge_type: "oob",
                    binding_method: "prompt",
                    challenge_channel: "email",
                    challenge_target_label: "s****n@o*********m",
                    code_length: 8,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-3",
                    expires_in: 600,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-4",
                    poll_interval: 1,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-5",
                    status: "succeeded",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Sign in with custom claims - registration required
            .mockResolvedValueOnce({
                status: 400,
                json: async () => ({
                    error: "invalid_grant",
                    suberror: "registration_required",
                    continuation_token: "jit-continuation-token-1",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            // JIT flow with fast-pass
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "jit-continuation-token-2",
                    methods: [
                        {
                            id: "email",
                            challenge_type: "oob",
                            challenge_channel: "email",
                            login_hint: "test@test.com",
                        },
                    ],
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "jit-continuation-token-3",
                    challenge_type: "preverified",
                    binding_method: "none",
                    challenge_target: "test@test.com",
                    challenge_channel: "email",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "jit-continuation-token-4",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => TestServerTokenResponse,
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            });

        const resetPasswordInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        // Complete reset password
        const startResult = await app.resetPassword(resetPasswordInputs);
        const submitCodeResult = await (
            startResult.state as ResetPasswordCodeRequiredState
        ).submitCode("12345678");
        const submitPasswordResult = await (
            submitCodeResult.state as ResetPasswordPasswordRequiredState
        ).submitNewPassword("valid-password");

        const claims = JSON.stringify({
            access_token: {
                acrs: {
                    essential: true,
                    value: "c1",
                },
            },
        });

        // Sign in with custom claims - should trigger JIT
        const signInResult = await (
            submitPasswordResult.state as ResetPasswordCompletedState
        ).signIn({
            claims: claims,
        });

        expect(signInResult.isAuthMethodRegistrationRequired()).toBe(true);

        const jitState =
            signInResult.state as AuthMethodRegistrationRequiredState;

        // Use fast-pass with same email as reset password
        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "test@test.com",
        });

        expect(challengeResult).toBeInstanceOf(
            AuthMethodRegistrationChallengeMethodResult
        );
        expect(challengeResult.error).toBeUndefined();
        expect(challengeResult.isCompleted()).toBe(true);
        expect(challengeResult.data).toBeInstanceOf(CustomAuthAccountData);
    });

    it("should handle MFA required with Email during reset password flow sign in", async () => {
        (fetch as jest.Mock)
            // Step 1: Mock /resetpassword/v1.0/start - successful start
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-1",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 2: Mock /resetpassword/v1.0/challenge - successful challenge
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-2",
                        challenge_type: "oob",
                        binding_method: "prompt",
                        challenge_channel: "email",
                        challenge_target_label: "s****n@o*********m",
                        code_length: 8,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 3: Mock /resetpassword/v1.0/continue - submit code successfully
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-3",
                        expires_in: 600,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 4: Mock /resetpassword/v1.0/submit - successful submit password
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-4",
                        poll_interval: 1,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 5: Mock /resetpassword/v1.0/poll_completion - poll and succeeded
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-5",
                        status: "succeeded",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })

            // Step 6: Mock /oauth/v2.0/token - returns registration_required error
            .mockResolvedValueOnce({
                status: 400,
                json: async () => {
                    return {
                        error: "invalid_grant",
                        error_description:
                            "Multi-factor authentication is required.",
                        suberror: "mfa_required",
                        continuation_token: "mfa-continuation-token",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            // Step 7: Mock /oauth2/introspect - return available methods
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
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
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 8: Mock /oauth2/challenge - MFA challenge request
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        correlation_id: correlationId,
                        continuation_token: "mfa-challenge-token",
                        challenge_type: "oob",
                        challenge_channel: "email",
                        challenge_target_label: "jo**@co***so.com",
                        code_length: 6,
                        binding_method: "prompt",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 9: Mock /oauth2/token - successful MFA completion
            .mockResolvedValueOnce({
                status: 200,
                json: async () => TestServerTokenResponse,
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            });

        const resetPasswordInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        // Complete reset password flow
        const startResult = await app.resetPassword(resetPasswordInputs);
        expect(startResult.isCodeRequired()).toBe(true);

        const submitCodeResult = await (
            startResult.state as ResetPasswordCodeRequiredState
        ).submitCode("12345678");
        expect(submitCodeResult.isPasswordRequired()).toBe(true);

        const submitPasswordResult = await (
            submitCodeResult.state as ResetPasswordPasswordRequiredState
        ).submitNewPassword("valid-password");
        expect(submitPasswordResult.isCompleted()).toBe(true);

        // Attempt sign in - should trigger MFA
        const signInResult = await (
            submitPasswordResult.state as ResetPasswordCompletedState
        ).signIn();

        // Verify MFA is required
        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.isMfaRequired()).toBe(true);

        const mfaState = signInResult.state as MfaAwaitingState;

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

    it("should handle MFA required with SMS during reset password flow sign in", async () => {
        (fetch as jest.Mock)
            // Step 1: Mock /resetpassword/v1.0/start - successful start
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-1",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 2: Mock /resetpassword/v1.0/challenge - successful challenge
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-2",
                        challenge_type: "oob",
                        binding_method: "prompt",
                        challenge_channel: "email",
                        challenge_target_label: "s****n@o*********m",
                        code_length: 8,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 3: Mock /resetpassword/v1.0/continue - submit code successfully
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-3",
                        expires_in: 600,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 4: Mock /resetpassword/v1.0/submit - successful submit password
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-4",
                        poll_interval: 1,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 5: Mock /resetpassword/v1.0/poll_completion - poll and succeeded
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-5",
                        status: "succeeded",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })

            // Step 6: Mock /oauth/v2.0/token - returns registration_required error
            .mockResolvedValueOnce({
                status: 400,
                json: async () => {
                    return {
                        error: "invalid_grant",
                        error_description:
                            "Multi-factor authentication is required.",
                        suberror: "mfa_required",
                        continuation_token: "mfa-continuation-token",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            // Step 7: Mock /oauth2/introspect - return available methods
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
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
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 8: Mock /oauth2/challenge - MFA challenge request
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        correlation_id: correlationId,
                        continuation_token: "mfa-challenge-token",
                        challenge_type: "oob",
                        challenge_channel: "sms",
                        challenge_target_label: "000000000",
                        code_length: 6,
                        binding_method: "prompt",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // Step 9: Mock /oauth2/token - successful MFA completion
            .mockResolvedValueOnce({
                status: 200,
                json: async () => TestServerTokenResponse,
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            });

        const resetPasswordInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        // Complete reset password flow
        const startResult = await app.resetPassword(resetPasswordInputs);
        expect(startResult.isCodeRequired()).toBe(true);

        const submitCodeResult = await (
            startResult.state as ResetPasswordCodeRequiredState
        ).submitCode("12345678");
        expect(submitCodeResult.isPasswordRequired()).toBe(true);

        const submitPasswordResult = await (
            submitCodeResult.state as ResetPasswordPasswordRequiredState
        ).submitNewPassword("valid-password");
        expect(submitPasswordResult.isCompleted()).toBe(true);

        // Attempt sign in - should trigger MFA
        const signInResult = await (
            submitPasswordResult.state as ResetPasswordCompletedState
        ).signIn();

        // Verify MFA is required
        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.isMfaRequired()).toBe(true);

        const mfaState = signInResult.state as MfaAwaitingState;

        // Request MFA challenge
        const requestChallengeResult = await mfaState.requestChallenge(
            "sms-method-id"
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
        expect(verificationState.getChannel()).toBe("sms");
        expect(verificationState.getSentTo()).toBe("000000000");
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
});
