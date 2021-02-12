import "jest";
import puppeteer from "puppeteer";
import { Screenshot, createFolder, setupCredentials } from "../../../../e2eTestUtils/TestUtils";
import { NodeCacheTestUtils } from "../../../../e2eTestUtils/NodeCacheTestUtils";
import { LabClient } from "../../../../e2eTestUtils/LabClient";
import { LabApiQueryParams } from "../../../../e2eTestUtils/LabApiQueryParams";
import { AppTypes, AzureEnvironments } from "../../../../e2eTestUtils/Constants";
import { 
    enterCredentials, 
    enterDeviceCode,
    SCREENSHOT_BASE_FOLDER_NAME,
    validateCacheLocation
 } from "../../testUtils";

import { Configuration, PublicClientApplication } from "../../../../../lib/msal-node";

const TEST_CACHE_LOCATION = `${__dirname}/data/testCache.json`;

const getDeviceCode = require("../index.js");
const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

let username: string;
let accountPwd: string;

const config = require("../authConfig.json");


describe('Device Code AAD PPE Tests', () => {
    jest.setTimeout(20000);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let port: string;
    let publicClientApplication: PublicClientApplication;
    let clientConfig: Configuration;
    
    beforeAll(async () => {
        // @ts-ignore
        browser = await global.__BROWSER__;
        // @ts-ignore
        port = global.__PORT__;

        await validateCacheLocation(TEST_CACHE_LOCATION);

        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        const labApiParms: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.PPE,
            appType: AppTypes.CLOUD,
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParms);
        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);
    });

    afterAll(async () => {
        await browser.close();
    });

    describe("Acquire Token", () => {
        let testName: string;
        let screenshot: Screenshot;

        beforeAll(async () => {
            clientConfig = { auth: config.authOptions, cache: { cachePlugin } };
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
            
            await getDeviceCode(config, publicClientApplication, { deviceCodeCallback: deviceCodeCallback });
            const cachedTokens = await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
            done();
         });
    });
});