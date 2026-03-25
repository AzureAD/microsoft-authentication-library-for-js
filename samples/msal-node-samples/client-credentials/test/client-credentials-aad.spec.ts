import {
    RETRY_TIMES,
    retrieveAppConfiguration,
    validateCacheLocation,
    LabApiQueryParams,
    NodeCacheTestUtils,
    LabClient,
    getCertificateInfo,
    LAB_KEY_VAULT_URL,
    LAB_CERT_NAME,
} from "e2e-test-utils";
import { DefaultAzureCredential } from "@azure/identity";
import { ConfidentialClientApplication } from "@azure/msal-node";
import config from "../config/AAD.json";

const TEST_CACHE_LOCATION = `${__dirname}/data/aad.cache.json`;

const getClientCredentialsToken = require("../index");

const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

let clientID: string;
let clientSecret: string;
let authority: string;

// Regional app config
const regionalAppId = "c7a0804c-df37-4387-a687-5f2e31f1c819";
const regionalAuthority =
    "https://login.microsoftonline.com/c7cef333-42af-492c-afb0-21f74a661133";

const clientCredentialRequestScopes = ["https://graph.microsoft.com/.default"];

describe("Client Credentials AAD Prod Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    jest.setTimeout(90000);

    // Certificate credentials for regional test
    let thumbprint: string;
    let privateKey: string;
    let x5c: string;

    beforeAll(async () => {
        await validateCacheLocation(TEST_CACHE_LOCATION);

        const credentials = new DefaultAzureCredential();

        // Get S2S app config from Key Vault (client secret auth)
        const labApiParms: LabApiQueryParams = {
            appType: "cloud",
            publicClient: "no",
            signInAudience: "azureadmyorg",
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(
            labApiParms
        );
        [clientID, clientSecret, authority] = await retrieveAppConfiguration(
            envResponse[0],
            labClient,
            true
        );

        // Update the complete config
        config.authOptions.clientId = clientID;
        config.authOptions.clientSecret = clientSecret;
        config.authOptions.authority = authority;

        // Get lab certificate for regional test (SN+I auth)
        [thumbprint, privateKey, x5c] = await getCertificateInfo(
            credentials,
            LAB_KEY_VAULT_URL,
            LAB_CERT_NAME
        );
    });

    describe("Acquire Token", () => {
        let confidentialClientApplication: ConfidentialClientApplication;

        beforeAll(async () => {
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        afterEach(async () => {
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("Performs acquire token", async () => {
            confidentialClientApplication = new ConfidentialClientApplication({
                auth: config.authOptions,
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
                        thumbprintSha256: thumbprint,
                        privateKey: privateKey,
                        x5c: x5c,
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
