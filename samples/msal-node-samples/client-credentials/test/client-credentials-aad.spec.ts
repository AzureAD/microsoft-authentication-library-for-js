/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * Client Credentials integration tests using Key Vault-based configuration.
 * Tests use certificate-based authentication to acquire tokens.
 */

import {
    RETRY_TIMES,
    validateCacheLocation,
    NodeCacheTestUtils,
    LabResponseHelper,
    KeyVaultSecrets,
    getLabCredential,
    LabCertificateCredential,
} from "e2e-test-utils";
import { ConfidentialClientApplication } from "@azure/msal-node";

const TEST_CACHE_LOCATION = `${__dirname}/data/aad.cache.json`;

const getClientCredentialsToken = require("../index");

const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

const clientCredentialRequestScopes = ["https://vault.azure.net/.default"];

describe("Client Credentials AAD Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    jest.setTimeout(90000);

    // Lab certificate credential (used for both tests)
    let labCredential: LabCertificateCredential;

    // App configs from Key Vault
    let s2sAppId: string;
    let s2sAuthority: string;
    let regionalAppId: string;
    let regionalAuthority: string;

    beforeAll(async () => {
        await validateCacheLocation(TEST_CACHE_LOCATION);

        // Get the lab certificate credential (same cert used for Key Vault auth)
        labCredential = getLabCredential();

        // Get standard S2S app configuration from Key Vault
        const s2sAppConfig = await LabResponseHelper.getAppConfig(
            KeyVaultSecrets.AppS2S
        );
        s2sAppId = s2sAppConfig.appId!;
        s2sAuthority = s2sAppConfig.authority!;

        // Get regional app configuration from Key Vault
        const regionalAppConfig = await LabResponseHelper.getAppConfig(
            KeyVaultSecrets.MsalAppAzureAdMultipleOrgsRegional
        );
        regionalAppId = regionalAppConfig.appId!;
        regionalAuthority = regionalAppConfig.authority!;

        console.log(
            `Test setup complete - S2S App ID: ${s2sAppId}, Regional App ID: ${regionalAppId}`
        );
    });

    describe("Acquire Token with Certificate", () => {
        let confidentialClientApplication: ConfidentialClientApplication;

        beforeAll(async () => {
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        afterEach(async () => {
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("Performs acquire token", async () => {
            confidentialClientApplication = new ConfidentialClientApplication({
                auth: {
                    clientId: s2sAppId,
                    authority: s2sAuthority,
                    clientCertificate: {
                        thumbprintSha256: labCredential.thumbprintSha256,
                        privateKey: labCredential.privateKey,
                        x5c: labCredential.x5c,
                    },
                },
                cache: { cachePlugin },
            });

            await getClientCredentialsToken(
                confidentialClientApplication,
                clientCredentialRequestScopes
            );

            const cachedTokens = await NodeCacheTestUtils.getTokens(
                TEST_CACHE_LOCATION
            );
            expect(cachedTokens.accessTokens.length).toBe(1);
        });

        it("Performs acquire token through regional authorities", async () => {
            confidentialClientApplication = new ConfidentialClientApplication({
                auth: {
                    clientId: regionalAppId,
                    authority: regionalAuthority,
                    clientCertificate: {
                        thumbprintSha256: labCredential.thumbprintSha256,
                        privateKey: labCredential.privateKey,
                        x5c: labCredential.x5c,
                    },
                },
                cache: { cachePlugin },
            });

            await getClientCredentialsToken(
                confidentialClientApplication,
                clientCredentialRequestScopes,
                { region: "westus2" }
            );

            const cachedTokens = await NodeCacheTestUtils.getTokens(
                TEST_CACHE_LOCATION
            );
            expect(cachedTokens.accessTokens.length).toBe(1);
        });
    });
});
