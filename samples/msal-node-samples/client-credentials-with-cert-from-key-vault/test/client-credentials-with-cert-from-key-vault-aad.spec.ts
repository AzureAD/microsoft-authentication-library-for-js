import {
    RETRY_TIMES,
    validateCacheLocation,
    NodeCacheTestUtils,
} from "e2e-test-utils";
import { ConfidentialClientApplication, Configuration } from "@azure/msal-node";
import { getKeyVaultSecretClient } from "e2e-test-utils/src/KeyVaultUtils";
import { getCertificateInfo } from "e2e-test-utils/src/CertificateUtils";
import {
    ENV_VARIABLES,
    LAB_CERT_NAME,
    LAB_KEY_VAULT_URL,
} from "e2e-test-utils/src/Constants";
import getClientCredentialsToken from "../app";

const TEST_CACHE_LOCATION = `${__dirname}/data/aad.cache.json`;
import cachePluginFunctionality from "../../cachePlugin";
const cachePlugin = cachePluginFunctionality(TEST_CACHE_LOCATION);

const clientCredentialRequestScopes = ["https://graph.microsoft.com/.default"];

describe("Client Credentials AAD Prod Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    jest.setTimeout(90000);

    let thumbprint: string;
    let privateKey: string;
    let x5c: string;
    let config: Configuration;
    beforeAll(async () => {
        await validateCacheLocation(TEST_CACHE_LOCATION);

        const keyVaultSecretClient = await getKeyVaultSecretClient(
            LAB_KEY_VAULT_URL
        );
        [thumbprint, privateKey, x5c] = await getCertificateInfo(
            keyVaultSecretClient,
            LAB_CERT_NAME
        );

        config = {
            auth: {
                clientId: process.env[ENV_VARIABLES.CLIENT_ID] as string,
                authority: `https://login.microsoftonline.com/${
                    process.env[ENV_VARIABLES.TENANT]
                }`,
                clientCertificate: {
                    thumbprintSha256: thumbprint,
                    privateKey: privateKey,
                    x5c: x5c,
                },
            },
            cache: { cachePlugin },
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
            confidentialClientApplication = new ConfidentialClientApplication(
                config
            );
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
            confidentialClientApplication = new ConfidentialClientApplication(
                config
            );
            server = await getClientCredentialsToken(
                confidentialClientApplication,
                clientCredentialRequestScopes,
                "westus2"
            );
            const cachedTokens = await NodeCacheTestUtils.getTokens(
                TEST_CACHE_LOCATION
            );
            expect(cachedTokens.accessTokens.length).toBe(1);
        });
    });
});
