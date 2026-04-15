import * as puppeteer from "puppeteer";
import {
    Screenshot,
    setupCredentials,
    LabClient,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
    BrowserCacheUtils
} from "e2e-test-utils";
import { verifyCacheWasUsed, switchToVersion, signIn } from "./test-helpers";

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
     * This test verifies that this test file is up to date with the latest changes to the cache schema. After incrementing the cache schema version in the library this test will fail.
     * When this test fails please add new test cases to cover upgrading to the new version and downgrading back to each of the previous versions, then update the schema version constants in the test below.
     */
    test("Verify Schema Version", async () => {
        // DO NOT UPDATE THESE CONSTANTS UNTIL TESTS HAVE BEEN ADDED!!
        const currentAccountSchemaVersion = 2;
        const currentTokenSchemaVersion = 2;

        const testName = "schemaVersion";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );
        await screenshot.takeScreenshot(page, "Page loaded");

        await switchToVersion("local", page, screenshot);

        await signIn(page, screenshot, username, accountPwd);

        // Check the cache
        const storage = await BrowserCache.getWindowStorage();
        const accountKeys = storage[`msal.${currentAccountSchemaVersion}.account.keys`];
        expect(accountKeys).toBeTruthy();
        expect(JSON.parse(accountKeys!)).toHaveLength(1);
        const tokenKeys = storage[`msal.${currentTokenSchemaVersion}.token.keys.0845a021-afdf-4126-abdd-099c5e6948e1`];
        expect(tokenKeys).toBeTruthy();
        expect(JSON.parse(tokenKeys!).idToken).toHaveLength(1);
        expect(JSON.parse(tokenKeys!).accessToken).toHaveLength(1);
        expect(JSON.parse(tokenKeys!).refreshToken).toHaveLength(1);
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
        });
    });
    
    /**
     * Since older versions can't read new cache these tests should verify that the old cache is still there when downgrading back to an older version
     * The general flow should be: 
     * 1. Sign-in using the old version to populate the cache 
     * 2. Upgrade to the local version, sign-in if needed (major version changes only)
     * 3. Downgrade back to the old version
     * 4. Verify tokens can be pulled from the cache
     */
    describe("Downgrade tests", () => {
        test("acquireTokenSilent can return tokens from the cache after downgrading back to the previous version", async () => {
            const testName = "downgradeLocalToLatest";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await screenshot.takeScreenshot(page, "Page loaded");

            await switchToVersion("latest", page, screenshot);
            await signIn(page, screenshot, username, accountPwd);

            await switchToVersion("local", page, screenshot);
            await verifyCacheWasUsed(page, screenshot);

            await switchToVersion("latest", page, screenshot);
            await verifyCacheWasUsed(page, screenshot);
        });

        test("acquireTokenSilent can return tokens from the cache after downgrading back to v4", async () => {
            const testName = "downgradeLocalToLatest";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await screenshot.takeScreenshot(page, "Page loaded");

            await switchToVersion("latest-v4", page, screenshot);
            await signIn(page, screenshot, username, accountPwd);

            await switchToVersion("local", page, screenshot);
            await verifyCacheWasUsed(page, screenshot);

            await switchToVersion("latest-v4", page, screenshot);
            await verifyCacheWasUsed(page, screenshot);
        });

        test("acquireTokenSilent can return tokens from the cache after downgrading back to 4.25.0 (cache schema v1)", async () => {
            const testName = "downgradeLatestTo4-25-0";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await screenshot.takeScreenshot(page, "Page loaded");

            await switchToVersion("4.25.0", page, screenshot);
            await signIn(page, screenshot, username, accountPwd);

            await switchToVersion("local", page, screenshot);
            await verifyCacheWasUsed(page, screenshot);

            await switchToVersion("4.25.0", page, screenshot);
            await verifyCacheWasUsed(page, screenshot);
        });

        test("acquireTokenSilent can return tokens from the cache after downgrading back to 4.18.0 (cache schema v0)", async () => {
            const testName = "downgradeLatestTo4-18-0";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await screenshot.takeScreenshot(page, "Page loaded");

            await switchToVersion("4.18.0", page, screenshot);
            await signIn(page, screenshot, username, accountPwd);

            await switchToVersion("local", page, screenshot);
            await verifyCacheWasUsed(page, screenshot);

            await switchToVersion("4.18.0", page, screenshot);
            await verifyCacheWasUsed(page, screenshot);
        });

        test("acquireTokenSilent can return tokens from the cache after downgrading back to v3", async () => {
            const testName = "downgradeLatestToV3";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await screenshot.takeScreenshot(page, "Page loaded");

            await switchToVersion("latest-v3", page, screenshot);
            await signIn(page, screenshot, username, accountPwd);

            await switchToVersion("local", page, screenshot);
            await verifyCacheWasUsed(page, screenshot);

            await switchToVersion("latest-v3", page, screenshot);
            await verifyCacheWasUsed(page, screenshot);
        });
    });
});
