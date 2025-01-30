import { CustomAuthStandardController } from "../../src/controller/CustomAuthStandardController.js";
import { SignInInputs } from "../../src/CustomAuthActionInputs.js";
import { CustomAuthOperatingContext } from "../../src/operating_context/CustomAuthOperatingContext.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { SignInError } from "../../src/sign_in/auth_flow/error_type/SignInError.js";
import { SignInResult } from "../../src/sign_in/auth_flow/result/SignInResult.js";
import { SignInCodeRequiredStateHandler } from "../../src/sign_in/auth_flow/state_handler/SignInCodeRequiredStateHandler.js";
import { SignInPasswordRequiredStateHandler } from "../../src/sign_in/auth_flow/state_handler/SignInPasswordRequiredStateHandler.js";
import { SignInState } from "../../src/core/auth_flow/AuthFlowStateBase.js";
import { AccountInfo } from "../../src/account/auth_flow/model/AccountInfo.js";

describe("CustomAuthStandardController", () => {
    let controller: CustomAuthStandardController;

    beforeEach(() => {
        const context = new CustomAuthOperatingContext(customAuthConfig);
        controller = new CustomAuthStandardController(context);

        global.fetch = jest.fn(); // Mock the fetch API
    });

    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks between tests
    });

    describe("signIn", () => {
        it("should return error result if provided username is invalid", async () => {
            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "",
            };

            const result = await controller.signIn(signInInputs);

            expect(result.error).toBeDefined();
            expect(result.error).toBeInstanceOf(SignInError);

            expect(result.error?.isInvalidUsername()).toBe(true);
        });

        it("should return code required result if the challenge type is oob", async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        correlation_id: "test-correlation-id",
                        continuation_token: "test-continuation-token-1",
                        challenge_type: "oob password redirect",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
            });

            (fetch as jest.Mock).mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        correlation_id: "test-correlation-id",
                        continuation_token: "test-continuation-token-2",
                        challenge_type: "oob",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
            });

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeUndefined();
            expect(result.state?.type).toStrictEqual(SignInState.CodeRequired);
        });

        it("should return password required result if the challenge type is password", async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        correlation_id: "test-correlation-id",
                        continuation_token: "test-continuation-token-1",
                        challenge_type: "oob password redirect",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
            });

            (fetch as jest.Mock).mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        correlation_id: "test-correlation-id",
                        continuation_token: "test-continuation-token-2",
                        challenge_type: "password",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
            });

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeUndefined();
            expect(result.state?.type).toStrictEqual(
                SignInState.PasswordRequired,
            );
        });

        it("should return correct completed result if the challenge type is password and password is provided", async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        correlation_id: "test-correlation-id",
                        continuation_token: "test-continuation-token-1",
                        challenge_type: "oob password redirect",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
            });

            (fetch as jest.Mock).mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        correlation_id: "test-correlation-id",
                        continuation_token: "test-continuation-token-2",
                        challenge_type: "password",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
            });

            (fetch as jest.Mock).mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        correlation_id: "test-correlation-id",
                        token_type: "Bearer",
                        scopes: "test-scope",
                        expires_in: 3600,
                        id_token: "test-id-token",
                        access_token: "test-access-token",
                        refresh_token: "test-refresh-token",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
            });

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
                password: "test-password",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeUndefined();
            expect(result.state?.type).toStrictEqual(SignInState.Completed);
            expect(result.data).toBeDefined();
            expect(result.data).toBeInstanceOf(AccountInfo);
        });

        it("should return failed result if the challenge type is redirect", async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                status: 200,
                json: async () => {
                    return {
                        correlation_id: "test-correlation-id",
                        continuation_token: "test-continuation-token-1",
                        challenge_type: "redirect",
                    };
                },
                headers: new Headers({ "content-type": "application/json" }),
            });

            const signInInputs: SignInInputs = {
                correlationId: "correlation-id",
                username: "test@test.com",
                password: "test-password",
            };

            const result = await controller.signIn(signInInputs);

            expect(result).toBeInstanceOf(SignInResult);
            expect(result.error).toBeDefined();
            expect(result.error?.errorData).toBeDefined();
            expect(result.error?.isRedirect()).toEqual(true);
            expect(result.state?.type).toStrictEqual(SignInState.Failed);
        });
    });
});
