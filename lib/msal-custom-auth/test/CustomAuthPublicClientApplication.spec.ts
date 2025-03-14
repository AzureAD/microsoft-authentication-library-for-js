import { Constants } from "@azure/msal-browser";
import { ICustomAuthStandardController } from "../src/controller/ICustomAuthStandardController.js";
import { InvalidConfigurationError } from "../src/core/error/InvalidConfigurationError.js";
import { CustomAuthPublicClientApplication } from "../src/CustomAuthPublicClientApplication.js";
import { customAuthConfig } from "./test_resources/CustomAuthConfig.js";
import { SignUpResult } from "../src/sign_up/auth_flow/result/SignUpResult.js";
import { CustomAuthError } from "../src/core/error/CustomAuthError.js";
import { ResetPasswordStartResult } from "../src/reset_password/auth_flow/result/ResetPasswordStartResult.js";
import { GetAccountResult } from "../src/get_account/auth_flow/result/GetAccountResult.js";
import { CustomAuthStandardController } from "../src/controller/CustomAuthStandardController.js";

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
            await expect(CustomAuthPublicClientApplication.create(null as any)).rejects.toThrow(
                InvalidConfigurationError,
            );
        });

        it("should throw an error if the authority is missing", async () => {
            const invalidConfig = { auth: {}, customAuth: {} } as any;

            await expect(CustomAuthPublicClientApplication.create(invalidConfig)).rejects.toThrow(
                InvalidConfigurationError,
            );
        });

        it("should throw an error if the authority is not a CIAM authority", async () => {
            const invalidConfig = {
                auth: { authority: "https://invalid.example.com" },
                customAuth: {},
            };

            await expect(CustomAuthPublicClientApplication.create(invalidConfig as any)).rejects.toThrow(
                InvalidConfigurationError,
            );
        });

        it("should create an instance if the config is valid", async () => {
            const app = await CustomAuthPublicClientApplication.create(customAuthConfig);

            expect(app).toBeInstanceOf(CustomAuthPublicClientApplication);

            ((app as CustomAuthPublicClientApplication)["customAuthController"] as CustomAuthStandardController)[
                "eventHandler"
            ]["broadcastChannel"].close();
        });
    });

    describe("signIn", () => {
        it("should call the customAuthController signIn method with correct inputs", async () => {
            const mockSignInInputs = {
                username: "testuser",
                password: "testpassword",
            };

            const mockSignInResult = { accessToken: "test-token" };

            mockController.signIn.mockResolvedValueOnce(mockSignInResult as any);

            const app = await CustomAuthPublicClientApplication.create(customAuthConfig, mockController);

            const result = await app.signIn(mockSignInInputs);

            expect(mockController.signIn).toHaveBeenCalledWith(mockSignInInputs);
            expect(result).toEqual(mockSignInResult);
        });
    });

    describe("signUp", () => {
        it("should call the customAuthController signUp method with correct inputs", async () => {
            const mockSignUpInputs = {
                username: "testuser",
                password: "testpassword",
            };

            const mockSignUpResult = SignUpResult.createWithError(new CustomAuthError("test-error"));

            mockController.signUp.mockResolvedValueOnce(mockSignUpResult as any);

            const app = await CustomAuthPublicClientApplication.create(customAuthConfig, mockController);

            const result = await app.signUp(mockSignUpInputs);

            expect(mockController.signUp).toHaveBeenCalledWith(mockSignUpInputs);
            expect(result).toEqual(mockSignUpResult);
        });
    });

    describe("resetPassword", () => {
        it("should call the customAuthController resetPassword method with correct inputs", async () => {
            const mockResetPasswordInputs = {
                username: "testuser",
            };

            const mockResetPasswordResult = ResetPasswordStartResult.createWithError(new CustomAuthError("test-error"));

            mockController.resetPassword.mockResolvedValueOnce(mockResetPasswordResult as any);

            const app = await CustomAuthPublicClientApplication.create(customAuthConfig, mockController);

            const result = await app.resetPassword(mockResetPasswordInputs);

            expect(mockController.resetPassword).toHaveBeenCalledWith(mockResetPasswordInputs);
            expect(result).toEqual(mockResetPasswordResult);
        });
    });

    describe("getCurrentAccount", () => {
        it("should call the customAuthController getCurrentAccount method with correct inputs", async () => {
            const mockGetCurrentAccountInputs = {
                correlationId: "test-id",
            };

            const mockGetCurrentAccountResult = GetAccountResult.createWithError(new CustomAuthError("test-error"));

            mockController.getCurrentAccount.mockReturnValue(mockGetCurrentAccountResult as any);

            const app = await CustomAuthPublicClientApplication.create(customAuthConfig, mockController);

            const result = await app.getCurrentAccount(mockGetCurrentAccountInputs);

            expect(mockController.getCurrentAccount).toHaveBeenCalledWith(mockGetCurrentAccountInputs);
            expect(result).toEqual(mockGetCurrentAccountResult);
        });
    });
});
