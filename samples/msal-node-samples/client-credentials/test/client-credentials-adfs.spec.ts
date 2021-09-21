import { setupCredentials } from "../../../e2eTestUtils/TestUtils";
import { NodeCacheTestUtils } from "../../../e2eTestUtils/NodeCacheTestUtils";
import { LabClient } from "../../../e2eTestUtils/LabClient";
import { LabApiQueryParams } from "../../../e2eTestUtils/LabApiQueryParams";
import { AppTypes, AzureEnvironments, FederationProviders, UserTypes } from "../../../e2eTestUtils/Constants";
import { ConfidentialClientApplication } from "../../../../lib/msal-node/";
import config from "../config/ADFS.json";

const TEST_CACHE_LOCATION = `${__dirname}/data/adfs.cache.json`;

const getClientCredentialsToken = require("../index");

const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

let username: string;
let accountPwd: string;

describe('Client Credentials ADFS PPE Tests', () => {
    jest.retryTimes(1);
    jest.setTimeout(90000);
    
    beforeAll(async () => {
        const labApiParms: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD,
            federationProvider: FederationProviders.ADFS2019,
            userType: UserTypes.FEDERATED
        }; 

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParms);
        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);
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