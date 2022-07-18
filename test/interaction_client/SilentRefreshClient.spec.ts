/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import { TEST_CONFIG, TEST_TOKENS, TEST_DATA_CLIENT_INFO, TEST_TOKEN_LIFETIMES, RANDOM_TEST_GUID } from "../utils/StringConstants";
import { Constants, AccountInfo, TokenClaims, AuthenticationResult, AuthenticationScheme, RefreshTokenClient, CommonSilentFlowRequest } from "@azure/msal-common";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { BrowserAuthError } from "../../src/error/BrowserAuthError";
import { SilentRefreshClient } from "../../src/interaction_client/SilentRefreshClient";

describe("SilentRefreshClient", () => {
    let silentRefreshClient: SilentRefreshClient;

    beforeEach(() => {
        const pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });
        sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
        // @ts-ignore
        silentRefreshClient = new SilentRefreshClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, pca.navigationClient, pca.performanceClient);
    });

    afterEach(() => {
        sinon.restore();
        window.location.hash = "";
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("acquireToken", () => {
        it("successfully renews token", async () => {
            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2
            };
            const testIdTokenClaims: TokenClaims = {
                "ver": "2.0",
                "iss": "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "nonce": "123523",
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || ""
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: ["scope1"],
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + (testServerTokenResponse.expires_in * 1000)),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            const silentATStub = sinon.stub(RefreshTokenClient.prototype, <any>"acquireTokenByRefreshToken").resolves(testTokenResponse);
            const tokenRequest: CommonSilentFlowRequest = {
                scopes: ["scope1"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.BEARER,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };
            const expectedTokenRequest: CommonSilentFlowRequest = {
                ...tokenRequest,
                scopes: ["scope1"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                forceRefresh: false
            };
            const tokenResp = await silentRefreshClient.acquireToken(tokenRequest);
            expect(silentATStub.calledWith(expectedTokenRequest)).toBeTruthy();
            expect(tokenResp).toEqual(testTokenResponse);
        });
    });

    describe("logout", () => {
        it("logout throws unsupported error", async () => {
            await expect(silentRefreshClient.logout).rejects.toMatchObject(BrowserAuthError.createSilentLogoutUnsupportedError());
        });
    });
});
