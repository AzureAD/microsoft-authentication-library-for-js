import { NodeCacheTestUtils } from "../../../e2eTestUtils/NodeCacheTestUtils";
import { ConfidentialClientApplication } from "../../../../lib/msal-node/";
import config from "../config/AAD.json";

const TEST_CACHE_LOCATION = `${__dirname}/data/aad.cache.json`;

const getClientCredentialsToken = require("../index");

const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

describe('Client Credentials AAD PPE Tests', () => {
    jest.retryTimes(1);
    jest.setTimeout(90000);
    
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
            if (server) await server.close()
        })

        it("Performs acquire token", async () => {
            confidentialClientApplication = new ConfidentialClientApplication({ auth: config.authOptions, cache: { cachePlugin }});
            server = await getClientCredentialsToken(confidentialClientApplication);
            const cachedTokens = await NodeCacheTestUtils.getTokens(TEST_CACHE_LOCATION);
            expect(cachedTokens.accessTokens.length).toBe(1);
        });

        it("Performs acquire token through regional authorities", async () => {
            confidentialClientApplication = new ConfidentialClientApplication({ auth: config.authOptions, cache: { cachePlugin }});
            server = await getClientCredentialsToken(confidentialClientApplication, { region: "westus2" });
            const cachedTokens = await NodeCacheTestUtils.getTokens(TEST_CACHE_LOCATION);
            expect(cachedTokens.accessTokens.length).toBe(1);
        });
    });
});