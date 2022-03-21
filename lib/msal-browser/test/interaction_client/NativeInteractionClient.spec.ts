/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationScheme, AccountInfo } from "@azure/msal-common";
import sinon from "sinon";
import { NativeMessageHandler } from "../../src/broker/nativeBroker/NativeMessageHandler";
import { ApiId } from "../../src/utils/BrowserConstants";
import { NativeInteractionClient } from "../../src/interaction_client/NativeInteractionClient";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import { ID_TOKEN_CLAIMS, RANDOM_TEST_GUID, TEST_CONFIG, TEST_DATA_CLIENT_INFO, TEST_TOKENS } from "../utils/StringConstants";
import { NavigationClient } from "../../src/navigation/NavigationClient";

describe("NativeInteractionClient Tests", () => {
    globalThis.MessageChannel = require("worker_threads").MessageChannel; // jsdom does not include an implementation for MessageChannel
    
    const pca = new PublicClientApplication({
        auth: {
            clientId: TEST_CONFIG.MSAL_CLIENT_ID
        }
    });
    const wamProvider = new NativeMessageHandler(pca.getLogger());

    // @ts-ignore
    const nativeInteractionClient = new NativeInteractionClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.getLogger(), pca.eventHandler, pca.navigationClient, ApiId.acquireTokenRedirect, wamProvider, RANDOM_TEST_GUID);
    let postMessageSpy: sinon.SinonSpy;
    let mcPort: MessagePort;

    beforeEach(() => {
        postMessageSpy = sinon.spy(window, "postMessage");
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
                homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
                localAccountId: ID_TOKEN_CLAIMS.oid,
                environment: "login.windows.net",
                tenantId: ID_TOKEN_CLAIMS.tid,
                username: ID_TOKEN_CLAIMS.preferred_username,
                name: ID_TOKEN_CLAIMS.name,
                idTokenClaims: ID_TOKEN_CLAIMS,
                nativeAccountId: mockWamResponse.account.id
            };
            sinon.stub(NativeMessageHandler.prototype, "sendMessage").callsFake((): Promise<object> => {
                return Promise.resolve(mockWamResponse);
            });
            const response = await nativeInteractionClient.acquireToken({scopes: ["User.Read"]});
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

    describe("acquireTokenRedirect tests", () => {
        it("acquires token successfully then redirects to start page", (done) => {
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

            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((url: string) => {
                expect(url).toBe(window.location.href);
                done();
                return Promise.resolve(true);
            });
            sinon.stub(NativeMessageHandler.prototype, "sendMessage").callsFake((): Promise<object> => {
                return Promise.resolve(mockWamResponse);
            });
            nativeInteractionClient.acquireTokenRedirect({scopes: ["User.Read"]});
        });
    });

});