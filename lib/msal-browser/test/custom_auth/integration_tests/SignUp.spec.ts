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

        // Sign out the user for clean up the state for the other tests.
        signInResult.data?.signOut();
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

        // Sign out the user for clean up the state for the other tests.
        signInResult.data?.signOut();
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

        // Sign out the user for clean up the state for the other tests.
        signInResult.data?.signOut();
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

        // Sign out the user for clean up the state for the other tests.
        signInResult.data?.signOut();
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
});
