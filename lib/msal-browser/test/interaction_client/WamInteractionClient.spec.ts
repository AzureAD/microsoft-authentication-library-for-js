/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger, AuthError, AuthErrorMessage, AuthenticationResult, AuthenticationScheme, AccountInfo } from "@azure/msal-common";
import sinon from "sinon";
import { WamMessageHandler } from "../../src/broker/wam/WamMessageHandler";
import { BrowserAuthError, BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError";
import { ApiId, WamConstants, WamExtensionMethod } from "../../src/utils/BrowserConstants";
import { WamAuthError } from "../../src/error/WamAuthError";
import { WamInteractionClient } from "../../src/interaction_client/WamInteractionClient";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import { ID_TOKEN_CLAIMS, RANDOM_TEST_GUID, TEST_CONFIG, TEST_DATA_CLIENT_INFO, TEST_TOKENS } from "../utils/StringConstants";
import { CryptoOps } from "../../src/crypto/CryptoOps";

describe("WamInteractionClient Tests", () => {
    globalThis.MessageChannel = require("worker_threads").MessageChannel; // jsdom does not include an implementation for MessageChannel
    
    const pca = new PublicClientApplication({
        auth: {
            clientId: TEST_CONFIG.MSAL_CLIENT_ID
        }
    });
    const wamProvider = new WamMessageHandler(pca.getLogger());

    // @ts-ignore
    const wamInteractionClient = new WamInteractionClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.getLogger(), pca.eventHandler, pca.navigationClient, ApiId.acquireTokenRedirect, wamProvider);
    let postMessageSpy: sinon.SinonSpy;
    let mcPort: MessagePort;

    beforeEach(() => {
        postMessageSpy = sinon.spy(window, "postMessage");
        sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
        sinon.stub(MessageEvent.prototype, "source").get(() => window); // source property not set by jsdom window messaging APIs
    });

    afterEach(() => {
        mcPort && mcPort.close();
        sinon.restore();
    });

    describe("acquireToken Tests", () => {
        it("acquires token successfully", async () => {
            const mockWamResponse = {
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
                scopes: "User.Read",
                expires_in: 3600,
                client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                account: {
                    id: "nativeAccountId"
                }
            };

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: ID_TOKEN_CLAIMS.tid,
                username: ID_TOKEN_CLAIMS.preferred_username
            };

            const authenticationResult: AuthenticationResult = {
                accessToken: mockWamResponse.access_token,
                idToken: mockWamResponse.id_token,
                uniqueId: ID_TOKEN_CLAIMS.oid,
                tenantId: ID_TOKEN_CLAIMS.tid,
                idTokenClaims: ID_TOKEN_CLAIMS,
                authority: TEST_CONFIG.validAuthority,
                scopes: ["User.Read"],
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + (mockWamResponse.expires_in * 1000)),
                account: testAccount,
                state: undefined,
                tokenType: AuthenticationScheme.BEARER
            }
            sinon.stub(WamMessageHandler.prototype, "sendMessage").callsFake((): Promise<object> => {
                return Promise.resolve(mockWamResponse);
            });
            const response = await wamInteractionClient.acquireToken({scopes: ["User.Read"]});
            expect(response.accessToken).toEqual(mockWamResponse.access_token);
            expect(response.idToken).toEqual(mockWamResponse.id_token);
            expect(response.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(response.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(response.authority).toEqual(TEST_CONFIG.validAuthority);
            expect(response.scopes).toContain(mockWamResponse.scopes);
            expect(response.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(response.account).toEqual(testAccount);
            expect(response.tokenType).toEqual(AuthenticationScheme.BEARER);
        });
    });

});