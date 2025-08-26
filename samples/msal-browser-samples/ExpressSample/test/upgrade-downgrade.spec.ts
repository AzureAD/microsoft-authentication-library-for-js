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
        page.setDefaultTimeout(500);
        BrowserCache = new BrowserCacheUtils(page, "localStorage");
        await page.goto(`http://localhost:${port}`, { timeout: 2000 });
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
        const currentAccountSchemaVersion = 1;
        const currentTokenSchemaVersion = 1;

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
        const tokenKeys = storage[`msal.${currentTokenSchemaVersion}.token.keys.b5c2e510-4a17-4feb-b219-e55aa5b74144`];
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

        test("acquireTokenSilent can return tokens from the cache after upgrading from 4.18.0 (cache schema v0)", async () => {
            const testName = "upgradeV4-18-0";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await screenshot.takeScreenshot(page, "Page loaded");

            await switchToVersion("4.18.0", page, screenshot)
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

            // Login Local Version
            await switchToVersion("local", page, screenshot);
            await signIn(page, screenshot, username, accountPwd);
            await switchToVersion("latest-v3", page, screenshot);

            await page.locator("button#signInButton").click();
            await screenshot.takeScreenshot(page, "Sign in button clicked");
            await page.locator("a#signInRedirect").click();
            await screenshot.takeScreenshot(page, "Sign in redirect clicked");
            // We should get SSO here so credentials don't need to be re-entered
            await page.locator("a#viewProfileButton").setTimeout(5000).waitHandle();
            await screenshot.takeScreenshot(page, "Logged In");

            // Change back to local build
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
        test("acquireTokenSilent can return tokens from the cache after downgrading back to the previous version", () => {

        });

        test("acquireTokenSilent can return tokens from the cache after downgrading back to 4.18.0 (cache schema v0)", () => {

        });

        test("acquireTokenSilent can return tokens from the cache after downgrading back to v3", () => {

        });
    });
});
