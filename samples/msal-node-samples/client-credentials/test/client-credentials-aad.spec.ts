import {
    RETRY_TIMES,
    retrieveAppConfiguration,
    validateCacheLocation,
    LabApiQueryParams,
    NodeCacheTestUtils,
    LabClient,
} from "e2e-test-utils";
import { ConfidentialClientApplication } from "@azure/msal-node";
import config from "../config/AAD.json";
import fs from "fs";

const TEST_CACHE_LOCATION = `${__dirname}/data/aad.cache.json`;

const getClientCredentialsToken = require("../index");

const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

let clientID;
let clientSecret;
let authority;

const clientCredentialRequestScopes = ["https://graph.microsoft.com/.default"];

console.log(process.env["AZURE_CLIENT_CERT_PATH"]);
const privateKeySource = fs.readFileSync(process.env["AZURE_CLIENT_CERT_PATH"]);
console.log(privateKeySource);

describe("Client Credentials AAD Prod Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    jest.setTimeout(90000);

    beforeAll(async () => {
        await validateCacheLocation(TEST_CACHE_LOCATION);

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
    });

    describe("Acquire Token", () => {
        let confidentialClientApplication: ConfidentialClientApplication;
        let server: any;
        console.log(cert);

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
