/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "../../src/account/auth_flow/model/AccountInfo.js";
import { CustomAuthPublicClientApplication } from "../../src/CustomAuthPublicClientApplication.js";
import { ICustomAuthPublicClientApplication } from "../../src/ICustomAuthPublicClientApplication.js";
import { SignInResult } from "../../src/sign_in/auth_flow/result/SignInResult.js";
import { SignInSubmitCodeResult } from "../../src/sign_in/auth_flow/result/SignInSubmitCodeResult.js";
import { SignInSubmitPasswordResult } from "../../src/sign_in/auth_flow/result/SignInSubmitPasswordResult.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { SignInState } from "../../src/core/auth_flow/AuthFlowStateBase.js";
import { AuthFlowStateHandlerFactory } from "../../src/core/auth_flow/AuthFlowStateHandlerFactory.js";
import { SignInCodeRequired } from "../../src/sign_in/auth_flow/state/SignInCodeRequired.js";
import { SignInPasswordRequired } from "../../src/sign_in/auth_flow/state/SignInPasswordRequired.js";
import { ok } from "assert";

describe("Sign in", () => {
    let app: ICustomAuthPublicClientApplication;
    const correlationId = "test-correlation-id";

    beforeEach(async () => {
        app = await CustomAuthPublicClientApplication.create(customAuthConfig);

        global.fetch = jest.fn(); // Mock the fetch API
    });

    afterEach(() => {
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
                return {
                    correlation_id: correlationId,
                    token_type: "Bearer",
                    scopes: "test-scope",
                    expires_in: 3600,
                    id_token: "test-id-token",
                    access_token: "test-access-token",
                    refresh_token: "test-refresh-token",
                };
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
        expect(result.state?.type).toStrictEqual(SignInState.Completed);
        expect(result.data).toBeDefined();
        expect(result.data).toBeInstanceOf(AccountInfo);
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
                    token_type: "Bearer",
                    scopes: "test-scope",
                    expires_in: 3600,
                    id_token: "test-id-token",
                    access_token: "test-access-token",
                    refresh_token: "test-refresh-token",
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
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.state?.type).toStrictEqual(SignInState.CodeRequired);

        const state = signInResult.state as SignInCodeRequired;
        const handler = AuthFlowStateHandlerFactory.create(state);

        const submitCodeResult = await handler.submitCode("valid-code");

        expect(submitCodeResult).toBeDefined();
        expect(submitCodeResult).toBeInstanceOf(SignInSubmitCodeResult);
        expect(submitCodeResult.data).toBeInstanceOf(AccountInfo);
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
                return {
                    correlation_id: correlationId,
                    token_type: "Bearer",
                    scopes: "test-scope",
                    expires_in: 3600,
                    id_token: "test-id-token",
                    access_token: "test-access-token",
                    refresh_token: "test-refresh-token",
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
        expect(signInResult.error).toBeUndefined();
        expect(signInResult.state?.type).toStrictEqual(SignInState.PasswordRequired);

        const state = signInResult.state as SignInPasswordRequired;
        const handler = AuthFlowStateHandlerFactory.create(state);

        const submitCodeResult = await handler.submitPassword("valid-password");

        expect(submitCodeResult).toBeDefined();
        expect(submitCodeResult).toBeInstanceOf(SignInSubmitPasswordResult);
        expect(submitCodeResult.data).toBeInstanceOf(AccountInfo);
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
        expect(signInResult.state?.type).toStrictEqual(SignInState.Failed);
        expect(signInResult.error?.isRedirect()).toBe(true);
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
        expect(signInResult.state?.type).toStrictEqual(SignInState.Failed);
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
                    error_description: "AADSTS901007: Error validating credentials due to invalid username or password.",
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
        expect(signInResult.state?.type).toStrictEqual(SignInState.Failed);
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
                    error_description: "AADSTS901007: Error validating credentials due to invalid username or password.",
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
        expect(signInResult.state?.type).toStrictEqual(SignInState.CodeRequired);

        const state = signInResult.state as SignInCodeRequired;
        const handler = AuthFlowStateHandlerFactory.create(state);

        const submitCodeResult = await handler.submitCode("invalid-code");

        expect(submitCodeResult).toBeDefined();
        expect(submitCodeResult).toBeInstanceOf(SignInSubmitCodeResult);
        expect(submitCodeResult.error).toBeDefined();
        expect(submitCodeResult.error?.isInvalidCode()).toBe(true);
    });
});
