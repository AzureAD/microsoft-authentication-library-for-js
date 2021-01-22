import "jest";
import puppeteer from "puppeteer";
import { Screenshot, createFolder, setupCredentials } from "../../../../../e2eTestUtils/TestUtils";
import { NodeCacheTestUtils } from "../../../../../e2eTestUtils/NodeCacheTestUtils";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AppTypes, AzureEnvironments } from "../../../../../e2eTestUtils/Constants";
import { 
    enterCredentials, 
    enterDeviceCode,
    SCREENSHOT_BASE_FOLDER_NAME,
    extractDeviceCodeParameters,
    validateCacheLocation,
    checkTimeoutError
 } from "../testUtils";

import scenarioConfig from "../../scenarios/device-code-aad.json";
import { Configuration, PublicClientApplication } from "../../../../../../lib/msal-node";

const TEST_CACHE_LOCATION = `${__dirname}/data/testCache.json`;

const getDeviceCode = require("../../routes/deviceCode.js");
const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);
let username: string;
let accountPwd: string;


describe('Device Code AAD PPE Tests', () => {
    jest.setTimeout(15000);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let publicClientApplication: PublicClientApplication;
    let clientConfig: Configuration;
    
    beforeAll(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        const labApiParms: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.PPE,
            appType: AppTypes.CLOUD,
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParms);
        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);

        browser = await puppeteer.launch({
            headless: true,
            ignoreDefaultArgs: ['--no-sandbox', '-disable-setuid-sandbox', '--disable-extensions']
        });

        clientConfig = { auth: scenarioConfig.authOptions, cache: { cachePlugin } };
    });

    afterAll(async () => {
        await browser.close();
    });

    describe("Acquire Token", () => {
        let testName: string;
        let screenshot: Screenshot;

        beforeAll(async () => {
            publicClientApplication = new PublicClientApplication(clientConfig);
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        beforeEach(async () => {
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
        });

        afterEach(async () => {
            await page.close();
            await context.close();
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("Performs acquire token with Device Code flow", async (done) => {
            testName = "AADAcquireTokenWithDeviceCode";
            screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

            const deviceCodeCallback = async(deviceCodeResponse: any) => {
                const { userCode, verificationUri} = deviceCodeResponse;
                await enterDeviceCode(page, screenshot, userCode, verificationUri);
                await enterCredentials(page, screenshot, username, accountPwd);
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