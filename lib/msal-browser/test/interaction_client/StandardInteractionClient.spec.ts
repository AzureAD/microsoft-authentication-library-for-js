/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ResponseMode,
    AuthenticationScheme,
    AzureCloudOptions,
    AzureCloudInstance,
    Authority,
    ProtocolMode,
    ServerResponseType,
    AccountEntity,
    AccountInfo,
} from "@azure/msal-common";
import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
import { StandardInteractionClient } from "../../src/interaction_client/StandardInteractionClient.js";
import { EndSessionRequest } from "../../src/request/EndSessionRequest.js";
import {
    TEST_CONFIG,
    TEST_STATE_VALUES,
    TEST_URIS,
    DEFAULT_TENANT_DISCOVERY_RESPONSE,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_REQ_CNF_DATA,
    ID_TOKEN_CLAIMS,
    TEST_TOKENS,
} from "../utils/StringConstants.js";
import { AuthorizationUrlRequest } from "../../src/request/AuthorizationUrlRequest.js";
import { RedirectRequest } from "../../src/request/RedirectRequest.js";
import * as PkceGenerator from "../../src/crypto/PkceGenerator.js";
import { FetchClient } from "../../src/network/FetchClient.js";
import { InteractionType } from "../../src/utils/BrowserConstants.js";
import { buildAccountFromIdTokenClaims } from "msal-test-utils";

class testStandardInteractionClient extends StandardInteractionClient {
    acquireToken(): Promise<void> {
        return Promise.resolve();
    }

    async initializeAuthorizationCodeRequest(request: AuthorizationUrlRequest) {
        return super.initializeAuthorizationCodeRequest(request);
    }

    async initializeAuthorizationRequest(
        request: RedirectRequest,
        interactionType: InteractionType
    ) {
        return super.initializeAuthorizationRequest(request, interactionType);
    }

    async getDiscoveredAuthority(params: {
        requestAuthority?: string;
        requestAzureCloudOptions?: AzureCloudOptions;
    }) {
        return super.getDiscoveredAuthority(params);
    }

    logout(request: EndSessionRequest): Promise<void> {
        return this.clearCacheOnLogout(request.account);
    }
}

