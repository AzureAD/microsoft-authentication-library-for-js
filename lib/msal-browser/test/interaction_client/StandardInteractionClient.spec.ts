/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Constants,
    AzureCloudOptions,
    AzureCloudInstance,
    Authority,
    ProtocolMode,
    AccountEntity,
    AccountInfo,
    CommonAuthorizationUrlRequest,
    AccountEntityUtils,
    ClientConfigurationError,
    ClientConfigurationErrorCodes,
} from "@azure/msal-common";
import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
import {
    initializeAuthorizationRequest,
    StandardInteractionClient,
} from "../../src/interaction_client/StandardInteractionClient.js";
import { EndSessionRequest } from "../../src/request/EndSessionRequest.js";
import {
    TEST_CONFIG,
    TEST_STATE_VALUES,
    TEST_URIS,
    DEFAULT_TENANT_DISCOVERY_RESPONSE,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    ID_TOKEN_CLAIMS,
    TEST_TOKENS,
} from "../utils/StringConstants.js";
import { RedirectRequest } from "../../src/request/RedirectRequest.js";
import * as PkceGenerator from "../../src/crypto/PkceGenerator.js";
import { FetchClient } from "../../src/network/FetchClient.js";
import { InteractionType } from "../../src/utils/BrowserConstants.js";
import { buildAccountFromIdTokenClaims } from "msal-test-utils";
import {
    clearCacheOnLogout,
    getDiscoveredAuthority,
} from "../../src/interaction_client/BaseInteractionClient.js";
import {
    IdTokenEntity,
    updateAccountTenantProfileData,
} from "@azure/msal-common/browser";

class testStandardInteractionClient extends StandardInteractionClient {
    acquireToken(): Promise<void> {
        return Promise.resolve();
    }

    async initializeAuthorizationRequest(
        request: RedirectRequest,
        interactionType: InteractionType
    ) {
        return initializeAuthorizationRequest(
            request,
            interactionType,
            this.config,
            this.browserCrypto,
            this.browserStorage,
            this.logger,
            this.performanceClient,
            this.correlationId
        );
    }

    async getDiscoveredAuthority(params: {
        requestAuthority?: string;
        requestAzureCloudOptions?: AzureCloudOptions;
    }) {
        return await getDiscoveredAuthority(
            this.config,
            this.correlationId,
            this.performanceClient,
            this.browserStorage,
            this.logger,
            params.requestAuthority,
            params.requestAzureCloudOptions
        );
    }

    logout(request: EndSessionRequest): Promise<void> {
        return clearCacheOnLogout(
            this.browserStorage,
            this.browserCrypto,
            this.logger,
            this.correlationId,
            request.account
        );
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
    const testAccount: AccountInfo = updateAccountTenantProfileData(
        AccountEntityUtils.getAccountInfo(testAccountEntity),
        undefined,
        ID_TOKEN_CLAIMS,
        TEST_TOKENS.IDTOKEN_V2
    );

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

        const idTokenEntity: IdTokenEntity = {
            realm: testAccount.tenantId,
            environment: testAccount.environment,
            credentialType: "IdToken",
            secret: TEST_TOKENS.IDTOKEN_V2,
            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            homeAccountId: testAccount.homeAccountId,
            lastUpdatedAt: Date.now().toString(),
        };
        // @ts-ignore
        await pca.browserStorage.setIdTokenCredential(idTokenEntity);

        const request: CommonAuthorizationUrlRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            responseMode: TEST_CONFIG.RESPONSE_MODE as Constants.ResponseMode,
            nonce: "",
        };

