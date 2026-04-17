/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthAccountData } from "../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { CustomAuthPublicClientApplication } from "../../../src/custom_auth/CustomAuthPublicClientApplication.js";
import { SignUpSubmitCodeResult } from "../../../src/custom_auth/sign_up/auth_flow/result/SignUpSubmitCodeResult.js";
import { SignUpSubmitPasswordResult } from "../../../src/custom_auth/sign_up/auth_flow/result/SignUpSubmitPasswordResult.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { SignInResult } from "../../../src/custom_auth/sign_in/auth_flow/result/SignInResult.js";
import { SignUpInputs } from "../../../src/custom_auth/CustomAuthActionInputs.js";
import { UserAccountAttributes } from "../../../src/custom_auth/UserAccountAttributes.js";
import { SignUpResult } from "../../../src/custom_auth/sign_up/auth_flow/result/SignUpResult.js";
import { SignUpSubmitAttributesResult } from "../../../src/custom_auth/sign_up/auth_flow/result/SignUpSubmitAttributesResult.js";
import { CustomAuthStandardController } from "../../../src/custom_auth/controller/CustomAuthStandardController.js";
import { SignUpCodeRequiredState } from "../../../src/custom_auth/sign_up/auth_flow/state/SignUpCodeRequiredState.js";
import { SignUpCompletedState } from "../../../src/custom_auth/sign_up/auth_flow/state/SignUpCompletedState.js";
import { SignUpPasswordRequiredState } from "../../../src/custom_auth/sign_up/auth_flow/state/SignUpPasswordRequiredState.js";
import { SignUpAttributesRequiredState } from "../../../src/custom_auth/sign_up/auth_flow/state/SignUpAttributesRequiredState.js";
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
import { CustomAuthApiError } from "../../../src/custom_auth/core/error/CustomAuthApiError.js";

