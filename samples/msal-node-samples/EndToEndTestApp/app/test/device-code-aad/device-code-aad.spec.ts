import "jest";
import puppeteer from "puppeteer";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { Screenshot, createFolder, setupCredentials } from "../../../../../e2eTestUtils/TestUtils";
import { NodeCacheTestUtils } from "../../../../../e2eTestUtils/NodeCacheTestUtils";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AppTypes, AzureEnvironments, FederationProviders, UserTypes } from "../../../../../e2eTestUtils/Constants";
import { enterCredentials, extractDeviceCode, enterDeviceCode } from "../testUtils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
const DEVICE_LOGIN_URL = 'https://microsoft.com/devicelogin';
const TEST_CACHE_LOCATION = `${__dirname}/data/testCache.json`;

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
            testName = "deviceCodeFlowBaseCase";
            screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
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

        it("Acquires token through the Device Code flow", async () => {
            const deviceCode: string = await new Promise((resolve) => {
                const intervalId = setInterval(() => {
                    const code = extractDeviceCode(Buffer.concat(stream).toString());
                    if (code) {
                        clearInterval(intervalId);  
                        resolve(code);
                    }
                }, 500)
            });

            await enterDeviceCode(page, screenshot, deviceCode, DEVICE_LOGIN_URL);
            await enterCredentials(page, screenshot, username, accountPwd);
            const cachedTokens = NodeCacheTestUtils.getTokens(TEST_CACHE_LOCATION);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1)
         });
    });
});