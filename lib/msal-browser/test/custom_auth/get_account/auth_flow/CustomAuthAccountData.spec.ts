import { CustomAuthBrowserConfiguration } from "../../../../src/custom_auth/configuration/CustomAuthConfiguration.js";
import { CustomAuthSilentCacheClient } from "../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { CustomAuthAccountData } from "../../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { SignOutResult } from "../../../../src/custom_auth/get_account/auth_flow/result/SignOutResult.js";
import { SignOutError } from "../../../../src/custom_auth/get_account/auth_flow/error_type/GetAccountError.js";
import { MsalCustomAuthError } from "../../../../src/custom_auth/core/error/MsalCustomAuthError.js";
import {
    AccountInfo,
    IdTokenClaims,
    InteractionRequiredAuthError,
    InteractionRequiredAuthErrorCodes,
    Logger,
} from "@azure/msal-common/browser";
import { AuthenticationResult } from "../../../../src/response/AuthenticationResult.js";
import { ServerError } from "@azure/msal-common";
import { INVALID_REQUEST } from "../../../../src/custom_auth/core/network_client/custom_auth_api/types/ApiErrorCodes.js";
import { AccessTokenRetrievalInputs } from "../../../../src/custom_auth/CustomAuthActionInputs.js";

describe("CustomAuthAccountData", () => {
    let mockAccount: AccountInfo;
    let mockConfig: CustomAuthBrowserConfiguration;
    let mockCacheClient: CustomAuthSilentCacheClient;
    let mockLogger: Logger;
    const correlationId = "test-correlation-id";
    let mockAuthenticationResult: AuthenticationResult;

    beforeEach(() => {
        mockAccount = {
            homeAccountId: "test-home-account-id",
            name: "Test User",
            username: "test.user@example.com",
            environment: "test-environment",
            localAccountId: "test-local-account-id",
            tenantId: "test-tenant-id",
            idToken: "test-id-token",
            idTokenClaims: {
                name: "Test User",
            },
        };

        mockAuthenticationResult = {
            authority: "test-authority",
            uniqueId: "test-unique-id",
            tenantId: "test-tenant-id",
            scopes: ["test-scope"],
            account: mockAccount,
            idToken: "test-id-token",
            idTokenClaims: mockAccount.idTokenClaims as IdTokenClaims,
            accessToken: "test-access-token",
            fromCache: true,
            expiresOn: new Date(),
            tokenType: "Bearer",
            correlationId: correlationId,
        } as AuthenticationResult;

        mockConfig = {
            auth: {
                authority: "test-authority",
            },
        } as CustomAuthBrowserConfiguration; // Mock as needed
        mockCacheClient = {
            acquireToken: jest.fn(),
            getCurrentAccount: jest.fn(),
            logout: jest.fn(),
        } as unknown as CustomAuthSilentCacheClient;
        mockLogger = {
            info: jest.fn(),
            verbose: jest.fn(),
            error: jest.fn(),
            errorPii: jest.fn(),
        } as unknown as Logger;
    });

    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks between tests
    });

    describe("signOut", () => {
        it("should sign out the user successfully", async () => {
            (mockCacheClient.getCurrentAccount as jest.Mock).mockReturnValue(
                mockAccount
            );

            const accountData = new CustomAuthAccountData(
                mockAccount,
                mockConfig,
                mockCacheClient,
                mockLogger,
                correlationId
            );
            const result = await accountData.signOut();

            expect(mockCacheClient.logout).toHaveBeenCalledWith({
                correlationId: correlationId,
                account: mockAccount,
            });
            expect(result).toBeInstanceOf(SignOutResult);
            expect(mockLogger.verbose).toHaveBeenCalledWith(
                "Signing out user",
                "test-correlation-id"
            );
            expect(mockLogger.verbose).toHaveBeenCalledWith(
                "User signed out",
                "test-correlation-id"
            );
        });

        it("should handle errors during sign out", async () => {
            const error = new Error("Sign out error");
            (mockCacheClient.getCurrentAccount as jest.Mock).mockReturnValue(
                mockAccount
            );
            (mockCacheClient.logout as jest.Mock).mockRejectedValue(error);

            const accountData = new CustomAuthAccountData(
                mockAccount,
                mockConfig,
                mockCacheClient,
                mockLogger,
                correlationId
            );
            const result = await accountData.signOut();

            expect(mockLogger.errorPii).toHaveBeenCalledWith(
                `An error occurred during sign out: '${error}'`,
                "test-correlation-id"
            );
            expect(result).toBeInstanceOf(SignOutResult);
            expect(result.error).toBeDefined();
        });

        it("should handle no cached account", async () => {
            (mockCacheClient.getCurrentAccount as jest.Mock).mockReturnValue(
                null
            );
            const accountData = new CustomAuthAccountData(
                mockAccount,
                mockConfig,
                mockCacheClient,
                mockLogger,
                correlationId
            );
            const result = await accountData.signOut();
            expect(result).toBeInstanceOf(SignOutResult);
            expect(result.error).toBeInstanceOf(SignOutError);
            expect(result.error?.isUserNotSignedIn()).toBe(true);
        });
    });

    describe("getAccount", () => {
        it("should return the account information", () => {
            const accountData = new CustomAuthAccountData(
                mockAccount,
                mockConfig,
                mockCacheClient,
                mockLogger,
                correlationId
            );
            const account = accountData.getAccount();
            expect(account).toEqual(mockAccount);
        });
    });

    describe("getIdToken", () => {
        it("should return the id token", () => {
            const accountData = new CustomAuthAccountData(
                mockAccount,
                mockConfig,
                mockCacheClient,
                mockLogger,
                correlationId
            );
            const idToken = accountData.getIdToken();
            expect(idToken).toEqual(mockAccount.idToken);
        });
    });

    describe("getClaims", () => {
        it("should return the token claims", () => {
            const accountData = new CustomAuthAccountData(
                mockAccount,
                mockConfig,
                mockCacheClient,
                mockLogger,
                correlationId
            );
            const claims = accountData.getClaims();
            expect(claims).toEqual(mockAccount.idTokenClaims);
        });
    });

    describe("getAccessToken", () => {
        let accountData: CustomAuthAccountData;
        beforeEach(() => {
            (mockCacheClient.getCurrentAccount as jest.Mock).mockReturnValue(
                mockAccount
            );
            accountData = new CustomAuthAccountData(
                mockAccount,
                mockConfig,
                mockCacheClient,
                mockLogger,
                correlationId
            );
        });

        it("should return succeed GetAccessTokenState.Completed with cached tokens", async () => {
            (mockCacheClient.acquireToken as jest.Mock).mockResolvedValue(
                mockAuthenticationResult
            );

            const response = await accountData.getAccessToken({
                forceRefresh: false,
            });

            expect(response).toBeDefined();
            expect(response.isCompleted()).toBe(true);
            expect(response.data?.account).toEqual(mockAccount);
            expect(response.data?.idToken).toEqual(
                mockAuthenticationResult.idToken
            );
        });

        it("should return GetAccessTokenError if there is an error when aquire tokens", async () => {
            const errorCode =
                InteractionRequiredAuthErrorCodes.refreshTokenExpired;
            const errorMessage = "Refresh token has expired.";
            const subError =
                "Refresh token has expired, can not use it to get a new access token.";
            const mockRefreshTokenExpiredError =
                new InteractionRequiredAuthError(
                    errorCode,
                    correlationId,
                    errorMessage,
                    subError
                );
            (mockCacheClient.acquireToken as jest.Mock).mockRejectedValue(
                mockRefreshTokenExpiredError
            );

            const response = await accountData.getAccessToken({
                forceRefresh: false,
            });

            expect(response).toBeDefined();
            expect(response.isFailed()).toBe(true);
            expect(response.error?.errorData).toEqual(
                mockRefreshTokenExpiredError
            );
            expect(response.error?.errorData).toBeInstanceOf(
                MsalCustomAuthError
            );

            const msalError = response.error?.errorData as MsalCustomAuthError;
            expect(msalError.error).toEqual(errorCode);
            expect(msalError.errorDescription).toEqual(errorMessage);
            expect(msalError.subError).toEqual(subError);
        });

        it("should include claims in getAccessToken when provided", async () => {
            (mockCacheClient.acquireToken as jest.Mock).mockResolvedValue(
                mockAuthenticationResult
            );

            const claims = JSON.stringify({
                access_token: {
                    acrs: {
                        essential: true,
                        value: "c1",
                    },
                },
            });

            const accessTokenRetrievalInputs: AccessTokenRetrievalInputs = {
                forceRefresh: false,
                scopes: ["test-scope"],
                claims: claims,
            };
            const response = await accountData.getAccessToken(
                accessTokenRetrievalInputs
            );

            expect(response).toBeDefined();
            expect(response.isCompleted()).toBe(true);
            expect(response.data?.account).toEqual(mockAccount);
            expect(response.data?.idToken).toEqual(
                mockAuthenticationResult.idToken
            );

            expect(mockCacheClient.acquireToken).toHaveBeenCalledWith(
                expect.objectContaining({
                    claims: claims,
                })
            );
        });
    });

    describe("password reset required error handling", () => {
        it("should wrap AADSTS50142 error with MsalCustomAuthError for password reset required", async () => {
            (mockCacheClient.getCurrentAccount as jest.Mock).mockReturnValue(
                mockAccount
            );

            const errorCode = INVALID_REQUEST;
            const errorMessage = "50142";
            const mockMSALServerError = new ServerError(
                errorCode,
                correlationId,
                errorMessage,
                "50142"
            );
            (mockCacheClient.acquireToken as jest.Mock).mockRejectedValue(
                mockMSALServerError
            );

            const accountData = new CustomAuthAccountData(
                mockAccount,
                mockConfig,
                mockCacheClient,
                mockLogger,
                correlationId
            );

            const response = await accountData.getAccessToken({
                forceRefresh: false,
            });

            expect(response).toBeDefined();
            expect(response.isFailed()).toBe(true);
            expect(response.error?.errorData).toEqual(mockMSALServerError);
            expect(response.error?.errorData).toBeInstanceOf(
                MsalCustomAuthError
            );

            const msalError = response.error?.errorData as MsalCustomAuthError;
            expect(msalError.error).toEqual(errorCode);
            expect(msalError.errorDescription).toEqual(errorMessage);
        });
    });
});
