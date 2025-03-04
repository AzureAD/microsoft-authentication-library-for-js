import {
    AccountInfo,
    AuthenticationResult,
    Logger,
    InteractionRequiredAuthError,
    InteractionRequiredAuthErrorCodes,
} from "@azure/msal-browser";
import { CustomAuthBrowserConfiguration } from "../../../src/configuration/CustomAuthConfiguration.js";
import { CustomAuthSilentCacheClient } from "../../../src/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { CustomAuthAccountData } from "../../../src/get_account/auth_flow/CustomAuthAccountData.js";
import { SignOutResult } from "../../../src/get_account/auth_flow/result/SignOutResult.js";
import { SignOutError } from "../../../src/get_account/auth_flow/error_type/GetAccountError.js";
import { IdTokenClaims } from "../../../../msal-common/dist/exports-common.js";
import { GetAccessTokenState } from "../../../src/core/auth_flow/AuthFlowStateBase.js";
import { MsalCustomAuthError } from "../../../src/core/error/MsalCustomAuthError.js";

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
            error: jest.fn(),
            errorPii: jest.fn(),
        } as unknown as Logger;
    });

    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks between tests
    });

    describe("signOut", () => {
        it("should sign out the user successfully", async () => {
            (mockCacheClient.getCurrentAccount as jest.Mock).mockReturnValue(mockAccount);

            const accountData = new CustomAuthAccountData(
                mockAccount,
                mockConfig,
                mockCacheClient,
                mockLogger,
                correlationId,
            );
            const result = await accountData.signOut();

            expect(mockCacheClient.logout).toHaveBeenCalledWith({
                correlationId: correlationId,
                account: mockAccount,
            });
            expect(result).toBeInstanceOf(SignOutResult);
            expect(mockLogger.info).toHaveBeenCalledWith("Signing out user", "test-correlation-id");
            expect(mockLogger.info).toHaveBeenCalledWith("User signed out", "test-correlation-id");
        });

        it("should handle errors during sign out", async () => {
            const error = new Error("Sign out error");
            (mockCacheClient.getCurrentAccount as jest.Mock).mockReturnValue(mockAccount);
            (mockCacheClient.logout as jest.Mock).mockRejectedValue(error);

            const accountData = new CustomAuthAccountData(
                mockAccount,
                mockConfig,
                mockCacheClient,
                mockLogger,
                correlationId,
            );
            const result = await accountData.signOut();

            expect(mockLogger.errorPii).toHaveBeenCalledWith(
                `An error occurred during sign out: ${error}`,
                "test-correlation-id",
            );
            expect(result).toBeInstanceOf(SignOutResult);
            expect(result.error).toBeDefined();
        });

        it("should handle no cached account", async () => {
            (mockCacheClient.getCurrentAccount as jest.Mock).mockReturnValue(null);
            const accountData = new CustomAuthAccountData(
                mockAccount,
                mockConfig,
                mockCacheClient,
                mockLogger,
                correlationId,
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
                correlationId,
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
                correlationId,
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
                correlationId,
            );
            const claims = accountData.getClaims();
            expect(claims).toEqual(mockAccount.idTokenClaims);
        });
    });

    describe("getAccessToken", () => {
        it("should return succeed GetAccessTokenState.Completed with cached tokens", async () => {
            (mockCacheClient.getCurrentAccount as jest.Mock).mockReturnValue(mockAccount);
            jest.spyOn(CustomAuthAccountData.prototype as any, "createCommonSilentFlowRequest").mockReturnValue({});
            (mockCacheClient.acquireToken as jest.Mock).mockResolvedValue(mockAuthenticationResult);
            const accountData = new CustomAuthAccountData(
                mockAccount,
                mockConfig,
                mockCacheClient,
                mockLogger,
                correlationId,
            );

            const response = await accountData.getAccessToken();

            expect(response).toBeDefined();
            expect(response.state?.type).toEqual(GetAccessTokenState.Completed);
            expect(response.data?.account).toEqual(mockAccount);
            expect(response.data?.idToken).toEqual(mockAuthenticationResult.idToken);
        });

        it("should return GetAccessTokenError if there is an error when aquire tokens", async () => {
            (mockCacheClient.getCurrentAccount as jest.Mock).mockReturnValue(mockAccount);
            const errorCode = InteractionRequiredAuthErrorCodes.refreshTokenExpired;
            const errorMessage = "Refresh token has expired.";
            const subError = "Refresh token has expired, can not use it to get a new access token.";
            const mockRefreshTokenExpiredError = new InteractionRequiredAuthError(errorCode, errorMessage, subError);
            (mockCacheClient.acquireToken as jest.Mock).mockRejectedValue(mockRefreshTokenExpiredError);

            const accountData = new CustomAuthAccountData(
                mockAccount,
                mockConfig,
                mockCacheClient,
                mockLogger,
                correlationId,
            );

            const response = await accountData.getAccessToken();

            expect(response).toBeDefined();
            expect(response.state?.type).toEqual(GetAccessTokenState.Failed);
            expect(response.error?.errorData).toEqual(mockRefreshTokenExpiredError);
            expect(response.error?.errorData).toBeInstanceOf(MsalCustomAuthError);

            const msalError = response.error?.errorData as MsalCustomAuthError;
            expect(msalError.error).toEqual(errorCode);
            expect(msalError.errorDescription).toEqual(errorMessage);
            expect(msalError.subError).toEqual(subError);
        });
    });
});
