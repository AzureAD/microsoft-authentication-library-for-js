import {
    RETRY_TIMES,
    validateCacheLocation,
    NodeCacheTestUtils,
} from "e2e-test-utils";
import { ConfidentialClientApplication } from "@azure/msal-node";
import config from "../config/AAD.json";
import { getKeyVaultSecretClient } from "e2e-test-utils/src/KeyVaultUtils";
import { getCertificateInfo } from "e2e-test-utils/src/CertificateUtils";
import { LAB_CERT_NAME, LAB_KEY_VAULT_URL } from "e2e-test-utils/src/Constants";

const TEST_CACHE_LOCATION = `${__dirname}/data/aad.cache.json`;

const getClientCredentialsToken = require("../index");

const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

const clientCredentialRequestScopes = ["https://graph.microsoft.com/.default"];

describe("Client Credentials AAD Prod Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    jest.setTimeout(90000);

    let thumbprint: string;
    let privateKey: string;
    let x5c: string;
    beforeAll(async () => {
        await validateCacheLocation(TEST_CACHE_LOCATION);

        const keyVaultSecretClient = await getKeyVaultSecretClient(
            LAB_KEY_VAULT_URL
        );
        [thumbprint, privateKey, x5c] = await getCertificateInfo(
            keyVaultSecretClient,
            LAB_CERT_NAME
        );

        // TODO // get these from Lab Client, or am I allowed to save these as constants?
        config.authOptions.clientId = "microsoft client id";
        config.authOptions.authority = "microsoft authority";

        config.authOptions.clientCertificate = {
            thumbprintSha256: thumbprint,
            privateKey: privateKey,
            x5c: x5c,
        };
    });

    describe("Acquire Token", () => {
        let confidentialClientApplication: ConfidentialClientApplication;
        let server: any;

        beforeAll(async () => {
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        afterEach(async () => {
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        afterAll(async () => {
            if (server) await server.close();
        });

        it("Performs acquire token", async () => {
            confidentialClientApplication = new ConfidentialClientApplication({
                auth: config.authOptions,
                cache: { cachePlugin },
            });
            server = await getClientCredentialsToken(
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
                auth: config.authOptions,
                cache: { cachePlugin },
            });
            server = await getClientCredentialsToken(
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
