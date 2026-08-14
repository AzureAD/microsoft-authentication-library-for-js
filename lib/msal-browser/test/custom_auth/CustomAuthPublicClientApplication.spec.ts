import { ICustomAuthStandardController } from "../../src/custom_auth/controller/ICustomAuthStandardController.js";
import { InvalidConfigurationError } from "../../src/custom_auth/core/error/InvalidConfigurationError.js";
import { CustomAuthPublicClientApplication } from "../../src/custom_auth/CustomAuthPublicClientApplication.js";
import { customAuthConfig } from "./test_resources/CustomAuthConfig.js";
import { SignUpResult } from "../../src/custom_auth/sign_up/auth_flow/result/SignUpResult.js";
import { CustomAuthError } from "../../src/custom_auth/core/error/CustomAuthError.js";
import { ResetPasswordStartResult } from "../../src/custom_auth/reset_password/auth_flow/result/ResetPasswordStartResult.js";
import { GetAccountResult } from "../../src/custom_auth/get_account/auth_flow/result/GetAccountResult.js";
import { CustomAuthStandardController } from "../../src/custom_auth/controller/CustomAuthStandardController.js";
import { MethodNotImplementedError } from "../../src/custom_auth/core/error/MethodNotImplementedError.js";

describe("CustomAuthPublicClientApplication", () => {
    let mockController: jest.Mocked<ICustomAuthStandardController>;

    beforeEach(() => {
        mockController = {
            signIn: jest.fn(),
            signUp: jest.fn(),
            resetPassword: jest.fn(),
            getCurrentAccount: jest.fn(),
        } as unknown as jest.Mocked<ICustomAuthStandardController>;
    });

    describe("constructor and config validation", () => {
        it("should throw an error if the config is null", async () => {
            await expect(
                CustomAuthPublicClientApplication.create(null as any)
            ).rejects.toThrow(InvalidConfigurationError);
        });

        it("should throw an error if the authority is missing", async () => {
            const invalidConfig = { auth: {}, customAuth: {} } as any;

            await expect(
                CustomAuthPublicClientApplication.create(invalidConfig)
            ).rejects.toThrow(InvalidConfigurationError);
        });

        it("should throw an error if challenge type is invalid", async () => {
            const invalidConfig = {
                auth: { authority: customAuthConfig.auth.authority },
                customAuth: {
                    challengeTypes: ["invalid-challenge-type", "oob"],
                },
            };

            await expect(
                CustomAuthPublicClientApplication.create(invalidConfig as any)
            ).rejects.toThrow(InvalidConfigurationError);
        });

        it("should accept valid capabilities configuration", async () => {
            const validConfig = {
                auth: {
                    authority: customAuthConfig.auth.authority,
                    clientId: customAuthConfig.auth.clientId,
                },
                customAuth: {
                    authApiProxyUrl:
                        customAuthConfig.customAuth.authApiProxyUrl,
                    capabilities: ["mfa_required", "registration_required"],
                },
            };

            const app = await CustomAuthPublicClientApplication.create(
                validConfig
            );
            expect(app).toBeInstanceOf(CustomAuthPublicClientApplication);

            const controller = (app as CustomAuthPublicClientApplication)[
                "customAuthController"
            ] as CustomAuthStandardController;
            controller["eventHandler"]["broadcastChannel"]?.close();
        });

        it("should accept empty capabilities array", async () => {
            const validConfig = {
                auth: {
                    authority: customAuthConfig.auth.authority,
                    clientId: customAuthConfig.auth.clientId,
                },
                customAuth: {
                    authApiProxyUrl:
                        customAuthConfig.customAuth.authApiProxyUrl,
                    capabilities: [],
                },
            };

            const app = await CustomAuthPublicClientApplication.create(
                validConfig
            );
            expect(app).toBeInstanceOf(CustomAuthPublicClientApplication);

            const controller = (app as CustomAuthPublicClientApplication)[
                "customAuthController"
            ] as CustomAuthStandardController;
            controller["eventHandler"]["broadcastChannel"]?.close();
        });

        it("should accept configuration without capabilities (backward compatibility)", async () => {
            const validConfig = {
                auth: {
                    authority: customAuthConfig.auth.authority,
                    clientId: customAuthConfig.auth.clientId,
                },
                customAuth: {
                    authApiProxyUrl:
                        customAuthConfig.customAuth.authApiProxyUrl,
                    // No capabilities property - should be backward compatible
                },
            };

            const app = await CustomAuthPublicClientApplication.create(
                validConfig
            );
            expect(app).toBeInstanceOf(CustomAuthPublicClientApplication);

            const controller = (app as CustomAuthPublicClientApplication)[
                "customAuthController"
            ] as CustomAuthStandardController;
            controller["eventHandler"]["broadcastChannel"]?.close();
        });

        it("should create an instance if the config is valid", async () => {
            const app = await CustomAuthPublicClientApplication.create(
                customAuthConfig
            );

            expect(app).toBeInstanceOf(CustomAuthPublicClientApplication);

            const controller = (app as CustomAuthPublicClientApplication)[
                "customAuthController"
            ] as CustomAuthStandardController;
            controller["eventHandler"]["broadcastChannel"]?.close();
        });
    });

    describe("signIn", () => {
        it("should call the customAuthController signIn method with correct inputs", async () => {
            const mockSignInInputs = {
                username: "testuser",
                password: "testpassword",
            };

            const mockSignInResult = { accessToken: "test-token" };

            mockController.signIn.mockResolvedValueOnce(
                mockSignInResult as any
            );

            const app = await CustomAuthPublicClientApplication.create(
                customAuthConfig
            );

            (app as any)["customAuthController"] = mockController;

            const result = await app.signIn(mockSignInInputs);

            expect(mockController.signIn).toHaveBeenCalledWith(
                mockSignInInputs
            );
            expect(result).toEqual(mockSignInResult);
        });
    });

    describe("signUp", () => {
        it("should call the customAuthController signUp method with correct inputs", async () => {
            const mockSignUpInputs = {
                username: "testuser",
                password: "testpassword",
            };

            const mockSignUpResult = SignUpResult.createWithError(
                new CustomAuthError("test-error")
            );

            mockController.signUp.mockResolvedValueOnce(
                mockSignUpResult as any
            );

            const app = await CustomAuthPublicClientApplication.create(
                customAuthConfig
            );

            (app as any)["customAuthController"] = mockController;

            const result = await app.signUp(mockSignUpInputs);

            expect(mockController.signUp).toHaveBeenCalledWith(
                mockSignUpInputs
            );
            expect(result).toEqual(mockSignUpResult);
        });
    });

    describe("resetPassword", () => {
        it("should call the customAuthController resetPassword method with correct inputs", async () => {
            const mockResetPasswordInputs = {
                username: "testuser",
            };

            const mockResetPasswordResult =
                ResetPasswordStartResult.createWithError(
                    new CustomAuthError("test-error")
                );

            mockController.resetPassword.mockResolvedValueOnce(
                mockResetPasswordResult as any
            );

            const app = await CustomAuthPublicClientApplication.create(
                customAuthConfig
            );

            (app as any)["customAuthController"] = mockController;

            const result = await app.resetPassword(mockResetPasswordInputs);

            expect(mockController.resetPassword).toHaveBeenCalledWith(
                mockResetPasswordInputs
            );
            expect(result).toEqual(mockResetPasswordResult);
        });
    });

    describe("resetPasswordV2", () => {
        it("should delegate to the controller resetPasswordV2 with correct inputs", async () => {
            const mockResetPasswordV2Inputs = {
                username: "testuser",
            };

            const mockResetPasswordV2Result = { state: { stateType: "failed" } };

            const app = await CustomAuthPublicClientApplication.create(
                customAuthConfig
            );

            const controllerMock = {
                resetPasswordV2: jest
                    .fn()
                    .mockResolvedValueOnce(mockResetPasswordV2Result),
            };
            (app as any)["customAuthController"] = controllerMock;

            const result = await app.resetPasswordV2(
                mockResetPasswordV2Inputs
            );

            expect(controllerMock.resetPasswordV2).toHaveBeenCalledWith(
                mockResetPasswordV2Inputs
            );
            expect(result).toEqual(mockResetPasswordV2Result);
        });

        it("should throw MethodNotImplementedError from the real controller stub", async () => {
            const app = await CustomAuthPublicClientApplication.create(
                customAuthConfig
            );

            const controller = (app as CustomAuthPublicClientApplication)[
                "customAuthController"
            ] as CustomAuthStandardController;

            try {
                await expect(
                    app.resetPasswordV2({ username: "testuser" })
                ).rejects.toThrow(MethodNotImplementedError);
            } finally {
                controller["eventHandler"]["broadcastChannel"]?.close();
            }
        });
    });

    describe("getCurrentAccount", () => {
        it("should call the customAuthController getCurrentAccount method with correct inputs", async () => {
            const mockGetCurrentAccountInputs = {
                correlationId: "test-id",
            };

            const mockGetCurrentAccountResult =
                GetAccountResult.createWithError(
                    new CustomAuthError("test-error")
                );

            mockController.getCurrentAccount.mockReturnValue(
                mockGetCurrentAccountResult as any
            );

            const app = await CustomAuthPublicClientApplication.create(
                customAuthConfig
            );

            (app as any)["customAuthController"] = mockController;

            const result = await app.getCurrentAccount(
                mockGetCurrentAccountInputs
            );

            expect(mockController.getCurrentAccount).toHaveBeenCalledWith(
                mockGetCurrentAccountInputs
            );
            expect(result).toEqual(mockGetCurrentAccountResult);
        });
    });
});
