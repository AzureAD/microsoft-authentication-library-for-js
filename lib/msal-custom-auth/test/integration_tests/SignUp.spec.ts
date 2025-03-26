/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthAccountData } from "../../src/get_account/auth_flow/CustomAuthAccountData.js";
import { CustomAuthPublicClientApplication } from "../../src/CustomAuthPublicClientApplication.js";
import { SignUpSubmitCodeResult } from "../../src/sign_up/auth_flow/result/SignUpSubmitCodeResult.js";
import { SignUpSubmitPasswordResult } from "../../src/sign_up/auth_flow/result/SignUpSubmitPasswordResult.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { SignInResult } from "../../src/sign_in/auth_flow/result/SignInResult.js";
import { SignUpInputs } from "../../src/CustomAuthActionInputs.js";
import { UserAccountAttributes } from "../../src/UserAccountAttributes.js";
import { SignUpResult } from "../../src/sign_up/auth_flow/result/SignUpResult.js";
import { SignUpSubmitAttributesResult } from "../../src/sign_up/auth_flow/result/SignUpSubmitAttributesResult.js";
import { CustomAuthStandardController } from "../../src/controller/CustomAuthStandardController.js";
import { SignUpCodeRequiredState } from "../../src/sign_up/auth_flow/state/SignUpCodeRequiredState.js";
import { AuthFlowStateType } from "../../src/core/auth_flow/AuthFlowStateType.js";
import { SignUpCompletedState } from "../../src/sign_up/auth_flow/state/SignUpCompletedState.js";
import { SignUpPasswordRequiredState } from "../../src/sign_up/auth_flow/state/SignUpPasswordRequiredState.js";
import { SignUpAttributesRequiredState } from "../../src/sign_up/auth_flow/state/SignUpAttributesRequiredState.js";

jest.mock("@azure/msal-browser", () => {
    const actualModule = jest.requireActual("@azure/msal-browser");
    return {
        ...actualModule,
        ResponseHandler: jest.fn().mockImplementation(() => ({
            handleServerTokenResponse: jest.fn().mockResolvedValue({
                uniqueId: "test-unique-id",
                tenantId: "test-tenant-id",
                scopes: ["test-scope"],
                account: {
                    homeAccountId: "test-home-account-id",
                    environment: "test-environment",
                    tenantId: "test-tenant-id",
                    username: "test-username",
                    idToken: "test-id-token",
                },
                idToken: "test-id-token",
                idTokenClaims: {},
                accessToken: "test-access-token",
                refreshToken: "test-refresh-token",
                expiresOn: new Date(),
                extExpiresOn: new Date(),
            }),
        })),
    };
});

