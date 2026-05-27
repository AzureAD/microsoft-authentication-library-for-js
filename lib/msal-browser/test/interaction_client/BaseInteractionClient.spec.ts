/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountInfo,
    AccountEntity,
    TokenClaims,
    createClientConfigurationError,
    ClientConfigurationErrorCodes,
    CacheManager,
    IdTokenEntity,
    CacheHelpers,
} from "@azure/msal-common";
import {
    TEST_DATA_CLIENT_INFO,
    TEST_CONFIG,
    TEST_TOKENS,
    DEFAULT_TENANT_DISCOVERY_RESPONSE,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    ID_TOKEN_CLAIMS,
    ID_TOKEN_ALT_CLAIMS,
} from "../utils/StringConstants.js";
import {
    BaseInteractionClient,
    clearCacheOnLogout,
    getDiscoveredAuthority,
} from "../../src/interaction_client/BaseInteractionClient.js";
import {
    EndSessionRequest,
    PublicClientApplication,
    TenantProfile,
} from "../../src/index.js";
import { OpenIdConfigResponse } from "../../../msal-common/src/authority/OpenIdConfigResponse.js";

class testInteractionClient extends BaseInteractionClient {
    acquireToken(): Promise<void> {
        return Promise.resolve();
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

describe("BaseInteractionClient", () => {
    let pca: PublicClientApplication;
    let testClient: testInteractionClient;
    beforeEach(async () => {
        pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await pca.initialize();

        //Implementation of PCA was moved to controller.
        pca = (pca as any).controller;

        // @ts-ignore
        testClient = new testInteractionClient(
            // @ts-ignore
            pca.config,
            // @ts-ignore
            pca.browserStorage,
            // @ts-ignore
            pca.browserCrypto,
            // @ts-ignore
            pca.logger,
            // @ts-ignore
            pca.eventHandler,
            // @ts-ignore
            pca.navigationClient,
            // @ts-ignore
            pca.performanceClient
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("clearCacheOnLogout", () => {
        let testAccountInfo1: AccountInfo;
        let testAccountInfo2: AccountInfo;

        beforeEach(async () => {
            const testIdTokenClaims: TokenClaims = ID_TOKEN_CLAIMS;
            const tenantProfile1: TenantProfile = {
                tenantId: testIdTokenClaims.tid || "",
                localAccountId: testIdTokenClaims.oid || "",
                username: testIdTokenClaims.preferred_username || "",
                loginHint: testIdTokenClaims.login_hint,
                name: testIdTokenClaims.name,
                isHomeTenant: true,
            };

            testAccountInfo1 = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: testIdTokenClaims.oid || "",
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                loginHint: testIdTokenClaims.login_hint,
                tenantProfiles: new Map([
                    [tenantProfile1.tenantId, tenantProfile1],
                ]),
            };

            const idToken1: IdTokenEntity = {
                realm: testAccountInfo1.tenantId,
                environment: testAccountInfo1.environment,
                credentialType: "IdToken",
                secret: TEST_TOKENS.IDTOKEN_V2,
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                homeAccountId: testAccountInfo1.homeAccountId,
                lastUpdatedAt: Date.now().toString(),
            };

            const testAccount1: AccountEntity = {
                homeAccountId: testAccountInfo1.homeAccountId,
                localAccountId: testAccountInfo1.localAccountId,
                environment: testAccountInfo1.environment,
                realm: testAccountInfo1.tenantId,
                username: testAccountInfo1.username,
                name: testAccountInfo1.name,
                authorityType: "MSSTS",
                clientInfo: TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED,
                tenantProfiles: [tenantProfile1],
                lastUpdatedAt: Date.now().toString(),
            };

            const testIdTokenClaims2: TokenClaims = ID_TOKEN_ALT_CLAIMS;
            const tenantProfile2: TenantProfile = {
                tenantId: testIdTokenClaims2.tid || "",
                localAccountId: testIdTokenClaims2.oid || "",
                username: testIdTokenClaims2.preferred_username || "",
                loginHint: testIdTokenClaims2.login_hint,
                name: testIdTokenClaims2.name,
                isHomeTenant: true,
            };

            testAccountInfo2 = {
                homeAccountId: "different-home-account-id",
                localAccountId: testIdTokenClaims2.oid || "",
                environment: "login.windows.net",
                tenantId: testIdTokenClaims2.tid || "",
                username: testIdTokenClaims2.preferred_username || "",
                loginHint: testIdTokenClaims2.login_hint,
                tenantProfiles: new Map([
                    [tenantProfile2.tenantId, tenantProfile2],
                ]),
            };

            const idToken2: IdTokenEntity = {
                realm: testAccountInfo2.tenantId,
                environment: testAccountInfo2.environment,
                credentialType: "IdToken",
                secret: TEST_TOKENS.IDTOKEN_V2_ALT,
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                homeAccountId: testAccountInfo2.homeAccountId,
                lastUpdatedAt: Date.now().toString(),
            };

            const testAccount2: AccountEntity = {
                homeAccountId: testAccountInfo2.homeAccountId,
                localAccountId: testAccountInfo2.localAccountId,
                environment: testAccountInfo2.environment,
                realm: testAccountInfo2.tenantId,
                username: testAccountInfo2.username,
                name: testAccountInfo2.name,
                authorityType: "MSSTS",
                clientInfo: TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED,
                tenantProfiles: [tenantProfile2],
                lastUpdatedAt: Date.now().toString(),
            };

            pca.setActiveAccount(testAccountInfo1);
            // @ts-ignore
            await pca.browserStorage.setAccount(testAccount1);
            // @ts-ignore
            await pca.browserStorage.setIdTokenCredential(idToken1);
            // @ts-ignore
            await pca.browserStorage.setAccount(testAccount2);
            // @ts-ignore
            await pca.browserStorage.setIdTokenCredential(idToken2);

            jest.spyOn(
                CacheManager.prototype,
                "getAuthorityMetadataByAlias"
            ).mockImplementation((host: string) => {
                const metadata =
                    DEFAULT_TENANT_DISCOVERY_RESPONSE.body.metadata[0];
                const openIdConfigResponse =
                    DEFAULT_OPENID_CONFIG_RESPONSE.body as OpenIdConfigResponse;
                return {
                    aliases: [],
                    preferred_cache: metadata.preferred_cache,
                    preferred_network: metadata.preferred_network,
                    canonical_authority: host,
                    authorization_endpoint:
                        openIdConfigResponse.authorization_endpoint,
                    token_endpoint: openIdConfigResponse.token_endpoint,
                    end_session_endpoint:
                        openIdConfigResponse.end_session_endpoint,
                    issuer: openIdConfigResponse.issuer,
                    aliasesFromNetwork: true,
                    endpointsFromNetwork: true,
                    expiresAt:
                        CacheHelpers.generateAuthorityMetadataExpiresAt(),
                    jwks_uri: openIdConfigResponse.jwks_uri,
                };
            });
        });

        afterEach(() => {
            window.sessionStorage.clear();
        });

        it("Removes all accounts from cache if no account provided", async () => {
            expect(pca.getAllAccounts().length).toBe(2);
            expect(pca.getActiveAccount()).toMatchObject(testAccountInfo1);
            await testClient.logout({ account: null });
            expect(pca.getAllAccounts().length).toBe(0);
            expect(pca.getActiveAccount()).toBe(null);
        });

        it("Removes account provided", async () => {
            expect(pca.getAllAccounts().length).toBe(2);
            expect(pca.getActiveAccount()).toMatchObject(testAccountInfo1);
            await testClient.logout({ account: testAccountInfo1 });
            expect(
                pca.getAccount({
                    homeAccountId: testAccountInfo1.homeAccountId,
                })
            ).toBe(null);
            expect(
                pca.getAccount({
                    homeAccountId: testAccountInfo2.homeAccountId,
                })
            ).toMatchObject(testAccountInfo2);
            expect(pca.getActiveAccount()).toBe(null);
        });
    });
    describe("getDiscoveredAuthority()", () => {
        afterEach(() => {
            window.sessionStorage.clear();
        });

        it("Throw error when authority in request or MSAL config does not match with environment set for account", async () => {
            const testAccount = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows-ppe.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                loginHint: "loginHint",
            };

            let clientInst = testClient as any;

            await getDiscoveredAuthority(
                clientInst.config,
                clientInst.correlationId,
                clientInst.performanceClient,
                clientInst.browserStorage,
                clientInst.logger,
                "https://login.microsoftonline.com/common",
                undefined,
                undefined,
                testAccount
            )
                .then(() => {
                    throw "This is unexpected. This call should have failed.";
                })
                .catch((error) => {
                    expect(error).toStrictEqual(
                        createClientConfigurationError(ClientConfigurationErrorCodes.authorityMismatch, "")
                    );
                });
        });

        it("Does not throw error when authority in request or MSAL config matches with environment set for account", (done) => {
            const testAccount = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                loginHint: "loginHint",
            };

            const clientInst = testClient as any;

            getDiscoveredAuthority(
                clientInst.config,
                clientInst.correlationId,
                clientInst.performanceClient,
                clientInst.browserStorage,
                clientInst.logger,
                "https://login.microsoftonline.com/common",
                undefined,
                undefined,
                testAccount
            )
                .then(() => {
                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });

        it("Does not throw error when instanceAware is set in the config", (done) => {
            const testAccount = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.microsoftonline.us",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                loginHint: "loginHint",
            };

            // @ts-ignore
            const config = { ...pca.config };
            config.auth.instanceAware = true;

            const interactionClient = new testInteractionClient(
                config,
                // @ts-ignore
                pca.browserStorage,
                // @ts-ignore
                pca.browserCrypto,
                // @ts-ignore
                pca.logger,
                // @ts-ignore
                pca.eventHandler,
                // @ts-ignore
                pca.navigationClient,
                // @ts-ignore
                pca.performanceClient,
                TEST_CONFIG.CORRELATION_ID
            );

            const clientInst = interactionClient as any;
            getDiscoveredAuthority(
                clientInst.config,
                clientInst.correlationId,
                clientInst.performanceClient,
                clientInst.browserStorage,
                clientInst.logger,
                undefined,
                undefined,
                undefined,
                testAccount
            )
                .then(() => {
                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });

        it("Does not throw error when both instanceAware is set in the config and request authority is set in the request", (done) => {
            const testAccount = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.microsoftonline.us",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                loginHint: "loginHint",
            };

            // @ts-ignore
            const config = { ...pca.config };
            config.auth.instanceAware = true;

            const interactionClient = new testInteractionClient(
                config,
                // @ts-ignore
                pca.browserStorage,
                // @ts-ignore
                pca.browserCrypto,
                // @ts-ignore
                pca.logger,
                // @ts-ignore
                pca.eventHandler,
                // @ts-ignore
                pca.navigationClient,
                // @ts-ignore
                pca.performanceClient,
                TEST_CONFIG.CORRELATION_ID
            );

            const clientInst = interactionClient as any;
            getDiscoveredAuthority(
                clientInst.config,
                clientInst.correlationId,
                clientInst.performanceClient,
                clientInst.browserStorage,
                clientInst.logger,
                "https://login.microsoftonline.com/common",
                undefined,
                undefined,
                testAccount
            )
                .then(() => {
                    done();
                })
                .catch((error) => {
                    done(error);
                });
        });
    });
});
