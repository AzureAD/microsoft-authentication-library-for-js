import "jest";
import puppeteer from "puppeteer";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
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
 } from "../testUtils";

const TEST_CACHE_LOCATION = `${__dirname}/data/testCache.json`;
const SUCCESSFUL_SIGNED_IN_MESSAGE = "You have signed in";

let username: string;
let accountPwd: string;

describe('Device Code AAD PPE Tests', () => {
    jest.setTimeout(60000);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let device: ChildProcessWithoutNullStreams;
    const stream: Array<any> = [];
    
    beforeAll(async() => {
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
    });

    afterAll(async () => {
        await browser.close();
    });

    describe("Acquire Token", () => {
        let testName: string;
        let screenshot: Screenshot;

        beforeAll(() => {
            testName = "deviceCodeAADFlowBaseCase";
            screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
            NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        beforeEach(async () => {
            device = spawn(/^win/.test(process.platform) ? "npm.cmd" : "npm", ["start", "--", "-s", "device-code-aad", "-c", TEST_CACHE_LOCATION]);

            device.stdout.on('data', (chunk) => stream.push(chunk));

            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            page.setDefaultNavigationTimeout(0);
        });

        afterEach(async () => {
            device.kill();
            await page.close();
            await context.close();
            NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("Performs acquire token with Device Code flow", async () => {
            const { deviceCode, deviceLoginUrl }: { deviceCode: string, deviceLoginUrl: string } = await new Promise((resolve) => {
                const intervalId = setInterval(() => {
                    const output = Buffer.concat(stream).toString();
                    const deviceCodeParameters = extractDeviceCodeParameters(output);
                    if (deviceCodeParameters) {
                        clearInterval(intervalId);  
                        resolve(deviceCodeParameters);
                    }
                }, 500);
            });

            await enterDeviceCode(page, screenshot, deviceCode, deviceLoginUrl);
            await enterCredentials(page, screenshot, username, accountPwd);
            const htmlBody = await page.evaluate(() => document.body.innerHTML);
            expect(htmlBody).toContain(SUCCESSFUL_SIGNED_IN_MESSAGE);
            const cachedTokens = await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
         });
    });
});