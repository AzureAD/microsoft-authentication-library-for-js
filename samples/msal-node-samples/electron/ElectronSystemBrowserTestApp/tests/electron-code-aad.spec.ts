import {
    expect,
    test,
    Page,
    ElectronApplication,
    _electron as electron,
    chromium,
    Browser,
} from "@playwright/test";

import {
    ScreenShotElectron,
    enterCredentialsElectron,
    retrieveAuthCodeUrlFromBrowserContext,
    NodeCacheTestUtils,
    LabApiQueryParams,
    AppTypes,
    AzureEnvironments,
    LabClient,
    setupCredentials,
    SCREENSHOT_BASE_FOLDER_NAME,
    validateCacheLocation,
} from "e2e-test-utils";
import * as path from "path";

let electronApp: ElectronApplication;
let page: Page;
let browser: Browser;
let browserPage: Page;
let username: string;
let accountPwd: string;

const screenshotFolder = path.join(__dirname, "screenshots/ElectronSystemBrowserTestApp");

const TEST_CACHE_LOCATION = `${__dirname}/../data/aad.cache.json`;

import config from "../src/config/AAD.json";

test.beforeAll(async () => {
    await validateCacheLocation(TEST_CACHE_LOCATION);

    const labApiParams: LabApiQueryParams = {
        azureEnvironment: AzureEnvironments.CLOUD,
        appType: AppTypes.CLOUD,
    };

    const labClient = new LabClient();
    const envResponse = await labClient.getVarsByCloudEnvironment(labApiParams);
    [username, accountPwd] = await setupCredentials(envResponse[0], labClient);

    electronApp = await electron.launch({
        args: [
            path.join(__dirname, "../.webpack/main"),
            "--enable-logging",
            "--skip-welcome",
            "--disable-telemetry",
            "--no-cached-data",
        ],
        env: {
            automation: "1",
            authConfig: JSON.stringify(config),
        },
    });

    browser = await chromium.launch();

    await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
});

test.afterAll(async () => {
    await electronApp.close();
});

test.describe("Acquire token", () => {
    test.beforeEach(async () => {
        page = await electronApp.firstWindow();
        browserPage = await browser.newPage();
    });

    test.afterEach(async () => {
        await page.close();
        await browserPage.close();
        await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
    });

    test("Acquire token by auth code", async () => {
        const screenshot = new ScreenShotElectron(
            `${screenshotFolder}/AcquireTokenAuthCode`
        );

        await page.waitForSelector("#SignIn");
        await screenshot.takeScreenshot(page, "samplePageInit");
        page.click("#SignIn");

        let AuthCodeUrl = await retrieveAuthCodeUrlFromBrowserContext(page);

        await browserPage.goto(AuthCodeUrl);
        await enterCredentialsElectron(
            browserPage,
            screenshot,
            username,
            accountPwd
        );
        const cachedTokens = await NodeCacheTestUtils.waitForTokens(
            TEST_CACHE_LOCATION,
            2000
        );
        expect(cachedTokens.accessTokens.length).toBe(1);
        expect(cachedTokens.idTokens.length).toBe(1);
        expect(cachedTokens.refreshTokens.length).toBe(1);

        await expect(page.locator(`text=${username}`).first()).toBeVisible();
    });
});