describe("Sign up", () => {
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

    it("should sign up successfully if no password is provided when starting the password reset", async () => {
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
                        interval: 300,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 400,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-4",
                        error: "credential_required",
                        error_description: "Credential required.",
                        error_codes: [55103],
                        timestamp: "yy-mm-dd 02:37:33Z",
                        trace_id: "test-trace-id",
                        correlation_id: correlationId,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-5",
                        challenge_type: "password",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-6",
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

        const attributes: UserAccountAttributes = {
            city: "test-city",
        };

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            attributes: attributes,
        };

        const startResult = await app.signUp(signUpInputs);

        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.error).toBeUndefined();
        expect(startResult.isCodeRequired()).toBe(true);

        const submitCodeResult = await (
            startResult.state as SignUpCodeRequiredState
        ).submitCode("12345678");

        expect(submitCodeResult).toBeInstanceOf(SignUpSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.isPasswordRequired()).toBe(true);

        const submitPasswordResult = await (
            submitCodeResult.state as SignUpPasswordRequiredState
        ).submitPassword("valid-password");

        expect(submitPasswordResult).toBeInstanceOf(SignUpSubmitPasswordResult);
        expect(submitPasswordResult.error).toBeUndefined();
        expect(submitPasswordResult.isCompleted()).toBe(true);

        const signInResult = await (
            submitPasswordResult.state as SignUpCompletedState
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

    it("should sign in with custom claims after sign up successfully", async () => {
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
                        interval: 300,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 400,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-4",
                        error: "credential_required",
                        error_description: "Credential required.",
                        error_codes: [55103],
                        timestamp: "yy-mm-dd 02:37:33Z",
                        trace_id: "test-trace-id",
                        correlation_id: correlationId,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-5",
                        challenge_type: "password",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-6",
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

        const attributes: UserAccountAttributes = {
            city: "test-city",
        };

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            attributes: attributes,
        };

        const startResult = await app.signUp(signUpInputs);

        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.error).toBeUndefined();
        expect(startResult.isCodeRequired()).toBe(true);

        const submitCodeResult = await (
            startResult.state as SignUpCodeRequiredState
        ).submitCode("12345678");

        expect(submitCodeResult).toBeInstanceOf(SignUpSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.isPasswordRequired()).toBe(true);

        const submitPasswordResult = await (
            submitCodeResult.state as SignUpPasswordRequiredState
        ).submitPassword("valid-password");

        expect(submitPasswordResult).toBeInstanceOf(SignUpSubmitPasswordResult);
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
            submitPasswordResult.state as SignUpCompletedState
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

    it("should sign up successfully if attributes are required after starting the password reset", async () => {
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
                        interval: 300,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 400,
                json: async () => {
                    return {
                        error: "attributes_required",
                        error_description: "User attributes required",
                        error_codes: [55106],
                        timestamp: "yy-mm-dd 02:37:33Z",
                        trace_id: "test-trace-id",
                        correlation_id: correlationId,
                        continuation_token: "test-continuation-token-3",
                        required_attributes: [
                            {
                                name: "displayName",
                                type: "string",
                                required: true,
                                options: {
                                    regex: ".*@.**$",
                                },
                            },
                            {
                                name: "extension_2588abcdwhtfeehjjeeqwertc_age",
                                type: "string",
                                required: true,
                            },
                            {
                                name: "postalCode",
                                type: "string",
                                required: true,
                                options: {
                                    regex: "^[1-9][0-9]*$",
                                },
                            },
                        ],
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-4",
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

        const attributes: UserAccountAttributes = {
            city: "test-city",
        };

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            attributes: attributes,
        };

        const startResult = await app.signUp(signUpInputs);

        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.error).toBeUndefined();
        expect(startResult.isCodeRequired()).toBe(true);

        const submitCodeResult = await (
            startResult.state as SignUpCodeRequiredState
        ).submitCode("12345678");

        expect(submitCodeResult).toBeInstanceOf(SignUpSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.isAttributesRequired()).toBe(true);
        expect(
            (
                submitCodeResult.state as SignUpAttributesRequiredState
            )?.getRequiredAttributes().length
        ).toBe(3);

        const requiredAttributes: UserAccountAttributes = {
            displayName: "test-display-name",
        };
        const submitAttributesResult = await (
            submitCodeResult.state as SignUpAttributesRequiredState
        ).submitAttributes(requiredAttributes);

        expect(submitAttributesResult).toBeInstanceOf(
            SignUpSubmitAttributesResult
        );
        expect(submitAttributesResult.error).toBeUndefined();
        expect(submitAttributesResult.isCompleted()).toBe(true);

        const signInResult = await (
            submitAttributesResult.state as SignUpCompletedState
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

    it("should sign up successfully if password and attributes are required after starting the password reset", async () => {
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
                        interval: 300,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 400,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-3",
                        error: "credential_required",
                        error_description: "Credential required.",
                        error_codes: [55103],
                        timestamp: "yy-mm-dd 02:37:33Z",
                        trace_id: "test-trace-id",
                        correlation_id: correlationId,
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-4",
                        challenge_type: "password",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 400,
                json: async () => {
                    return {
                        error: "attributes_required",
                        error_description: "User attributes required",
                        error_codes: [55106],
                        timestamp: "yy-mm-dd 02:37:33Z",
                        trace_id: "test-trace-id",
                        correlation_id: correlationId,
                        continuation_token: "test-continuation-token-5",
                        required_attributes: [
                            {
                                name: "displayName",
                                type: "string",
                                required: true,
                                options: {
                                    regex: ".*@.**$",
                                },
                            },
                            {
                                name: "extension_2588abcdwhtfeehjjeeqwertc_age",
                                type: "string",
                                required: true,
                            },
                            {
                                name: "postalCode",
                                type: "string",
                                required: true,
                                options: {
                                    regex: "^[1-9][0-9]*$",
                                },
                            },
                        ],
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        continuation_token: "test-continuation-token-6",
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

        const attributes: UserAccountAttributes = {
            city: "test-city",
        };

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            attributes: attributes,
        };

        const startResult = await app.signUp(signUpInputs);

        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.error).toBeUndefined();
        expect(startResult.isCodeRequired()).toBe(true);

        const submitCodeResult = await (
            startResult.state as SignUpCodeRequiredState
        ).submitCode("12345678");

        expect(submitCodeResult).toBeInstanceOf(SignUpSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.isPasswordRequired()).toBe(true);

        const submitPasswordResult = await (
            submitCodeResult.state as SignUpPasswordRequiredState
        ).submitPassword("valid-password");

        expect(submitPasswordResult).toBeInstanceOf(SignUpSubmitPasswordResult);
        expect(submitPasswordResult.error).toBeUndefined();
        expect(submitPasswordResult.isAttributesRequired()).toBe(true);

        const requiredAttributes: UserAccountAttributes = {
            displayName: "test-display-name",
        };
        const submitAttributesResult = await (
            submitPasswordResult.state as SignUpAttributesRequiredState
        ).submitAttributes(requiredAttributes);

        expect(submitAttributesResult).toBeInstanceOf(
            SignUpSubmitAttributesResult
        );
        expect(submitAttributesResult.error).toBeUndefined();
        expect(submitAttributesResult.isCompleted()).toBe(true);

        const signInResult = await (
            submitAttributesResult.state as SignUpCompletedState
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

    it("should sign up successfully if the password and attributes are provided when starting the password reset", async () => {
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
                        interval: 300,
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

        const attributes: UserAccountAttributes = {
            city: "test-city",
        };

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            password: "valid-password",
            attributes: attributes,
        };

        const startResult = await app.signUp(signUpInputs);

        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.error).toBeUndefined();
        expect(startResult.isCodeRequired()).toBe(true);

        const submitCodeResult = await (
            startResult.state as SignUpCodeRequiredState
        ).submitCode("12345678");

        expect(submitCodeResult).toBeInstanceOf(SignUpSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.isCompleted()).toBe(true);

        const signInResult = await (
            submitCodeResult.state as SignUpCompletedState
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

    it("should sign up failed if the redirect challenge returned", async () => {
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

        const signUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const startResult = await app.signUp(signUpInputs);

        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.error).toBeDefined();
        expect(startResult.isFailed()).toBe(true);
        expect(startResult.error?.isRedirectRequired()).toBe(true);
    });

    it("should sign up failed if the given user is not found", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => {
                return {
                    error: "user_already_exists",
                    error_description:
                        "It looks like you may already have an account.",
                    error_codes: [1003037],
                    timestamp: "yyyy-mm-dd 10:15:00Z",
                    trace_id: "test-trace-id",
                    correlation_id: correlationId,
                };
            },
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        const signUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const startResult = await app.signUp(signUpInputs);

        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.error).toBeDefined();
        expect(startResult.isFailed()).toBe(true);
        expect(startResult.error?.isUserAlreadyExists()).toBe(true);
    });

    it("should handle JIT registration required after signUp() completion and complete flow with email verification", async () => {
        // Step 1: Mock /signup/v1.0/start - successful start
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-1",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /signup/v1.0/challenge - email challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-2",
                challenge_type: "oob",
                binding_method: "prompt",
                challenge_channel: "email",
                challenge_target_label: "te**@te**.com",
                code_length: 8,
                interval: 300,
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /signup/v1.0/continue - code submission (requires password)
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                continuation_token: "test-continuation-token-3",
                error: "credential_required",
                error_description: "Credential required.",
                error_codes: [55103],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /signup/v1.0/challenge - password requirement
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-4",
                challenge_type: "password",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 5: Mock /signup/v1.0/continue - password submission (signup complete)
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "signup-completion-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 6: Mock /oauth2/token - JIT registration required during signIn after signup
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

        // Step 7: Mock /register/v1.0/introspect - available authentication methods
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

        // Step 8: Mock /register/v1.0/challenge - email challenge
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

        // Step 9: Mock /register/v1.0/continue - challenge submission
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "jit-verified-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 10: Mock /oauth2/token - successful completion after JIT registration
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => TestServerTokenResponse,
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        const attributes: UserAccountAttributes = {
            city: "test-city",
        };

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            attributes: attributes,
        };

        // Start SignUp flow
        const startResult = await app.signUp(signUpInputs);
        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.error).toBeUndefined();
        expect(startResult.isCodeRequired()).toBe(true);

        // Submit code
        const submitCodeResult = await (
            startResult.state as SignUpCodeRequiredState
        ).submitCode("12345678");
        expect(submitCodeResult).toBeInstanceOf(SignUpSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.isPasswordRequired()).toBe(true);

        // Submit password
        const submitPasswordResult = await (
            submitCodeResult.state as SignUpPasswordRequiredState
        ).submitPassword("valid-password");
        expect(submitPasswordResult).toBeInstanceOf(SignUpSubmitPasswordResult);
        expect(submitPasswordResult.error).toBeUndefined();
        expect(submitPasswordResult.isCompleted()).toBe(true);

        // SignIn after signup completion - should trigger JIT
        const signInResult = await (
            submitPasswordResult.state as SignUpCompletedState
        ).signIn();

        // Verify JIT registration is required
        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.isAuthMethodRegistrationRequired()).toBe(true);

        const jitState =
            signInResult.state as AuthMethodRegistrationRequiredState;
        expect(jitState.getAuthMethods()).toHaveLength(1);
        expect(jitState.getAuthMethods()[0].id).toBe("email");

        // Challenge the email authentication method
        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "user@contoso.com",
        });

        expect(challengeResult).toBeInstanceOf(
            AuthMethodRegistrationChallengeMethodResult
        );
        expect(challengeResult.error).toBeUndefined();
        expect(challengeResult.isVerificationRequired()).toBe(true);

        const verificationState =
            challengeResult.state as AuthMethodVerificationRequiredState;
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
        expect(submitResult.data?.getAccount()?.idToken).toStrictEqual(
            TestServerTokenResponse.id_token
        );
    });

    it("should handle JIT registration required after signUp() completion and complete flow with SMS verification", async () => {
        // Step 1: Mock /signup/v1.0/start - successful start
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-1",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /signup/v1.0/challenge - email challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-2",
                challenge_type: "oob",
                binding_method: "prompt",
                challenge_channel: "email",
                challenge_target_label: "te**@te**.com",
                code_length: 8,
                interval: 300,
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /signup/v1.0/continue - code submission (requires password)
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                continuation_token: "test-continuation-token-3",
                error: "credential_required",
                error_description: "Credential required.",
                error_codes: [55103],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /signup/v1.0/challenge - password requirement
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-4",
                challenge_type: "password",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 5: Mock /signup/v1.0/continue - password submission (signup complete)
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "signup-completion-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 6: Mock /oauth2/token - JIT registration required during signIn after signup
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

        // Step 7: Mock /register/v1.0/introspect - available authentication methods
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

        // Step 8: Mock /register/v1.0/challenge - email challenge
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

        // Step 9: Mock /register/v1.0/continue - challenge submission
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "jit-verified-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 10: Mock /oauth2/token - successful completion after JIT registration
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => TestServerTokenResponse,
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        const attributes: UserAccountAttributes = {
            city: "test-city",
        };

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            attributes: attributes,
        };

        // Start SignUp flow
        const startResult = await app.signUp(signUpInputs);
        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.error).toBeUndefined();
        expect(startResult.isCodeRequired()).toBe(true);

        // Submit code
        const submitCodeResult = await (
            startResult.state as SignUpCodeRequiredState
        ).submitCode("12345678");
        expect(submitCodeResult).toBeInstanceOf(SignUpSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.isPasswordRequired()).toBe(true);

        // Submit password
        const submitPasswordResult = await (
            submitCodeResult.state as SignUpPasswordRequiredState
        ).submitPassword("valid-password");
        expect(submitPasswordResult).toBeInstanceOf(SignUpSubmitPasswordResult);
        expect(submitPasswordResult.error).toBeUndefined();
        expect(submitPasswordResult.isCompleted()).toBe(true);

        // SignIn after signup completion - should trigger JIT
        const signInResult = await (
            submitPasswordResult.state as SignUpCompletedState
        ).signIn();

        // Verify JIT registration is required
        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.isAuthMethodRegistrationRequired()).toBe(true);

        const jitState =
            signInResult.state as AuthMethodRegistrationRequiredState;
        expect(jitState.getAuthMethods()).toHaveLength(1);
        expect(jitState.getAuthMethods()[0].id).toBe("sms");

        // Challenge the sms authentication method
        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "0000000000",
        });

        expect(challengeResult).toBeInstanceOf(
            AuthMethodRegistrationChallengeMethodResult
        );
        expect(challengeResult.error).toBeUndefined();
        expect(challengeResult.isVerificationRequired()).toBe(true);

        const verificationState =
            challengeResult.state as AuthMethodVerificationRequiredState;
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
        expect(submitResult.data?.getAccount()?.idToken).toStrictEqual(
            TestServerTokenResponse.id_token
        );
    });

    it("should handle JIT registration with fast-pass scenario (same email as sign-up)", async () => {
        // Setup basic signup flow
        (fetch as jest.Mock)
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
                    challenge_target_label: "te**@te**.com",
                    code_length: 8,
                    interval: 300,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 400,
                json: async () => ({
                    continuation_token: "test-continuation-token-3",
                    error: "credential_required",
                    error_description: "Credential required.",
                    error_codes: [55103],
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-4",
                    challenge_type: "password",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "signup-completion-token",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // JIT flow
            .mockResolvedValueOnce({
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
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "jit-introspect-token",
                    methods: [
                        {
                            id: "email",
                            login_hint: "test@test.com", // Same email as signup
                        },
                    ],
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    correlation_id: correlationId,
                    continuation_token: "jit-challenge-token",
                    challenge_type: "preverified",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "jit-verified-token",
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

        const attributes: UserAccountAttributes = {
            city: "test-city",
        };

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            attributes: attributes,
        };

        // Complete SignUp flow
        const startResult = await app.signUp(signUpInputs);
        const submitCodeResult = await (
            startResult.state as SignUpCodeRequiredState
        ).submitCode("12345678");
        const submitPasswordResult = await (
            submitCodeResult.state as SignUpPasswordRequiredState
        ).submitPassword("valid-password");

        // SignIn after signup completion - should trigger JIT
        const signInResult = await (
            submitPasswordResult.state as SignUpCompletedState
        ).signIn();

        // Verify JIT registration is required
        expect(signInResult.isAuthMethodRegistrationRequired()).toBe(true);

        const jitState =
            signInResult.state as AuthMethodRegistrationRequiredState;

        // Challenge the email authentication method (same as sign-up email)
        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "test@test.com", // Same email as signup
        });

        // Fast-pass should complete immediately
        expect(challengeResult).toBeInstanceOf(
            AuthMethodRegistrationChallengeMethodResult
        );
        expect(challengeResult.error).toBeUndefined();
        expect(challengeResult.isCompleted()).toBe(true);
        expect(challengeResult.data).toBeInstanceOf(CustomAuthAccountData);
    });

    it("should handle JIT registration with custom claims after sign up", async () => {
        // Setup basic signup flow
        (fetch as jest.Mock)
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
                    challenge_target_label: "te**@te**.com",
                    code_length: 8,
                    interval: 300,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 400,
                json: async () => ({
                    continuation_token: "test-continuation-token-3",
                    error: "credential_required",
                    error_description: "Credential required.",
                    error_codes: [55103],
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-4",
                    challenge_type: "password",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "signup-completion-token",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            // JIT flow with custom claims
            .mockResolvedValueOnce({
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
            })
            .mockResolvedValueOnce({
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
            })
            .mockResolvedValueOnce({
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
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "jit-verified-token",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    ...TestServerTokenResponse,
                    id_token:
                        TestServerTokenResponse.id_token + "_custom_claims",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            });

        const attributes: UserAccountAttributes = {
            city: "test-city",
        };

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            attributes: attributes,
        };

        // Complete SignUp flow
        const startResult = await app.signUp(signUpInputs);
        const submitCodeResult = await (
            startResult.state as SignUpCodeRequiredState
        ).submitCode("12345678");
        const submitPasswordResult = await (
            submitCodeResult.state as SignUpPasswordRequiredState
        ).submitPassword("valid-password");

        // SignIn with custom claims after signup completion
        const customClaims = JSON.stringify({ custom: "claim_value" });
        const signInResult = await (
            submitPasswordResult.state as SignUpCompletedState
        ).signIn({
            scopes: ["custom-scope"],
            claims: customClaims,
        });

        // Complete JIT flow
        const jitState =
            signInResult.state as AuthMethodRegistrationRequiredState;
        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "user@contoso.com",
        });
        const verificationState =
            challengeResult.state as AuthMethodVerificationRequiredState;
        const submitResult = await verificationState.submitChallenge("123456");

        expect(submitResult.isCompleted()).toBe(true);
        expect(submitResult.data?.getAccount()?.idToken).toBe(
            TestServerTokenResponse.id_token + "_custom_claims"
        );
    });

    it("should handle JIT registration error scenarios after sign up", async () => {
        // Setup basic sign up flow mocks
        (fetch as jest.Mock)
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
                    challenge_target_label: "te**@te**.com",
                    code_length: 8,
                    interval: 300,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 400,
                json: async () => ({
                    continuation_token: "test-continuation-token-3",
                    error: "credential_required",
                    error_description: "Credential required.",
                    error_codes: [55103],
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-4",
                    challenge_type: "password",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "signup-completion-token",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
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
            })
            .mockResolvedValueOnce({
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
            })
            .mockResolvedValueOnce({
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
            })
            // Mock error for incorrect challenge
            .mockResolvedValueOnce({
                status: 400,
                json: async () => ({
                    error: "invalid_request",
                    error_description: "The verification code is incorrect.",
                    suberror: "verification_code_incorrect",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            });

        const attributes: UserAccountAttributes = {
            city: "test-city",
        };

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            attributes: attributes,
        };

        // Complete SignUp flow
        const startResult = await app.signUp(signUpInputs);
        const submitCodeResult = await (
            startResult.state as SignUpCodeRequiredState
        ).submitCode("12345678");
        const submitPasswordResult = await (
            submitCodeResult.state as SignUpPasswordRequiredState
        ).submitPassword("valid-password");

        // SignIn after signup - triggers JIT
        const signInResult = await (
            submitPasswordResult.state as SignUpCompletedState
        ).signIn();

        const jitState =
            signInResult.state as AuthMethodRegistrationRequiredState;
        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "user@contoso.com",
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

    it("should handle resending JIT verification code after sign up", async () => {
        // Setup basic sign up flow mocks
        (fetch as jest.Mock)
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
                    challenge_target_label: "te**@te**.com",
                    code_length: 8,
                    interval: 300,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 400,
                json: async () => ({
                    continuation_token: "test-continuation-token-3",
                    error: "credential_required",
                    error_description: "Credential required.",
                    error_codes: [55103],
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-4",
                    challenge_type: "password",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "signup-completion-token",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
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
            })
            .mockResolvedValueOnce({
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
            })
            // Initial challenge
            .mockResolvedValueOnce({
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
            })
            // Resend challenge
            .mockResolvedValueOnce({
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

        const attributes: UserAccountAttributes = {
            city: "test-city",
        };

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            attributes: attributes,
        };

        // Complete SignUp flow
        const startResult = await app.signUp(signUpInputs);
        const submitCodeResult = await (
            startResult.state as SignUpCodeRequiredState
        ).submitCode("12345678");
        const submitPasswordResult = await (
            submitCodeResult.state as SignUpPasswordRequiredState
        ).submitPassword("valid-password");

        // SignIn after signup - triggers JIT
        const signInResult = await (
            submitPasswordResult.state as SignUpCompletedState
        ).signIn();

        const jitState =
            signInResult.state as AuthMethodRegistrationRequiredState;
        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "user@contoso.com",
        });

        const verificationState =
            challengeResult.state as AuthMethodVerificationRequiredState;

        // Resend the challenge
        const resendResult = await verificationState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "user@contoso.com",
        });

        expect(resendResult).toBeInstanceOf(
            AuthMethodRegistrationChallengeMethodResult
        );
        expect(resendResult.error).toBeUndefined();
        expect(resendResult.isVerificationRequired()).toBe(true);

        const newVerificationState =
            resendResult.state as AuthMethodVerificationRequiredState;
        expect(newVerificationState.getChannel()).toBe("email");
        expect(newVerificationState.getSentTo()).toBe("us**@co***so.com");
        expect(newVerificationState.getCodeLength()).toBe(6);
    });

    it("should handle JIT registration with incorrect verification contact error after sign up", async () => {
        // Setup sign up flow mocks
        (fetch as jest.Mock)
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
                    challenge_target_label: "te**@te**.com",
                    code_length: 8,
                    interval: 300,
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 400,
                json: async () => ({
                    continuation_token: "test-continuation-token-3",
                    error: "credential_required",
                    error_description: "Credential required.",
                    error_codes: [55103],
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "test-continuation-token-4",
                    challenge_type: "password",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
                status: 200,
                json: async () => ({
                    continuation_token: "signup-completion-token",
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            })
            .mockResolvedValueOnce({
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
            })
            .mockResolvedValueOnce({
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
            })
            // Mock error for incorrect verification contact
            .mockResolvedValueOnce({
                status: 400,
                json: async () => ({
                    error: "invalid_request",
                    error_description: "The verification contact is incorrect.",
                    error_codes: [901001],
                }),
                headers: new Headers({ "content-type": "application/json" }),
                ok: false,
            });

        const attributes: UserAccountAttributes = {
            city: "test-city",
        };

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            attributes: attributes,
        };

        // Complete SignUp flow
        const startResult = await app.signUp(signUpInputs);
        const submitCodeResult = await (
            startResult.state as SignUpCodeRequiredState
        ).submitCode("12345678");
        const submitPasswordResult = await (
            submitCodeResult.state as SignUpPasswordRequiredState
        ).submitPassword("valid-password");

        // SignIn after signup - triggers JIT
        const signInResult = await (
            submitPasswordResult.state as SignUpCompletedState
        ).signIn();

        const jitState =
            signInResult.state as AuthMethodRegistrationRequiredState;

        // Challenge with incorrect verification contact
        const challengeResult = await jitState.challengeAuthMethod({
            authMethodType: jitState.getAuthMethods()[0],
            verificationContact: "invalid@email.com",
        });

        expect(challengeResult).toBeInstanceOf(
            AuthMethodRegistrationChallengeMethodResult
        );
        expect(challengeResult.error).toBeDefined();
        expect(challengeResult.isFailed()).toBe(true);
        expect(challengeResult.error?.isInvalidInput()).toBe(true);
    });

    it("should handle MFA required after signUp() completion and complete flow with email verification", async () => {
        // Step 1: Mock /signup/v1.0/start - successful start
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-1",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /signup/v1.0/challenge - email challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-2",
                challenge_type: "oob",
                binding_method: "prompt",
                challenge_channel: "email",
                challenge_target_label: "te**@te**.com",
                code_length: 8,
                interval: 300,
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /signup/v1.0/continue - code submission (requires password)
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                continuation_token: "test-continuation-token-3",
                error: "credential_required",
                error_description: "Credential required.",
                error_codes: [55103],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /signup/v1.0/challenge - password requirement
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-4",
                challenge_type: "password",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 5: Mock /signup/v1.0/continue - password submission (signup complete)
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "signup-completion-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 6: Mock /oauth2/token - MFA required during signIn after signup
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

        // Step 7: Mock /oauth2/introspect - return available methods
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

        // Step 8: Mock /oauth2/challenge - MFA challenge request
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

        // Step 9: Mock /oauth2/token - successful MFA completion
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => TestServerTokenResponse,
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        const attributes: UserAccountAttributes = {
            city: "test-city",
        };

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            attributes: attributes,
        };

        // Start SignUp flow
        const startResult = await app.signUp(signUpInputs);
        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.error).toBeUndefined();
        expect(startResult.isCodeRequired()).toBe(true);

        // Submit code
        const submitCodeResult = await (
            startResult.state as SignUpCodeRequiredState
        ).submitCode("12345678");
        expect(submitCodeResult).toBeInstanceOf(SignUpSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.isPasswordRequired()).toBe(true);

        // Submit password
        const submitPasswordResult = await (
            submitCodeResult.state as SignUpPasswordRequiredState
        ).submitPassword("valid-password");
        expect(submitPasswordResult).toBeInstanceOf(SignUpSubmitPasswordResult);
        expect(submitPasswordResult.error).toBeUndefined();
        expect(submitPasswordResult.isCompleted()).toBe(true);

        // SignIn after signup completion - should trigger MFA
        const signInResult = await (
            submitPasswordResult.state as SignUpCompletedState
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

    it("should handle MFA required after signUp() completion and complete flow with SMS verification", async () => {
        // Step 1: Mock /signup/v1.0/start - successful start
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-1",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /signup/v1.0/challenge - email challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-2",
                challenge_type: "oob",
                binding_method: "prompt",
                challenge_channel: "email",
                challenge_target_label: "te**@te**.com",
                code_length: 8,
                interval: 300,
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /signup/v1.0/continue - code submission (requires password)
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                continuation_token: "test-continuation-token-3",
                error: "credential_required",
                error_description: "Credential required.",
                error_codes: [55103],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /signup/v1.0/challenge - password requirement
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-4",
                challenge_type: "password",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 5: Mock /signup/v1.0/continue - password submission (signup complete)
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "signup-completion-token",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 6: Mock /oauth2/token - MFA required during signIn after signup
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

        // Step 7: Mock /oauth2/introspect - return available methods
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

        // Step 8: Mock /oauth2/challenge - MFA challenge request
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                correlation_id: correlationId,
                continuation_token: "mfa-challenge-token",
                challenge_type: "oob",
                challenge_channel: "sms",
                challenge_target_label: "0000000000",
                code_length: 6,
                binding_method: "prompt",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 9: Mock /oauth2/token - successful MFA completion
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => TestServerTokenResponse,
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        const attributes: UserAccountAttributes = {
            city: "test-city",
        };

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            attributes: attributes,
        };

        // Start SignUp flow
        const startResult = await app.signUp(signUpInputs);
        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.error).toBeUndefined();
        expect(startResult.isCodeRequired()).toBe(true);

        // Submit code
        const submitCodeResult = await (
            startResult.state as SignUpCodeRequiredState
        ).submitCode("12345678");
        expect(submitCodeResult).toBeInstanceOf(SignUpSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.isPasswordRequired()).toBe(true);

        // Submit password
        const submitPasswordResult = await (
            submitCodeResult.state as SignUpPasswordRequiredState
        ).submitPassword("valid-password");
        expect(submitPasswordResult).toBeInstanceOf(SignUpSubmitPasswordResult);
        expect(submitPasswordResult.error).toBeUndefined();
        expect(submitPasswordResult.isCompleted()).toBe(true);

        // SignIn after signup completion - should trigger MFA
        const signInResult = await (
            submitPasswordResult.state as SignUpCompletedState
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
        expect(verificationState.getSentTo()).toBe("0000000000");
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

    // --- Flat username (alias) sign-up tests ---

    it("should sign up successfully with flatusername attribute provided at /start", async () => {
        // Step 1: Mock /signup/v1.0/start - successful start with flatusername in attributes
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-1",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /signup/v1.0/challenge - email challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-2",
                challenge_type: "oob",
                binding_method: "prompt",
                challenge_channel: "email",
                challenge_target_label: "s****n@o*********m",
                code_length: 8,
                interval: 300,
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /signup/v1.0/continue - code submission (requires password)
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                continuation_token: "test-continuation-token-3",
                error: "credential_required",
                error_description: "Credential required.",
                error_codes: [55103],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /signup/v1.0/challenge - password requirement
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-4",
                challenge_type: "password",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 5: Mock /signup/v1.0/continue - password submission (signup complete)
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-5",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 6: Mock /oauth2/token - successful sign-in after signup
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => TestServerTokenResponse,
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            attributes: { flatusername: "foobar", city: "test-city" },
        };

        const startResult = await app.signUp(signUpInputs);

        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.error).toBeUndefined();
        expect(startResult.isCodeRequired()).toBe(true);

        const submitCodeResult = await (
            startResult.state as SignUpCodeRequiredState
        ).submitCode("12345678");

        expect(submitCodeResult).toBeInstanceOf(SignUpSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.isPasswordRequired()).toBe(true);

        const submitPasswordResult = await (
            submitCodeResult.state as SignUpPasswordRequiredState
        ).submitPassword("valid-password");

        expect(submitPasswordResult).toBeInstanceOf(SignUpSubmitPasswordResult);
        expect(submitPasswordResult.error).toBeUndefined();
        expect(submitPasswordResult.isCompleted()).toBe(true);

        const signInResult = await (
            submitPasswordResult.state as SignUpCompletedState
        ).signIn();

        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.isCompleted()).toBe(true);
        expect(signInResult.data).toBeDefined();
        expect(signInResult.data).toBeInstanceOf(CustomAuthAccountData);
    });

    it("should sign up successfully with flatusername attribute submitted at /continue", async () => {
        // Step 1: Mock /signup/v1.0/start - successful start
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-1",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /signup/v1.0/challenge - email challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-2",
                challenge_type: "oob",
                binding_method: "prompt",
                challenge_channel: "email",
                challenge_target_label: "s****n@o*********m",
                code_length: 8,
                interval: 300,
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /signup/v1.0/continue (code) - attributes required including flatusername
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "attributes_required",
                error_description: "User attributes required",
                error_codes: [55106],
                timestamp: "yy-mm-dd 02:37:33Z",
                trace_id: "test-trace-id",
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-3",
                required_attributes: [
                    {
                        name: "flatusername",
                        type: "Text",
                        required: true,
                        options: {
                            regex: "^[a-zA-Z0-9](?!.*[.,_-]{2})[a-zA-Z0-9.,_-]{2,30}[a-zA-Z0-9]$",
                        },
                    },
                    {
                        name: "displayName",
                        type: "string",
                        required: true,
                    },
                ],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /signup/v1.0/continue (attributes) - signup complete
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-4",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 5: Mock /oauth2/token - successful sign-in
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => TestServerTokenResponse,
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const startResult = await app.signUp(signUpInputs);

        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.error).toBeUndefined();
        expect(startResult.isCodeRequired()).toBe(true);

        const submitCodeResult = await (
            startResult.state as SignUpCodeRequiredState
        ).submitCode("12345678");

        expect(submitCodeResult).toBeInstanceOf(SignUpSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.isAttributesRequired()).toBe(true);

        // Verify flatusername is in required attributes with metadata
        const requiredAttrs = (
            submitCodeResult.state as SignUpAttributesRequiredState
        ).getRequiredAttributes();
        expect(requiredAttrs.length).toBe(2);
        const flatUsernameAttr = requiredAttrs.find(
            (attr) => attr.name === "flatusername"
        );
        expect(flatUsernameAttr).toBeDefined();
        expect(flatUsernameAttr?.type).toBe("Text");
        expect(flatUsernameAttr?.required).toBe(true);
        expect(flatUsernameAttr?.options?.regex).toBe(
            "^[a-zA-Z0-9](?!.*[.,_-]{2})[a-zA-Z0-9.,_-]{2,30}[a-zA-Z0-9]$"
        );

        const submitAttributesResult = await (
            submitCodeResult.state as SignUpAttributesRequiredState
        ).submitAttributes({
            flatusername: "foobar",
            displayName: "Test User",
        });

        expect(submitAttributesResult).toBeInstanceOf(
            SignUpSubmitAttributesResult
        );
        expect(submitAttributesResult.error).toBeUndefined();
        expect(submitAttributesResult.isCompleted()).toBe(true);

        const signInResult = await (
            submitAttributesResult.state as SignUpCompletedState
        ).signIn();

        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.isCompleted()).toBe(true);
        expect(signInResult.data).toBeDefined();
        expect(signInResult.data).toBeInstanceOf(CustomAuthAccountData);
    });

    it("should fail sign up when flatusername is rejected at /start for EmailOTP flow", async () => {
        // Server rejects flatusername for non-EmailPassword IDP at /start
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "invalid_request",
                error_description:
                    "AADSTS901002: The 'flatusername' request parameter is not supported.",
                error_codes: [901002],
                timestamp: "yy-mm-dd 02:37:33Z",
                trace_id: "test-trace-id",
                correlation_id: correlationId,
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            attributes: { flatusername: "foobar" },
        };

        const startResult = await app.signUp(signUpInputs);

        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.isFailed()).toBe(true);
        expect(startResult.error).toBeDefined();
        expect(startResult.error?.errorData?.error).toBe("invalid_request");
        expect(startResult.error?.errorData?.errorCodes).toContain(901002);
        expect(startResult.error?.errorData?.errorDescription).toContain(
            "flatusername"
        );
        // Verify only one fetch call was made (no challenge request)
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("should fail sign up when flatusername is rejected at /continue for EmailOTP flow", async () => {
        // Step 1: Mock /signup/v1.0/start - successful start
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-1",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /signup/v1.0/challenge - email challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-2",
                challenge_type: "oob",
                binding_method: "prompt",
                challenge_channel: "email",
                challenge_target_label: "s****n@o*********m",
                code_length: 8,
                interval: 300,
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /signup/v1.0/continue (code) - attributes required
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "attributes_required",
                error_description: "User attributes required",
                error_codes: [55106],
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-3",
                required_attributes: [
                    {
                        name: "displayName",
                        type: "string",
                        required: true,
                    },
                ],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /signup/v1.0/continue (attributes) - flatusername rejected
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "invalid_request",
                error_description:
                    "AADSTS901002: The 'flatusername' request parameter is not supported.",
                error_codes: [901002],
                timestamp: "yy-mm-dd 02:37:33Z",
                trace_id: "test-trace-id",
                correlation_id: correlationId,
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const startResult = await app.signUp(signUpInputs);

        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.isCodeRequired()).toBe(true);

        const submitCodeResult = await (
            startResult.state as SignUpCodeRequiredState
        ).submitCode("12345678");

        expect(submitCodeResult.isAttributesRequired()).toBe(true);

        const submitAttributesResult = await (
            submitCodeResult.state as SignUpAttributesRequiredState
        ).submitAttributes({
            flatusername: "foobar",
            displayName: "Test User",
        });

        expect(submitAttributesResult).toBeInstanceOf(
            SignUpSubmitAttributesResult
        );
        expect(submitAttributesResult.isFailed()).toBe(true);
        expect(submitAttributesResult.error).toBeDefined();
        expect(submitAttributesResult.error?.errorData?.error).toBe(
            "invalid_request"
        );
        expect(
            submitAttributesResult.error?.errorData?.errorCodes
        ).toContain(901002);
        expect(
            submitAttributesResult.error?.errorData?.errorDescription
        ).toContain("flatusername");
    });

    it("should fail sign up with duplicate flat username", async () => {
        // Server rejects at /start with user_already_exists due to duplicate flatusername
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "user_already_exists",
                error_description:
                    "AADSTS1003037: It looks like you may already have an account with us using this email address. Try signing in again with another identity provider.",
                error_codes: [1003037],
                timestamp: "yy-mm-dd 10:15:00Z",
                trace_id: "test-trace-id",
                correlation_id: correlationId,
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            attributes: { flatusername: "existinguser" },
        };

        const startResult = await app.signUp(signUpInputs);

        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.isFailed()).toBe(true);
        expect(startResult.error).toBeDefined();
        expect(startResult.error?.isUserAlreadyExists()).toBe(true);
    });

    it("should fail sign up with invalid flat username that fails regex validation", async () => {
        // Step 1: Mock /signup/v1.0/start - successful start
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-1",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /signup/v1.0/challenge - email challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-2",
                challenge_type: "oob",
                binding_method: "prompt",
                challenge_channel: "email",
                challenge_target_label: "s****n@o*********m",
                code_length: 8,
                interval: 300,
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /signup/v1.0/continue (code) - attributes required
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "attributes_required",
                error_description: "User attributes required",
                error_codes: [55106],
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-3",
                required_attributes: [
                    {
                        name: "flatusername",
                        type: "Text",
                        required: true,
                        options: {
                            regex: "^[a-zA-Z0-9](?!.*[.,_-]{2})[a-zA-Z0-9.,_-]{2,30}[a-zA-Z0-9]$",
                        },
                    },
                ],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        // Step 4: Mock /signup/v1.0/continue (attributes) - invalid flatusername
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "invalid_grant",
                error_description:
                    "AADSTS55105: User attribute validation failed.",
                error_codes: [55105],
                suberror: "attribute_validation_failed",
                timestamp: "yy-mm-dd 02:37:33Z",
                trace_id: "test-trace-id",
                correlation_id: correlationId,
                invalid_attributes: [{ name: "flatusername" }],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const startResult = await app.signUp(signUpInputs);

        expect(startResult.isCodeRequired()).toBe(true);

        const submitCodeResult = await (
            startResult.state as SignUpCodeRequiredState
        ).submitCode("12345678");

        expect(submitCodeResult.isAttributesRequired()).toBe(true);

        const submitAttributesResult = await (
            submitCodeResult.state as SignUpAttributesRequiredState
        ).submitAttributes({ flatusername: "bad!" });

        expect(submitAttributesResult).toBeInstanceOf(
            SignUpSubmitAttributesResult
        );
        expect(submitAttributesResult.isFailed()).toBe(true);
        expect(submitAttributesResult.error).toBeDefined();
        expect(
            submitAttributesResult.error?.isAttributesValidationFailed()
        ).toBe(true);

        // Verify the error contains the invalid attribute name
        const errorData = submitAttributesResult.error?.errorData;
        expect(errorData).toBeDefined();
        expect(errorData?.error).toBe("invalid_grant");
        expect(errorData).toBeInstanceOf(CustomAuthApiError);
        expect(
            (errorData as CustomAuthApiError).attributes
        ).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: "flatusername" }),
            ])
        );
    });

    it("should transition to attributes required state when flatusername is missing at /continue", async () => {
        // Step 1: Mock /signup/v1.0/start - successful start
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-1",
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 2: Mock /signup/v1.0/challenge - email challenge
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                continuation_token: "test-continuation-token-2",
                challenge_type: "oob",
                binding_method: "prompt",
                challenge_channel: "email",
                challenge_target_label: "s****n@o*********m",
                code_length: 8,
                interval: 300,
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: true,
        });

        // Step 3: Mock /signup/v1.0/continue (code) - flatusername required
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => ({
                error: "attributes_required",
                error_description:
                    "AADSTS55106: User attributes required.",
                error_codes: [55106],
                timestamp: "yy-mm-dd 02:37:33Z",
                trace_id: "test-trace-id",
                correlation_id: correlationId,
                continuation_token: "test-continuation-token-3",
                required_attributes: [
                    {
                        name: "flatusername",
                        type: "Text",
                        required: true,
                        options: {
                            regex: "^[a-zA-Z0-9](?!.*[.,_-]{2})[a-zA-Z0-9.,_-]{2,30}[a-zA-Z0-9]$",
                        },
                    },
                ],
            }),
            headers: new Headers({ "content-type": "application/json" }),
            ok: false,
        });

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const startResult = await app.signUp(signUpInputs);

        expect(startResult.isCodeRequired()).toBe(true);

        const submitCodeResult = await (
            startResult.state as SignUpCodeRequiredState
        ).submitCode("12345678");

        // Verify the result transitions to attributes required state
        expect(submitCodeResult).toBeInstanceOf(SignUpSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.isAttributesRequired()).toBe(true);

        // Verify flatusername is in required attributes with full metadata
        const requiredAttrs = (
            submitCodeResult.state as SignUpAttributesRequiredState
        ).getRequiredAttributes();
        expect(requiredAttrs.length).toBe(1);
        expect(requiredAttrs[0].name).toBe("flatusername");
        expect(requiredAttrs[0].type).toBe("Text");
        expect(requiredAttrs[0].required).toBe(true);
        expect(requiredAttrs[0].options?.regex).toBe(
            "^[a-zA-Z0-9](?!.*[.,_-]{2})[a-zA-Z0-9.,_-]{2,30}[a-zA-Z0-9]$"
        );
    });
});