describe("StandardInteractionClient", () => {
    let pca: PublicClientApplication;
    let testClient: testStandardInteractionClient;
    const testAccountEntity: AccountEntity = buildAccountFromIdTokenClaims(
        ID_TOKEN_CLAIMS,
        undefined,
        { environment: "login.microsoftonline.com" }
    );
    const testAccount: AccountInfo = testAccountEntity.getAccountInfo();

    beforeEach(() => {
        pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        //Implementation of PCA was moved to controller.
        pca = (pca as any).controller;

        // @ts-ignore
        testClient = new testStandardInteractionClient(
            //@ts-ignore
            pca.config,
            //@ts-ignore
            pca.browserStorage,
            //@ts-ignore
            pca.browserCrypto,
            //@ts-ignore
            pca.logger,
            //@ts-ignore
            pca.eventHandler,
            //@ts-ignore
            null,
            //@ts-ignore
            pca.performanceClient
        );
        jest.spyOn(
            Authority.prototype,
            <any>"getEndpointMetadataFromNetwork"
        ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        jest.spyOn(
            FetchClient.prototype,
            "sendGetRequestAsync"
        ).mockImplementation((url) => {
            if (
                url.startsWith(
                    "https://login.microsoftonline.com/common/discovery/instance?"
                )
            ) {
                return Promise.resolve(DEFAULT_TENANT_DISCOVERY_RESPONSE);
            } else {
                return Promise.reject({
                    headers: {},
                    status: 404,
                    body: {},
                });
            }
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("initializeAuthorizationCodeRequest", async () => {
        const request: AuthorizationUrlRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            loginHint: "AbeLi@microsoft.com",
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
            nonce: "",
            authenticationScheme:
                TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
        };

        jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
            challenge: TEST_CONFIG.TEST_CHALLENGE,
            verifier: TEST_CONFIG.TEST_VERIFIER,
        });

        const authCodeRequest =
            await testClient.initializeAuthorizationCodeRequest(request);
        expect(request.codeChallenge).toBe(TEST_CONFIG.TEST_CHALLENGE);
        expect(authCodeRequest.codeVerifier).toBe(TEST_CONFIG.TEST_VERIFIER);
        expect(authCodeRequest.popKid).toBeUndefined;
    });

    it("initializeAuthorizationCodeRequest validates the request and does not influence undefined popKid param", async () => {
        const request: AuthorizationUrlRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            loginHint: "AbeLi@microsoft.com",
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
            nonce: "",
            authenticationScheme:
                TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
        };

        jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
            challenge: TEST_CONFIG.TEST_CHALLENGE,
            verifier: TEST_CONFIG.TEST_VERIFIER,
        });

        const authCodeRequest =
            await testClient.initializeAuthorizationCodeRequest(request);
        expect(authCodeRequest.popKid).toBeUndefined;
    });

    it("initializeAuthorizationCodeRequest validates the request and adds reqCnf param when user defined", async () => {
        const request: AuthorizationUrlRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            loginHint: "AbeLi@microsoft.com",
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
            nonce: "",
            authenticationScheme:
                TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
            popKid: TEST_REQ_CNF_DATA.kid,
        };

        jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
            challenge: TEST_CONFIG.TEST_CHALLENGE,
            verifier: TEST_CONFIG.TEST_VERIFIER,
        });

        const authCodeRequest =
            await testClient.initializeAuthorizationCodeRequest(request);
        expect(authCodeRequest.popKid).toEqual(TEST_REQ_CNF_DATA.kid);
    });

    it("getDiscoveredAuthority - request authority only", async () => {
        const requestAuthority = TEST_CONFIG.validAuthority;

        const authority = await testClient.getDiscoveredAuthority({
            requestAuthority,
        });
        expect(authority.canonicalAuthority).toBe(TEST_CONFIG.validAuthority);
    });

    it("getDiscoveredAuthority - azureCloudOptions set", async () => {
        const requestAuthority = TEST_CONFIG.validAuthority;
        const requestAzureCloudOptions: AzureCloudOptions = {
            azureCloudInstance: AzureCloudInstance.AzureUsGovernment,
            tenant: TEST_CONFIG.TENANT,
        };

        const authority = await testClient.getDiscoveredAuthority({
            requestAuthority,
            requestAzureCloudOptions,
        });
        expect(authority.canonicalAuthority).toBe(TEST_CONFIG.usGovAuthority);
    });

    it("getDiscoveredAuthority - Config defaults", async () => {
        //Implementation of PCA was moved to controller.
        pca = (pca as any).controller;

        const authority = await testClient.getDiscoveredAuthority({});
        expect(authority.canonicalAuthority).toBe(TEST_CONFIG.validAuthority);
    });

    it("getDiscoveredAuthority - Only azureCloudInstance provided ", async () => {
        const requestAzureCloudOptions: AzureCloudOptions = {
            azureCloudInstance: AzureCloudInstance.AzureGermany,
        };

        const authority = await testClient.getDiscoveredAuthority({
            requestAzureCloudOptions,
        });
        expect(authority.canonicalAuthority).toBe(TEST_CONFIG.germanyAuthority);
    });

    it("initializeAuthorizationRequest adds active account to request", async () => {
        // @ts-ignore
        await pca.browserStorage.setAccount(testAccountEntity);
        pca.setActiveAccount(testAccount);

        const request: AuthorizationUrlRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
            nonce: "",
        };

        const authCodeRequest = await testClient.initializeAuthorizationRequest(
            request,
            InteractionType.Silent
        );
        expect(authCodeRequest.account).toEqual(testAccount);
    });

    it("initializeAuthorizationRequest persists account in request", async () => {
        const request: AuthorizationUrlRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            account: { ...testAccount },
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
            nonce: "",
        };

        const authCodeRequest = await testClient.initializeAuthorizationRequest(
            request,
            InteractionType.Silent
        );
        expect(authCodeRequest.account).toEqual(testAccount);
    });

    it("initializeAuthorizationRequest sets loginHint when active account is set", async () => {
        // @ts-ignore
        await pca.browserStorage.setAccount(testAccountEntity);
        pca.setActiveAccount(testAccount);

        const request: AuthorizationUrlRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            loginHint: "AbeLi@microsoft.com",
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
            nonce: "",
        };

        const authCodeRequest = await testClient.initializeAuthorizationRequest(
            request,
            InteractionType.Silent
        );
        expect(authCodeRequest.account).toBeUndefined();
        expect(authCodeRequest.loginHint).toEqual(request.loginHint);
    });

    it("initializeAuthorizationRequest sets sid when active account is set", async () => {
        // @ts-ignore
        await pca.browserStorage.setAccount(testAccountEntity);
        pca.setActiveAccount(testAccount);

        const request: AuthorizationUrlRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            sid: "test_sid",
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
            nonce: "",
        };

        const authCodeRequest = await testClient.initializeAuthorizationRequest(
            request,
            InteractionType.Silent
        );
        expect(authCodeRequest.account).toBeUndefined();
        expect(authCodeRequest.sid).toEqual(request.sid);
    });

    it("initializeAuthorizationRequest keeps both loginHint and account", async () => {
        const request: AuthorizationUrlRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            loginHint: "AbeLi@microsoft.com",
            account: testAccount,
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
            nonce: "",
        };

        const authCodeRequest = await testClient.initializeAuthorizationRequest(
            request,
            InteractionType.Silent
        );
        expect(authCodeRequest.account).toEqual(request.account);
        expect(authCodeRequest.loginHint).toEqual(request.loginHint);
    });

    it("initializeAuthorizationRequest keeps both sid and account", async () => {
        const request: AuthorizationUrlRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            sid: "test_sid",
            account: testAccount,
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
            nonce: "",
        };

        const authCodeRequest = await testClient.initializeAuthorizationRequest(
            request,
            InteractionType.Silent
        );
        expect(authCodeRequest.account).toEqual(request.account);
        expect(authCodeRequest.sid).toEqual(request.sid);
    });
});

