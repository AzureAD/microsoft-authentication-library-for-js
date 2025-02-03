import { Constants } from "@azure/msal-browser";
import { ICustomAuthStandardController } from "../src/controller/ICustomAuthStandardController.js";
import { InvalidConfigurationError } from "../src/core/error/InvalidConfigurationError.js";
import { CustomAuthPublicClientApplication } from "../src/CustomAuthPublicClientApplication.js";
import { customAuthConfig } from "./test_resources/CustomAuthConfig.js";
import { CustomAuthError, SignUpResult } from "../src/index.js";
import { SignUpCompleted } from "../src/sign_up/auth_flow/state/SignUpCompleted.js";
import { SignUpCodeRequired } from "../src/sign_up/auth_flow/state/SignUpCodeRequired.js";
import { SignUpFailed } from "../src/sign_up/auth_flow/state/SignUpFailed.js";

describe("CustomAuthPublicClientApplication", () => {
    let mockController: jest.Mocked<ICustomAuthStandardController>;

    beforeEach(() => {
        mockController = {
            signIn: jest.fn(),
            signUp: jest.fn(),
        } as unknown as jest.Mocked<ICustomAuthStandardController>;
    });

    describe("constructor and config validation", () => {
        it("should throw an error if the config is null", async () => {
            await expect(
                CustomAuthPublicClientApplication.create(null as any),
            ).rejects.toThrow(InvalidConfigurationError);
        });

        it("should throw an error if the authority is missing", async () => {
            const invalidConfig = { auth: {}, customAuth: {} } as any;

            await expect(
                CustomAuthPublicClientApplication.create(invalidConfig),
            ).rejects.toThrow(InvalidConfigurationError);
        });

        it("should throw an error if the authority is not a CIAM authority", async () => {
            const invalidConfig = {
                auth: { authority: "https://invalid.example.com" },
                customAuth: {},
            };

            await expect(
                CustomAuthPublicClientApplication.create(invalidConfig as any),
            ).rejects.toThrow(InvalidConfigurationError);
        });

        it("should throw an error if the authApiProxyUrl is not secure", async () => {
            const invalidConfig = {
                auth: {
                    authority: `https://example${Constants.CIAM_AUTH_URL}`,
                },
                customAuth: {
                    authApiProxyUrl: "http://insecure.example.com",
                },
            };

            await expect(
                CustomAuthPublicClientApplication.create(invalidConfig as any),
            ).rejects.toThrow(InvalidConfigurationError);
        });

        it("should create an instance if the config is valid", async () => {
            const app =
                await CustomAuthPublicClientApplication.create(
                    customAuthConfig,
                );

            expect(app).toBeInstanceOf(CustomAuthPublicClientApplication);
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
                mockSignInResult as any,
            );

            const app = await CustomAuthPublicClientApplication.create(
                customAuthConfig,
                mockController,
            );

            const result = await app.signIn(mockSignInInputs);

            expect(mockController.signIn).toHaveBeenCalledWith(
                mockSignInInputs,
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
                new CustomAuthError("test-error"),
            );

            mockController.signUp.mockResolvedValueOnce(
                mockSignUpResult as any,
            );

            const app = await CustomAuthPublicClientApplication.create(
                customAuthConfig,
                mockController,
            );

            const result = await app.signUp(mockSignUpInputs);

            expect(mockController.signUp).toHaveBeenCalledWith(
                mockSignUpInputs,
            );
            expect(result).toEqual(mockSignUpResult);
        });
    });
});
