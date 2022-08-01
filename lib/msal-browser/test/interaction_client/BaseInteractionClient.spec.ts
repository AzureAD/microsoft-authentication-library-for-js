/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import { AccountInfo, AccountEntity, TokenClaims } from "@azure/msal-common";
import { TEST_DATA_CLIENT_INFO, TEST_CONFIG } from "../utils/StringConstants";
import { BaseInteractionClient } from "../../src/interaction_client/BaseInteractionClient";
import { EndSessionRequest, PublicClientApplication } from "../../src";

class testInteractionClient extends BaseInteractionClient {
    acquireToken(): Promise<void> {
        return Promise.resolve();
    }

    logout(request: EndSessionRequest): Promise<void> {
        return this.clearCacheOnLogout(request.account);
    }
}

describe("BaseInteractionClient", () => {
    let pca: PublicClientApplication;
    let testClient: testInteractionClient;
    beforeEach(() => {
        pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });

        // @ts-ignore
        testClient = new testInteractionClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, pca.performanceClient);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("clearCacheOnLogout", () => {
        let testAccountInfo1: AccountInfo;
        let testAccountInfo2: AccountInfo;

        beforeEach(() => {
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

            testAccountInfo1 = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || ""
            };

            const testAccount1: AccountEntity = new AccountEntity();
            testAccount1.homeAccountId = testAccountInfo1.homeAccountId;
            testAccount1.localAccountId = testAccountInfo1.localAccountId;
            testAccount1.environment = testAccountInfo1.environment;
            testAccount1.realm = testAccountInfo1.tenantId;
            testAccount1.username = testAccountInfo1.username;
            testAccount1.name = testAccountInfo1.name;
            testAccount1.authorityType = "MSSTS";
            testAccount1.clientInfo = TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED;

            testAccountInfo2 = {
                homeAccountId: "different-home-account-id",
                localAccountId: "different-local-account-id",
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || ""
            };

            const testAccount2: AccountEntity = new AccountEntity();
            testAccount2.homeAccountId = testAccountInfo2.homeAccountId;
            testAccount2.localAccountId = testAccountInfo2.localAccountId;
            testAccount2.environment = testAccountInfo2.environment;
            testAccount2.realm = testAccountInfo2.tenantId;
            testAccount2.username = testAccountInfo2.username;
            testAccount2.name = testAccountInfo2.name;
            testAccount2.authorityType = "MSSTS";
            testAccount2.clientInfo = TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED;


            pca.setActiveAccount(testAccountInfo1);
            // @ts-ignore
            pca.browserStorage.setAccount(testAccount1);
            // @ts-ignore
            pca.browserStorage.setAccount(testAccount2);
        });

        afterEach(() => {
            window.sessionStorage.clear();
        });

        it("Removes all accounts from cache if no account provided", async() => {
            expect(pca.getAllAccounts().length).toBe(2);
            expect(pca.getActiveAccount()).toMatchObject(testAccountInfo1);
            await testClient.logout({ account: null});
            expect(pca.getAllAccounts().length).toBe(0);
            expect(pca.getActiveAccount()).toBe(null);
        });

        it("Removes account provided", async () => {
            expect(pca.getAllAccounts().length).toBe(2);
            expect(pca.getActiveAccount()).toMatchObject(testAccountInfo1);
            await testClient.logout({account: testAccountInfo1});
            expect(pca.getAccountByHomeId(testAccountInfo1.homeAccountId)).toBe(null);
            expect(pca.getAccountByHomeId(testAccountInfo2.homeAccountId)).toMatchObject(testAccountInfo2);
            expect(pca.getActiveAccount()).toBe(null);
        });
    });
});