describe("StandardInteractionClient OIDCOptions Tests", () => {
    let pca: PublicClientApplication;
    let testClient: testStandardInteractionClient;

    beforeEach(() => {
        pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                protocolMode: ProtocolMode.OIDC,
                OIDCOptions: { serverResponseType: ServerResponseType.QUERY },
            },
        });

        //Implementation of PCA was moved to controller.
        pca = (pca as any).controller;

        // @ts-ignore
        testClient = new testStandardInteractionClient(
            //@ts-ignore
            pca.config,
            //@ts-ignore
            pca.browserStorage,
            //@ts-ignore
            pca.browserCrypto,
            //@ts-ignore
            pca.logger,
            //@ts-ignore
            pca.eventHandler,
            //@ts-ignore
            null,
            //@ts-ignore
            pca.performanceClient
        );
        jest.spyOn(
            Authority.prototype,
            <any>"getEndpointMetadataFromNetwork"
        ).mockReturnValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        jest.spyOn(
            FetchClient.prototype,
            "sendGetRequestAsync"
        ).mockImplementation((url) => {
            if (
                url.startsWith(
                    "https://login.microsoftonline.com/common/discovery/instance?"
                )
            ) {
                return Promise.resolve(DEFAULT_TENANT_DISCOVERY_RESPONSE);
            } else {
                return Promise.reject({
                    headers: {},
                    status: 404,
                    body: {},
                });
            }
        });
    });

    it("initializeAuthorizationRequest calls for a query response when OIDCOptions.serverResponseType is set to query", async () => {
        const request: RedirectRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            loginHint: "AbeLi@microsoft.com",
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            nonce: "",
            authenticationScheme:
                TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
        };

        const authCodeRequest = await testClient.initializeAuthorizationRequest(
            request,
            InteractionType.Redirect
        );
        expect(authCodeRequest.responseMode).toBe(ResponseMode.QUERY);
    });
});
