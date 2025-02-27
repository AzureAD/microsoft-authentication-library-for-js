import { AccountInfo, AuthenticationResult, Logger } from "@azure/msal-browser";
import { CustomAuthBrowserConfiguration } from "../../../src/configuration/CustomAuthConfiguration.js";
import { CustomAuthSilentCacheClient } from "../../../src/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { CustomAuthAccountData } from "../../../src/get_account/auth_flow/CustomAuthAccountData.js";
import { SignOutResult } from "../../../src/get_account/auth_flow/result/SignOutResult.js";
import { SignOutError } from "../../../src/get_account/auth_flow/error_type/GetAccountError.js";
import { IdTokenClaims } from "../../../../msal-common/dist/exports-common.js";
import { GetAccessTokenState } from "../../../src/index.js";
import { GetAccessTokenError, GetAccessTokenFailed } from "../../../src/core/error/GetAccessTokenError.js";

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

        mockConfig = {} as CustomAuthBrowserConfiguration; // Mock as needed
        mockCacheClient = {
            getAccessToken: jest.fn(),
            getCurrentAccount: jest.fn(),
            logout: jest.fn(),
        } as unknown as CustomAuthSilentCacheClient;
        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
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
            expect(mockLogger.info).toHaveBeenCalledWith("Signing out user");
            expect(mockLogger.info).toHaveBeenCalledWith("User signed out");
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

            expect(mockLogger.error).toHaveBeenCalledWith(`An error occurred during sign out: ${error}`);
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
            (mockCacheClient.getAccessToken as jest.Mock).mockResolvedValue(mockAuthenticationResult);
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
            const mockGetAccessTokenError = new GetAccessTokenError(
                GetAccessTokenFailed,
                "Get access token failed.",
                correlationId,
            );
            (mockCacheClient.getAccessToken as jest.Mock).mockRejectedValue(mockGetAccessTokenError);

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
            expect(response.error?.errorData).toEqual(mockGetAccessTokenError);
        });
    });
});
