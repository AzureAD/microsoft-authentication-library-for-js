import { AccountInfo, Logger } from "@azure/msal-browser";
import { CustomAuthBrowserConfiguration } from "../../../src/configuration/CustomAuthConfiguration.js";
import { CustomAuthTokenClient } from "../../../src/get_account/interaction_client/CustomAuthTokenClient.js";
import { CustomAuthAccountData } from "../../../src/get_account/auth_flow/CustomAuthAccountData.js";
import { SignOutResult } from "../../../src/get_account/auth_flow/result/SignOutResult.js";
import { SignOutError } from "../../../src/get_account/auth_flow/error_type/GetAccountError.js";

describe("CustomAuthAccountData", () => {
    let mockAccount: AccountInfo;
    let mockConfig: CustomAuthBrowserConfiguration;
    let mockTokenClient: CustomAuthTokenClient;
    let mockLogger: Logger;
    const correlationId = "test-correlation-id";

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
        mockConfig = {} as CustomAuthBrowserConfiguration; // Mock as needed
        mockTokenClient = {
            getCurrentAccount: jest.fn(),
            logout: jest.fn(),
        } as unknown as CustomAuthTokenClient;
        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
        } as unknown as Logger;
    });

    describe("signOut", () => {
        it("should sign out the user successfully", async () => {
            (mockTokenClient.getCurrentAccount as jest.Mock).mockReturnValue(mockAccount);

            const accountData = new CustomAuthAccountData(
                mockAccount,
                mockConfig,
                mockTokenClient,
                mockLogger,
                correlationId,
            );
            const result = await accountData.signOut();

            expect(mockTokenClient.logout).toHaveBeenCalledWith({
                correlationId: correlationId,
                account: mockAccount,
            });
            expect(result).toBeInstanceOf(SignOutResult);
            expect(mockLogger.info).toHaveBeenCalledWith("Signing out user");
            expect(mockLogger.info).toHaveBeenCalledWith("User signed out");
        });

        it("should handle errors during sign out", async () => {
            const error = new Error("Sign out error");
            (mockTokenClient.getCurrentAccount as jest.Mock).mockReturnValue(mockAccount);
            (mockTokenClient.logout as jest.Mock).mockRejectedValue(error);

            const accountData = new CustomAuthAccountData(
                mockAccount,
                mockConfig,
                mockTokenClient,
                mockLogger,
                correlationId,
            );
            const result = await accountData.signOut();

            expect(mockLogger.error).toHaveBeenCalledWith(`An error occurred during sign out: ${error}`);
            expect(result).toBeInstanceOf(SignOutResult);
            expect(result.error).toBeDefined();
        });

        it("should handle no cached account", async () => {
            (mockTokenClient.getCurrentAccount as jest.Mock).mockReturnValue(null);
            const accountData = new CustomAuthAccountData(
                mockAccount,
                mockConfig,
                mockTokenClient,
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
                mockTokenClient,
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
                mockTokenClient,
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
                mockTokenClient,
                mockLogger,
                correlationId,
            );
            const claims = accountData.getClaims();
            expect(claims).toEqual(mockAccount.idTokenClaims);
        });
    });

    describe("getAccessToken", () => {
        it("should throw an error as method is not implemented", async () => {
            const accountData = new CustomAuthAccountData(
                mockAccount,
                mockConfig,
                mockTokenClient,
                mockLogger,
                correlationId,
            );
            await expect(accountData.getAccessToken(false, ["test"])).rejects.toThrowError(
                "Method not implemented with forceRefresh 'false' and scopes 'test'",
            );
        });
    });
});
