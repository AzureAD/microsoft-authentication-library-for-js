/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "../../src/account/auth_flow/model/AccountInfo.js";
import { CustomAuthPublicClientApplication } from "../../src/CustomAuthPublicClientApplication.js";
import { ICustomAuthPublicClientApplication } from "../../src/ICustomAuthPublicClientApplication.js";
import { ResetPasswordStartResult } from "../../src/reset_password/auth_flow/result/ResetPasswordStartResult.js";
import { ResetPasswordSubmitCodeResult } from "../../src/reset_password/auth_flow/result/ResetPasswordSubmitCodeResult.js";
import { ResetPasswordSubmitPasswordResult } from "../../src/reset_password/auth_flow/result/ResetPasswordSubmitPasswordResult.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { ResetPasswordState, SignInState } from "../../src/core/auth_flow/AuthFlowStateBase.js";
import { AuthFlowStateHandlerFactory } from "../../src/core/auth_flow/AuthFlowStateHandlerFactory.js";
import { ResetPasswordCodeRequired } from "../../src/reset_password/auth_flow/state/ResetPasswordCodeRequired.js";
import { ResetPasswordPasswordRequired } from "../../src/reset_password/auth_flow/state/ResetPasswordPasswordRequired.js";
import { ResetPasswordCompleted } from "../../src/reset_password/auth_flow/state/ResetPasswordCompleted.js";
import { SignInResult } from "../../src/sign_in/auth_flow/result/SignInResult.js";

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

describe("Reset password", () => {
    let app: ICustomAuthPublicClientApplication;
    const correlationId = "test-correlation-id";

    beforeEach(async () => {
        app = await CustomAuthPublicClientApplication.create(customAuthConfig);

        global.fetch = jest.fn(); // Mock the fetch API
    });

    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks between tests
    });

    it("should reset password successfully if the new password is valid", async () => {
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

        const resetPasswordInputs = {
            username: "test@test.com",
            correlationId: correlationId,
        };

        const startResult = await app.resetPassword(resetPasswordInputs);

        expect(startResult).toBeInstanceOf(ResetPasswordStartResult);
        expect(startResult.error).toBeUndefined();
        expect(startResult.state?.type).toStrictEqual(ResetPasswordState.CodeRequired);
        expect((startResult.state as ResetPasswordCodeRequired)?.continuationToken).toStrictEqual(
            "test-continuation-token-2",
        );

        const codeRequiredHandler = AuthFlowStateHandlerFactory.create(startResult.state as ResetPasswordCodeRequired);
        const submitCodeResult = await codeRequiredHandler.submitCode("12345678");

        expect(submitCodeResult).toBeInstanceOf(ResetPasswordSubmitCodeResult);
        expect(submitCodeResult.error).toBeUndefined();
        expect(submitCodeResult.state?.type).toStrictEqual(ResetPasswordState.PasswordRequired);
        expect((submitCodeResult.state as ResetPasswordPasswordRequired)?.continuationToken).toStrictEqual(
            "test-continuation-token-3",
        );

        const passwordRequiredHandler = AuthFlowStateHandlerFactory.create(
            submitCodeResult.state as ResetPasswordPasswordRequired,
        );
        const submitPasswordResult = await passwordRequiredHandler.submitNewPassword("valid-password");

        expect(submitPasswordResult).toBeInstanceOf(ResetPasswordSubmitPasswordResult);
        expect(submitPasswordResult.error).toBeUndefined();
        expect(submitPasswordResult.state?.type).toStrictEqual(ResetPasswordState.Completed);
        expect((submitPasswordResult.state as ResetPasswordCompleted)?.continuationToken).toStrictEqual(
            "test-continuation-token-5",
        );

        const signInHandler = AuthFlowStateHandlerFactory.create(submitPasswordResult.state as ResetPasswordCompleted);
        const signInResult = await signInHandler.signIn();

        expect(signInResult).toBeInstanceOf(SignInResult);
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.state?.type).toStrictEqual(SignInState.Completed);
        expect(signInResult.data).toBeDefined();
        expect(signInResult.data).toBeInstanceOf(AccountInfo);
        expect(signInResult.data?.getAccount()?.idToken).toStrictEqual("test-id-token");
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
        expect(startResult.state?.type).toStrictEqual(ResetPasswordState.Failed);
        expect(startResult.error?.isRedirect()).toBe(true);
    });

    it("should reset password failed if the given user is not found", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            status: 400,
            json: async () => {
                return {
                    error: "user_not_found",
                    error_description: "The user account could not be found. Please check the username and try again.",
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
        expect(startResult.state?.type).toStrictEqual(ResetPasswordState.Failed);
        expect(startResult.error?.isUserNotFound()).toBe(true);
    });
});
