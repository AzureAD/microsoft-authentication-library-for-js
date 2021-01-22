import "jest";
import puppeteer from "puppeteer";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { Screenshot, createFolder, setupCredentials } from "../../../../../e2eTestUtils/TestUtils";
import { NodeCacheTestUtils } from "../../../../../e2eTestUtils/NodeCacheTestUtils";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AppTypes, AzureEnvironments, FederationProviders, UserTypes } from "../../../../../e2eTestUtils/Constants";
import { 
    enterDeviceCode,
    SCREENSHOT_BASE_FOLDER_NAME,
    extractDeviceCodeParameters,
    enterCredentialsADFS,
    checkTimeoutError,
 } from "../testUtils";

 import scenarioConfig from "../../scenarios/device-code-adfs.json";
 import { PublicClientApplication } from "../../../../../../lib/msal-node";
 const TEST_CACHE_LOCATION = `${__dirname}/data/testCache.json`;
 
 const getDeviceCode = require("../../routes/deviceCode.js");
 const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);
 

let username: string;
let accountPwd: string;

describe('Device Code ADFS PPE Tests', () => {
    jest.setTimeout(15000);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    
    beforeAll(async() => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);

        const labApiParms: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD,
            federationProvider: FederationProviders.ADFS2019,
            userType: UserTypes.FEDERATED
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParms);
        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);

        browser = await puppeteer.launch({
            headless: true,
            ignoreDefaultArgs: ['--no-sandbox', '-disable-setuid-sandbox', '--disable-extensions']
        });
    });

    afterAll(async () => {
        await browser.close();
    });

    describe("Acquire Token", () => {
        let testName: string;
        let screenshot: Screenshot;
        let publicClientApplication: PublicClientApplication;

        beforeAll(() => {
            const clientConfig = { auth: scenarioConfig.authOptions, cache: { cachePlugin }};
            publicClientApplication = new PublicClientApplication(clientConfig);
            NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        beforeEach(async () => {
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            page.setDefaultNavigationTimeout(0);
        });

        afterEach(async () => {
            await page.close();
            await context.close();
            NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("Performs acquire token with Device Code flow", async (done) => {
            testName = "AADAcquireTokenWithDeviceCode";
            screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

            const deviceCodeCallback = async(deviceCodeResponse: any) => {
                const { userCode, verificationUri} = deviceCodeResponse;
                await enterDeviceCode(page, screenshot, userCode, verificationUri);
                await enterCredentialsADFS(page, screenshot, username, accountPwd);
                await page.waitForSelector("#message");
                await screenshot.takeScreenshot(page, "SuccessfulDeviceCodeMessage");
            };
            
            await getDeviceCode(scenarioConfig, publicClientApplication, { deviceCodeCallback: deviceCodeCallback });
            const cachedTokens = await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
            done();
         });
    });
});