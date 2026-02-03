/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * On-Behalf-Of (OBO) Flow Integration Tests
 *
 * Tests the OBO flow using ROPC (Resource Owner Password Credentials) to acquire
 * the initial user token, then exchanging it for downstream tokens via OBO.
 * Configuration is retrieved from Azure Key Vault via the labUtils package.
 *
 * Test flow:
 * 1. Get user and app configs from Key Vault
 * 2. Create PublicClientApplication and acquire user token via ROPC
 * 3. Create ConfidentialClientApplication and perform OBO exchange
 * 4. Verify tokens are acquired and cached correctly
 */

import {
    PublicClientApplication,
    ConfidentialClientApplication,
    LogLevel,
    AuthenticationResult,
    TokenCacheContext,
} from "@azure/msal-node";
import {
    LabResponseHelper,
    KeyVaultSecrets,
    LabUser,
    AppConfig,
    NodeCacheTestUtils,
    validateCacheLocation,
} from "lab-utils";
import path from "path";

// Test cache locations
const OBO_TEST_CACHE_LOCATION = path.join(__dirname, "data", "oboCacheKv.json");

// Downstream scopes for OBO (e.g., Microsoft Graph)
const OBO_SCOPES = ["User.Read"];

describe("OBO AAD Key Vault Tests (ROPC-based)", () => {
    jest.retryTimes(1);
    jest.setTimeout(90000); // Longer timeout for Key Vault operations

    // Lab user and app configurations
    let user: LabUser;
    let appS2S: AppConfig; // Public client app (multi-tenant)
    let appWebApi: AppConfig; // Confidential client app (Web API)
    let confidentialClientSecret: string;

    // MSAL client applications
    let publicClientApplication: PublicClientApplication;

    beforeAll(async () => {
        // Validate cache location exists
        await validateCacheLocation(OBO_TEST_CACHE_LOCATION);

        // Get user configuration from Key Vault
        user = await LabResponseHelper.getLabUser(
            KeyVaultSecrets.UserPublicCloud
        );
        console.log(`Test user: ${user.upn}`);

        // Get app configurations from Key Vault
        appS2S = await LabResponseHelper.getAppConfig(KeyVaultSecrets.AppS2S);
        appWebApi = await LabResponseHelper.getAppConfig(
            KeyVaultSecrets.AppWebApi
        );

        console.log(`AppS2S (Public Client): ${appS2S.appId}`);
        console.log(`AppWebApi (Confidential Client): ${appWebApi.appId}`);
        console.log(`AppWebApi default scopes: ${appWebApi.defaultScopes}`);

        // Get confidential client secret from Key Vault
        confidentialClientSecret = await LabResponseHelper.getSecret(
            KeyVaultSecrets.MsalOboSecret
        );

        // Create PublicClientApplication for ROPC token acquisition
        publicClientApplication = new PublicClientApplication({
            auth: {
                clientId: appS2S.appId!,
                authority: "https://login.microsoftonline.com/organizations",
            },
            system: {
                loggerOptions: {
                    loggerCallback: (level, message, containsPii) => {
                        if (level <= LogLevel.Warning) {
                            console.log(`[PCA] ${message}`);
                        }
                    },
                    piiLoggingEnabled: false,
                    logLevel: LogLevel.Warning,
                },
            },
        });
    });

    afterAll(async () => {
        // Clean up cache
        await NodeCacheTestUtils.resetCache(OBO_TEST_CACHE_LOCATION);
    });

    beforeEach(async () => {
        // Reset cache before each test
        await NodeCacheTestUtils.resetCache(OBO_TEST_CACHE_LOCATION);
    });

    describe("Basic OBO Flow", () => {
        it("Performs acquire token via OBO flow using ROPC", async () => {
            // Step 1: Acquire user token via ROPC (Username/Password)
            const userPassword = await user.getPassword();

            // Parse the defaultScopes from appWebApi (comes as space-separated string)
            const webApiScopes = appWebApi.defaultScopes
                ? appWebApi.defaultScopes.split(" ")
                : [`api://${appWebApi.appId}/access_as_user`];

            console.log(
                `Acquiring user token via ROPC for scopes: ${webApiScopes.join(
                    ", "
                )}`
            );

            const userAuthResult =
                await publicClientApplication.acquireTokenByUsernamePassword({
                    scopes: webApiScopes,
                    username: user.upn!,
                    password: userPassword,
                });

            expect(userAuthResult).toBeDefined();
            expect(userAuthResult.accessToken).toBeDefined();
            expect(userAuthResult.accessToken.length).toBeGreaterThan(0);
            console.log(
                `User token acquired. TenantId: ${userAuthResult.tenantId}`
            );

            // Step 2: Create ConfidentialClientApplication for OBO
            const confidentialClientApplication = createConfidentialClient(
                userAuthResult.tenantId
            );

            // Step 3: Perform OBO to get downstream token (e.g., for Microsoft Graph)
            console.log(`Performing OBO for scopes: ${OBO_SCOPES.join(", ")}`);

            const oboResult =
                await confidentialClientApplication.acquireTokenOnBehalfOf({
                    oboAssertion: userAuthResult.accessToken,
                    scopes: OBO_SCOPES,
                });

            // Verify OBO result
            expect(oboResult).toBeDefined();
            expect(oboResult.accessToken).toBeDefined();
            expect(oboResult.accessToken.length).toBeGreaterThan(0);
            expect(oboResult.scopes).toEqual(
                expect.arrayContaining(["User.Read"])
            );

            console.log(`OBO token acquired successfully`);
            console.log(
                `Token source: ${
                    oboResult.fromCache ? "Cache" : "Identity Provider"
                }`
            );
        });

        it("OBO returns cached token on second call with same assertion", async () => {
            // Step 1: Acquire user token via ROPC
            const userPassword = await user.getPassword();
            const webApiScopes = appWebApi.defaultScopes
                ? appWebApi.defaultScopes.split(" ")
                : [`api://${appWebApi.appId}/access_as_user`];

            const userAuthResult =
                await publicClientApplication.acquireTokenByUsernamePassword({
                    scopes: webApiScopes,
                    username: user.upn!,
                    password: userPassword,
                });

            expect(userAuthResult).toBeDefined();

            // Step 2: Create ConfidentialClientApplication with in-memory cache
            const confidentialClientApplication = createConfidentialClient(
                userAuthResult.tenantId
            );

            // Step 3: First OBO call - should hit identity provider
            const oboResult1 =
                await confidentialClientApplication.acquireTokenOnBehalfOf({
                    oboAssertion: userAuthResult.accessToken,
                    scopes: OBO_SCOPES,
                });

            expect(oboResult1).toBeDefined();
            expect(oboResult1.accessToken).toBeDefined();
            // First call should NOT be from cache
            expect(oboResult1.fromCache).toBe(false);
            console.log(`First OBO call - Token source: Identity Provider`);

            const firstToken = oboResult1.accessToken;

            // Step 4: Second OBO call with same assertion - should hit cache
            const oboResult2 =
                await confidentialClientApplication.acquireTokenOnBehalfOf({
                    oboAssertion: userAuthResult.accessToken,
                    scopes: OBO_SCOPES,
                });

            expect(oboResult2).toBeDefined();
            expect(oboResult2.accessToken).toBeDefined();
            // Second call SHOULD be from cache
            expect(oboResult2.fromCache).toBe(true);
            console.log(`Second OBO call - Token source: Cache`);

            // Tokens should be the same (cached)
            expect(oboResult2.accessToken).toBe(firstToken);
        });
    });

    describe("Multi-User OBO Flow", () => {
        it("OBO returns correct tokens for different users", async () => {
            // Get a second user from Key Vault
            const user2 = await LabResponseHelper.getLabUser(
                KeyVaultSecrets.UserPublicCloud2
            );
            console.log(`Second test user: ${user2.upn}`);

            const webApiScopes = appWebApi.defaultScopes
                ? appWebApi.defaultScopes.split(" ")
                : [`api://${appWebApi.appId}/access_as_user`];

            // Acquire tokens for both users via ROPC
            const user1Password = await user.getPassword();
            const user2Password = await user2.getPassword();

            const user1AuthResult =
                await publicClientApplication.acquireTokenByUsernamePassword({
                    scopes: webApiScopes,
                    username: user.upn!,
                    password: user1Password,
                });

            const user2AuthResult =
                await publicClientApplication.acquireTokenByUsernamePassword({
                    scopes: webApiScopes,
                    username: user2.upn!,
                    password: user2Password,
                });

            expect(user1AuthResult).toBeDefined();
            expect(user2AuthResult).toBeDefined();

            // Both users should be in the same tenant
            expect(user1AuthResult.tenantId).toBe(user2AuthResult.tenantId);

            // Create CCA for OBO
            const confidentialClientApplication = createConfidentialClient(
                user1AuthResult.tenantId
            );

            // Track unique OBO tokens
            const oboTokens = new Set<string>();

            // User1 - first OBO call - should hit identity provider
            const user1OboResult1 =
                await confidentialClientApplication.acquireTokenOnBehalfOf({
                    oboAssertion: user1AuthResult.accessToken,
                    scopes: OBO_SCOPES,
                });
            expect(user1OboResult1.fromCache).toBe(false);
            oboTokens.add(user1OboResult1.accessToken);
            console.log(`User1 first OBO - from IdP`);

            // User1 - second OBO call - should hit cache
            const user1OboResult2 =
                await confidentialClientApplication.acquireTokenOnBehalfOf({
                    oboAssertion: user1AuthResult.accessToken,
                    scopes: OBO_SCOPES,
                });
            expect(user1OboResult2.fromCache).toBe(true);
            oboTokens.add(user1OboResult2.accessToken);
            console.log(`User1 second OBO - from cache`);

            // User2 - first OBO call - should hit identity provider
            const user2OboResult1 =
                await confidentialClientApplication.acquireTokenOnBehalfOf({
                    oboAssertion: user2AuthResult.accessToken,
                    scopes: OBO_SCOPES,
                });
            expect(user2OboResult1.fromCache).toBe(false);
            oboTokens.add(user2OboResult1.accessToken);
            console.log(`User2 first OBO - from IdP`);

            // User2 - second OBO call - should hit cache
            const user2OboResult2 =
                await confidentialClientApplication.acquireTokenOnBehalfOf({
                    oboAssertion: user2AuthResult.accessToken,
                    scopes: OBO_SCOPES,
                });
            expect(user2OboResult2.fromCache).toBe(true);
            oboTokens.add(user2OboResult2.accessToken);
            console.log(`User2 second OBO - from cache`);

            // Should have exactly 2 unique tokens (one per user)
            expect(oboTokens.size).toBe(2);
            console.log(`Unique OBO tokens: ${oboTokens.size}`);
        });
    });

    /**
     * Helper function to create a ConfidentialClientApplication for OBO.
     */
    function createConfidentialClient(
        tenantId: string
    ): ConfidentialClientApplication {
        return new ConfidentialClientApplication({
            auth: {
                clientId: appWebApi.appId!,
                authority: `https://login.microsoftonline.com/${tenantId}`,
                clientSecret: confidentialClientSecret,
            },
            system: {
                loggerOptions: {
                    loggerCallback: (level, message, containsPii) => {
                        if (level <= LogLevel.Warning) {
                            console.log(`[CCA] ${message}`);
                        }
                    },
                    piiLoggingEnabled: false,
                    logLevel: LogLevel.Warning,
                },
            },
        });
    }
});
