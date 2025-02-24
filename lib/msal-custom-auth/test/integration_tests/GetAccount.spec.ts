/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthPublicClientApplication } from "../../src/CustomAuthPublicClientApplication.js";
import { ICustomAuthPublicClientApplication } from "../../src/ICustomAuthPublicClientApplication.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { GetAccountState, SignInState, SignOutState } from "../../src/core/auth_flow/AuthFlowStateBase.js";
import { CustomAuthAccountData } from "../../src/get_account/auth_flow/CustomAuthAccountData.js";
import { TestHomeAccountId, TestTenantId, TestTokenResponse, TestUsername } from "../test_resources/TestConstants.js";

describe("GetAccount", () => {
    let app: ICustomAuthPublicClientApplication;

    beforeEach(async () => {
        app = await CustomAuthPublicClientApplication.create(customAuthConfig);

        global.fetch = jest.fn(); // Mock the fetch API
    });

    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks between tests
    });

    describe("GetAccountAccount", () => {
        it("should return correct account data after the sign-in is successful", async () => {
            await signIn(app);

            const accountData = app.getCurrentAccount({
                correlationId: "test-correlation-id",
            });

            expect(accountData).toBeDefined();
            expect(accountData.error).toBeUndefined();
            expect(accountData.state?.type).toStrictEqual(GetAccountState.Completed);
            expect(accountData.data).toBeDefined();
            expect(accountData.data).toBeInstanceOf(CustomAuthAccountData);
            expect(accountData.data?.getAccount()).toBeDefined();

            const accountInfo = accountData.data?.getAccount();

            expect(accountInfo?.homeAccountId).toStrictEqual(TestHomeAccountId);
            expect(accountInfo?.tenantId).toStrictEqual(TestTenantId);
            expect(accountInfo?.username).toStrictEqual(TestUsername);
        });

        it("should return correct account data with provided username after the sign-in is successful", async () => {
            await signIn(app);

            const accountData = app.getCurrentAccount({
                correlationId: "test-correlation-id",
                username: TestUsername,
            });

            expect(accountData).toBeDefined();
            expect(accountData.error).toBeUndefined();
            expect(accountData.state?.type).toStrictEqual(GetAccountState.Completed);
            expect(accountData.data).toBeDefined();
            expect(accountData.data).toBeInstanceOf(CustomAuthAccountData);
            expect(accountData.data?.getAccount()).toBeDefined();

            const accountInfo = accountData.data?.getAccount();

            expect(accountInfo?.homeAccountId).toStrictEqual(TestHomeAccountId);
            expect(accountInfo?.tenantId).toStrictEqual(TestTenantId);
            expect(accountInfo?.username).toStrictEqual(TestUsername);
        });

        it("should return error data if the account is not found", async () => {
            await signIn(app);

            const accountData = app.getCurrentAccount({
                correlationId: "test-correlation-id",
                username: "abc@abc.com", // Invalid username
            });

            expect(accountData).toBeDefined();
            expect(accountData.error).toBeDefined();
            expect(accountData.error?.errorData).toBeDefined();
            expect(accountData.error?.isCurrentAccountNotFound()).toBe(true);
            expect(accountData.state?.type).toStrictEqual(GetAccountState.Failed);
            expect(accountData.data).toBeUndefined();
        });
    });

    describe("SignOut", () => {
        it("should sign the user out after the sign-in is successful", async () => {
            await signIn(app);

            const result = app.getCurrentAccount({
                correlationId: "test-correlation-id",
            });

            const accountData = result.data;

            expect(accountData).toBeDefined();

            const signOutResult = await accountData?.signOut();

            expect(signOutResult).toBeDefined();
            expect(signOutResult?.error).toBeUndefined();
            expect(signOutResult?.state?.type).toStrictEqual(SignOutState.Completed);

            const accountResultAfterSignOut = app.getCurrentAccount({
                correlationId: "test-correlation-id",
            });

            expect(accountResultAfterSignOut).toBeDefined();
            expect(accountResultAfterSignOut.error).toBeDefined();
            expect(accountResultAfterSignOut.error?.isCurrentAccountNotFound()).toBe(true);
        });

        it("should sign the user out with provided username after the sign-in is successful", async () => {
            await signIn(app);

            const result = app.getCurrentAccount({
                correlationId: "test-correlation-id",
            });

            const accountData = result.data;

            expect(accountData).toBeDefined();

            const signOutResult = await accountData?.signOut(TestUsername);

            expect(signOutResult).toBeDefined();
            expect(signOutResult?.error).toBeUndefined();
            expect(signOutResult?.state?.type).toStrictEqual(SignOutState.Completed);

            const accountResultAfterSignOut = app.getCurrentAccount({
                correlationId: "test-correlation-id",
                username: TestUsername,
            });

            expect(accountResultAfterSignOut).toBeDefined();
            expect(accountResultAfterSignOut.error).toBeDefined();
            expect(accountResultAfterSignOut.error?.isCurrentAccountNotFound()).toBe(true);
        });

        it("should return error data if try to sign out an user who is not signed in", async () => {
            await signIn(app);

            const result = app.getCurrentAccount({
                correlationId: "test-correlation-id",
            });

            const accountData = result.data;

            const signOutResult = await accountData?.signOut("cdf@abd.com"); // Invalid username

            expect(signOutResult).toBeDefined();
            expect(signOutResult?.error).toBeDefined();
            expect(signOutResult?.state?.type).toStrictEqual(SignOutState.Failed);
            expect(signOutResult?.error?.isUserNotSignedIn()).toBe(true);
        });
    });
});

async function signIn(app: ICustomAuthPublicClientApplication): Promise<void> {
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
                correlation_id: "test-correlation-id",
                token_type: "Bearer",
                scopes: "test-scope",
                expires_in: 3600,
                id_token: TestTokenResponse.ID_TOKEN,
                access_token: TestTokenResponse.ACCESS_TOKEN,
                refresh_token: TestTokenResponse.REFRESH_TOKEN,
                client_info: TestTokenResponse.CLIENT_INFO,
            };
        },
        headers: new Headers({ "content-type": "application/json" }),
        ok: true,
    });

    const signInInputs = {
        username: "abc@test.com",
        password: "test-pwd",
        correlationId: "test-correlation-id",
    };

    await app.signIn(signInInputs);
}
