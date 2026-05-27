import * as puppeteer from "puppeteer";
import {
    Screenshot,
    setupCredentials,
    LabClient,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
    BrowserCacheUtils,
} from "e2e-test-utils";
import {
    forceRefreshAndVerifyTokenCountsDoNotChange,
    verifyCacheWasUsed,
    switchToVersion,
    signIn,
} from "./test-helpers";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/upgrade-downgrade-tests`;

describe("Upgrade/Downgrade Tests", () => {
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let port: number;
    let username: string;
    let accountPwd: string;
    let BrowserCache: BrowserCacheUtils;

    beforeAll(async () => {
        // @ts-ignore
        browser = await global.__BROWSER__;
        // @ts-ignore
        port = global.__PORT__;

        const labApiParams: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD,
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(
            labApiParams
        );

        [username, accountPwd] = await setupCredentials(
            envResponse[0],
            labClient
        );
    });

    beforeEach(async () => {
        context = await browser.createBrowserContext();
        page = await context.newPage();
        BrowserCache = new BrowserCacheUtils(page, "localStorage");
        await page.goto(`http://localhost:${port}`, { timeout: 10000 });
    });

    afterEach(async () => {
        await page.close();
        await context.close();
    });

    /**
     * Upgrade test flow should be:
     * 1. Sign-in using the old version to populate the cache
     * 2. Upgrade to the local version
     * 3. Verify tokens can be pulled from the cache
     */
    describe("Upgrade tests", () => {
        test("acquireTokenSilent can return tokens from the cache after upgrading from the previous version", async () => {
            const testName = "upgradeLatest";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await screenshot.takeScreenshot(page, "Page loaded");

            await switchToVersion("latest", page, screenshot);
            await signIn(page, screenshot, username, accountPwd);
            await switchToVersion("local", page, screenshot);

            await verifyCacheWasUsed(page, screenshot);
            await forceRefreshAndVerifyTokenCountsDoNotChange(
                page,
                screenshot,
                BrowserCache
            );
        });

        test("acquireTokenSilent can return tokens from the cache after upgrading from the latest v4 version", async () => {
            const testName = "upgradeLatestV4";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await screenshot.takeScreenshot(page, "Page loaded");

            await switchToVersion("latest-v4", page, screenshot);
            await signIn(page, screenshot, username, accountPwd);
            await switchToVersion("local", page, screenshot);

            await verifyCacheWasUsed(page, screenshot);
            await forceRefreshAndVerifyTokenCountsDoNotChange(
                page,
                screenshot,
                BrowserCache
            );
        });

        test("acquireTokenSilent can return tokens from the cache after upgrading from 5.7.0 (cache schema v2)", async () => {
            const testName = "upgradeV5-7-0";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await screenshot.takeScreenshot(page, "Page loaded");

            await switchToVersion("5.7.0", page, screenshot);
            await signIn(page, screenshot, username, accountPwd);
            await switchToVersion("local", page, screenshot);

            await verifyCacheWasUsed(page, screenshot);
            await forceRefreshAndVerifyTokenCountsDoNotChange(
                page,
                screenshot,
                BrowserCache
            );
        });

        test("acquireTokenSilent can return tokens from the cache after upgrading from 4.25.0 (cache schema v1)", async () => {
            const testName = "upgradeV4-25-0";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await screenshot.takeScreenshot(page, "Page loaded");

            await switchToVersion("4.25.0", page, screenshot);
            await signIn(page, screenshot, username, accountPwd);
            await switchToVersion("local", page, screenshot);

            await verifyCacheWasUsed(page, screenshot);
            await forceRefreshAndVerifyTokenCountsDoNotChange(
                page,
                screenshot,
                BrowserCache
            );
        });

        test("acquireTokenSilent can return tokens from the cache after upgrading from 4.18.0 (cache schema v0)", async () => {
            const testName = "upgradeV4-18-0";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await screenshot.takeScreenshot(page, "Page loaded");

            await switchToVersion("4.18.0", page, screenshot);
            await signIn(page, screenshot, username, accountPwd);
            await switchToVersion("local", page, screenshot);

            await verifyCacheWasUsed(page, screenshot);
            await forceRefreshAndVerifyTokenCountsDoNotChange(
                page,
                screenshot,
                BrowserCache
            );
        });

        test("acquireTokenSilent can return tokens from the cache after downgrading to v3 and then upgrading back to local version", async () => {
            const testName = "upgradeV3";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await screenshot.takeScreenshot(page, "Page loaded");

            await switchToVersion("local", page, screenshot);
            await signIn(page, screenshot, username, accountPwd);

            await switchToVersion("latest-v3", page, screenshot);
            // v3 can't read the v4 cache so we need to sign back in via SSO
            await signIn(page, screenshot, username, accountPwd, true);

            await switchToVersion("local", page, screenshot);

            await verifyCacheWasUsed(page, screenshot);
            await forceRefreshAndVerifyTokenCountsDoNotChange(
                page,
                screenshot,
                BrowserCache
            );
        });
    });
});
