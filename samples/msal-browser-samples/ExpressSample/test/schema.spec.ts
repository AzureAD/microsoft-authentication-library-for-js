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
     * This test verifies that this test file is up to date with the latest changes to the cache schema. After incrementing the cache schema version in the library this test will fail.
     * When this test fails please add new test cases to cover upgrading to the new version and downgrading back to each of the previous versions, then update the schema version constants in the test below.
     */
    test("Verify Schema Version", async () => {
        // DO NOT UPDATE THESE CONSTANTS UNTIL TESTS HAVE BEEN ADDED!!
        const currentAccountSchemaVersion = 3;
        const currentTokenSchemaVersion = 3;

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
});