        const authCodeRequest = await testClient.initializeAuthorizationRequest(
            request,
            InteractionType.Silent
        );
        expect(authCodeRequest.account).toEqual(testAccount);
    });

    it("initializeAuthorizationRequest persists account in request", async () => {
        const request: CommonAuthorizationUrlRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            account: { ...testAccount },
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            responseMode: TEST_CONFIG.RESPONSE_MODE as Constants.ResponseMode,
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

        const request: CommonAuthorizationUrlRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            loginHint: "AbeLi@microsoft.com",
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            responseMode: TEST_CONFIG.RESPONSE_MODE as Constants.ResponseMode,
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

        const request: CommonAuthorizationUrlRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            sid: "test_sid",
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            responseMode: TEST_CONFIG.RESPONSE_MODE as Constants.ResponseMode,
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
        const request: CommonAuthorizationUrlRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            loginHint: "AbeLi@microsoft.com",
            account: testAccount,
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            responseMode: TEST_CONFIG.RESPONSE_MODE as Constants.ResponseMode,
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
        const request: CommonAuthorizationUrlRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            sid: "test_sid",
            account: testAccount,
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            responseMode: TEST_CONFIG.RESPONSE_MODE as Constants.ResponseMode,
            nonce: "",
        };

        const authCodeRequest = await testClient.initializeAuthorizationRequest(
            request,
            InteractionType.Silent
        );
        expect(authCodeRequest.account).toEqual(request.account);
        expect(authCodeRequest.sid).toEqual(request.sid);
    });

    it("initializeAuthorizationRequest sets httpMethod to GET by default", async () => {
        const request: CommonAuthorizationUrlRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            responseMode: Constants.ResponseMode.QUERY,
            nonce: "",
        };

        const authCodeRequest = await testClient.initializeAuthorizationRequest(
            request,
            InteractionType.Redirect
        );
        expect(authCodeRequest.httpMethod).toEqual(Constants.HttpMethod.GET);
    });

    it("initializeAuthorizationRequest logs warning when redirect URI has different origin", async () => {
        const request: RedirectRequest = {
            redirectUri: "https://different-origin.com/auth",
            scopes: ["scope"],
        };

        const loggerWarningSpy = jest.spyOn(testClient["logger"], "warning");
        const performanceAddFieldsSpy = jest.spyOn(
            testClient["performanceClient"],
            "addFields"
        );

        await testClient.initializeAuthorizationRequest(
            request,
            InteractionType.Redirect
        );

        expect(loggerWarningSpy).toHaveBeenCalledWith(
            "The origin of the redirect URI does not match the origin of the current page. This is likely to cause issues with authentication.",
            undefined
        );
        expect(performanceAddFieldsSpy).toHaveBeenCalledWith(
            { isRedirectUriCrossOrigin: true },
            undefined
        );
    });

    it("initializeAuthorizationRequest does not log warning when redirect URI has same origin", async () => {
        const request: RedirectRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
        };

        const loggerWarningSpy = jest.spyOn(testClient["logger"], "warning");
        const performanceAddFieldsSpy = jest.spyOn(
            testClient["performanceClient"],
            "addFields"
        );

        await testClient.initializeAuthorizationRequest(
            request,
            InteractionType.Redirect
        );

        expect(loggerWarningSpy).not.toHaveBeenCalled();
        expect(performanceAddFieldsSpy).not.toHaveBeenCalledWith(
            { isRedirectUriCrossOrigin: true },
            expect.any(String)
        );
    });
});

describe("StandardInteractionClient OIDCOptions Tests", () => {
    let pca: PublicClientApplication;
    let testClient: testStandardInteractionClient;

    beforeEach(() => {
        pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                OIDCOptions: {
                    responseMode: Constants.ResponseMode.QUERY,
                },
            },
            system: {
                protocolMode: ProtocolMode.OIDC,
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

    it("initializeAuthorizationRequest calls for a query response when OIDCOptions.responseMode is set to query", async () => {
        const request: RedirectRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            loginHint: "AbeLi@microsoft.com",
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            nonce: "",
            authenticationScheme:
                TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
        };

        const authCodeRequest = await testClient.initializeAuthorizationRequest(
            request,
            InteractionType.Redirect
        );
        expect(authCodeRequest.responseMode).toBe(Constants.ResponseMode.QUERY);
    });
});

describe("StandardInteractionClient EAR Tests", () => {
    let pca: PublicClientApplication;
    let testClient: testStandardInteractionClient;

    beforeEach(() => {
        pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
            system: {
                protocolMode: ProtocolMode.EAR,
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
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("initializeAuthorizationRequest throws error when protocolMode is EAR and httpMethod is GET", async () => {
        const request: CommonAuthorizationUrlRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            responseMode: Constants.ResponseMode.QUERY,
            nonce: "",
            httpMethod: Constants.HttpMethod.GET,
        };

        try {
            await testClient.initializeAuthorizationRequest(
                request,
                InteractionType.Redirect
            );
            throw "Unexpected! Should throw";
        } catch (e) {
            expect(e).toBeInstanceOf(ClientConfigurationError);
            expect((e as ClientConfigurationError).errorCode).toEqual(
                ClientConfigurationErrorCodes.invalidRequestMethodForEAR
            );
        }
    });

    it("initializeAuthorizationRequest sets httpMethod to POST when protocolMode is EAR and httpMethod is not set", async () => {
        const request: CommonAuthorizationUrlRequest = {
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            scopes: ["scope"],
            state: TEST_STATE_VALUES.USER_STATE,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            responseMode: Constants.ResponseMode.QUERY,
            nonce: "",
        };

        const authCodeRequest = await testClient.initializeAuthorizationRequest(
            request,
            InteractionType.Redirect
        );
        expect(authCodeRequest.httpMethod).toEqual(Constants.HttpMethod.POST);
    });
});