describe("Sign up", () => {
    let app: CustomAuthPublicClientApplication;
    const correlationId = "test-correlation-id";

    beforeEach(async () => {
        app = (await CustomAuthPublicClientApplication.create(customAuthConfig)) as CustomAuthPublicClientApplication;

        global.fetch = jest.fn(); // Mock the fetch API
    });

    afterEach(() => {
        const controller = app["customAuthController"] as CustomAuthStandardController;
        if (controller && controller["eventHandler"] && controller["eventHandler"]["broadcastChannel"]) {
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
                    return {
                        correlation_id: correlationId,
                        token_type: "Bearer",
                        scopes: "test-scope",
                        expires_in: 3600,
                        id_token: "test-id-token",
                        access_token: "test-access-token",
                        refresh_token: "test-refresh-token",
                        client_info: "test-client-info",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            });

        const attributes = new UserAccountAttributes();
        attributes.setCity("test-city");

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            attributes: attributes,
        };

        const startResult = await app.signUp(signUpInputs);

        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.error).toBeUndefined();
        expect(startResult.state?.type).toStrictEqual(AuthFlowStateType.CodeRequired);

        const submitCodeResult = await (startResult.state as SignUpCodeRequiredState).submitCode("12345678");

        expect(submitCodeResult).toBeInstanceOf(SignUpSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.state?.type).toStrictEqual(AuthFlowStateType.PasswordRequired);

        const submitPasswordResult = await (submitCodeResult.state as SignUpPasswordRequiredState).submitPassword(
            "valid-password",
        );

        expect(submitPasswordResult).toBeInstanceOf(SignUpSubmitPasswordResult);
        expect(submitPasswordResult.error).toBeUndefined();
        expect(submitPasswordResult.state?.type).toStrictEqual(AuthFlowStateType.Completed);

        const signInResult = await (submitPasswordResult.state as SignUpCompletedState).signIn();

        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.state?.type).toStrictEqual(AuthFlowStateType.Completed);
        expect(signInResult.data).toBeDefined();
        expect(signInResult.data).toBeInstanceOf(CustomAuthAccountData);
        expect(signInResult.data?.getAccount()?.idToken).toStrictEqual("test-id-token");
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
                    return {
                        correlation_id: correlationId,
                        token_type: "Bearer",
                        scopes: "test-scope",
                        expires_in: 3600,
                        id_token: "test-id-token",
                        access_token: "test-access-token",
                        refresh_token: "test-refresh-token",
                        client_info: "test-client-info",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            });

        const attributes = new UserAccountAttributes();
        attributes.setCity("test-city");

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            attributes: attributes,
        };

        const startResult = await app.signUp(signUpInputs);

        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.error).toBeUndefined();
        expect(startResult.state?.type).toStrictEqual(AuthFlowStateType.CodeRequired);

        const submitCodeResult = await (startResult.state as SignUpCodeRequiredState).submitCode("12345678");

        expect(submitCodeResult).toBeInstanceOf(SignUpSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.state?.type).toStrictEqual(AuthFlowStateType.AttributesRequired);
        expect((submitCodeResult.state as SignUpAttributesRequiredState)?.getRequiredAttributes().length).toBe(3);

        const requiredAttributes = new UserAccountAttributes();
        requiredAttributes.setDisplayName("test-display-name");
        const submitAttributesResult = await (submitCodeResult.state as SignUpAttributesRequiredState).submitAttributes(
            requiredAttributes,
        );

        expect(submitAttributesResult).toBeInstanceOf(SignUpSubmitAttributesResult);
        expect(submitAttributesResult.error).toBeUndefined();
        expect(submitAttributesResult.state?.type).toStrictEqual(AuthFlowStateType.Completed);

        const signInResult = await (submitAttributesResult.state as SignUpCompletedState).signIn();

        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.state?.type).toStrictEqual(AuthFlowStateType.Completed);
        expect(signInResult.data).toBeDefined();
        expect(signInResult.data).toBeInstanceOf(CustomAuthAccountData);
        expect(signInResult.data?.getAccount()?.idToken).toStrictEqual("test-id-token");
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
                    return {
                        correlation_id: correlationId,
                        token_type: "Bearer",
                        scopes: "test-scope",
                        expires_in: 3600,
                        id_token: "test-id-token",
                        access_token: "test-access-token",
                        refresh_token: "test-refresh-token",
                        client_info: "test-client-info",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            });

        const attributes = new UserAccountAttributes();
        attributes.setCity("test-city");

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            attributes: attributes,
        };

        const startResult = await app.signUp(signUpInputs);

        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.error).toBeUndefined();
        expect(startResult.state?.type).toStrictEqual(AuthFlowStateType.CodeRequired);

        const submitCodeResult = await (startResult.state as SignUpCodeRequiredState).submitCode("12345678");

        expect(submitCodeResult).toBeInstanceOf(SignUpSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.state?.type).toStrictEqual(AuthFlowStateType.PasswordRequired);

        const submitPasswordResult = await (submitCodeResult.state as SignUpPasswordRequiredState).submitPassword(
            "valid-password",
        );

        expect(submitPasswordResult).toBeInstanceOf(SignUpSubmitPasswordResult);
        expect(submitPasswordResult.error).toBeUndefined();
        expect(submitPasswordResult.state?.type).toStrictEqual(AuthFlowStateType.AttributesRequired);

        const requiredAttributes = new UserAccountAttributes();
        requiredAttributes.setDisplayName("test-display-name");
        const submitAttributesResult = await (
            submitPasswordResult.state as SignUpAttributesRequiredState
        ).submitAttributes(requiredAttributes);

        expect(submitAttributesResult).toBeInstanceOf(SignUpSubmitAttributesResult);
        expect(submitAttributesResult.error).toBeUndefined();
        expect(submitAttributesResult.state?.type).toStrictEqual(AuthFlowStateType.Completed);

        const signInResult = await (submitAttributesResult.state as SignUpCompletedState).signIn();

        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.state?.type).toStrictEqual(AuthFlowStateType.Completed);
        expect(signInResult.data).toBeDefined();
        expect(signInResult.data).toBeInstanceOf(CustomAuthAccountData);
        expect(signInResult.data?.getAccount()?.idToken).toStrictEqual("test-id-token");
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
                    return {
                        correlation_id: correlationId,
                        token_type: "Bearer",
                        scopes: "test-scope",
                        expires_in: 3600,
                        id_token: "test-id-token",
                        access_token: "test-access-token",
                        refresh_token: "test-refresh-token",
                        client_info: "test-client-info",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
                ok: true,
            });

        const attributes = new UserAccountAttributes();
        attributes.setCity("test-city");

        const signUpInputs: SignUpInputs = {
            username: "test@test.com",
            correlationId: correlationId,
            password: "valid-password",
            attributes: attributes,
        };

        const startResult = await app.signUp(signUpInputs);

        expect(startResult).toBeInstanceOf(SignUpResult);
        expect(startResult.error).toBeUndefined();
        expect(startResult.state?.type).toStrictEqual(AuthFlowStateType.CodeRequired);

        const submitCodeResult = await (startResult.state as SignUpCodeRequiredState).submitCode("12345678");

        expect(submitCodeResult).toBeInstanceOf(SignUpSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.state?.type).toStrictEqual(AuthFlowStateType.Completed);

        const signInResult = await (submitCodeResult.state as SignUpCompletedState).signIn();

        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.state?.type).toStrictEqual(AuthFlowStateType.Completed);
        expect(signInResult.data).toBeDefined();
        expect(signInResult.data).toBeInstanceOf(CustomAuthAccountData);
        expect(signInResult.data?.getAccount()?.idToken).toStrictEqual("test-id-token");
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
        expect(startResult.state?.type).toStrictEqual(AuthFlowStateType.Failed);
        expect(startResult.error?.isRedirect()).toBe(true);
    });

    it("should sign up failed if the given user is not found", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => {
                return {
                    error: "user_already_exists",
                    error_description: "It looks like you may already have an account.",
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
        expect(startResult.state?.type).toStrictEqual(AuthFlowStateType.Failed);
        expect(startResult.error?.isUserAlreadyExists()).toBe(true);
    });
});
