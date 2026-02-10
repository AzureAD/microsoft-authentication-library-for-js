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
} from "e2e-test-utils";
import {
    LabResponseHelper,
    KeyVaultSecrets,
    LabUser,
    NodeCacheTestUtils,
    validateCacheLocation,
} from "lab-utils";
import * as path from "path";

let electronApp: ElectronApplication;
let page: Page;
let browser: Browser;
let browserPage: Page;
let labUser: LabUser;

const screenshotFolder = path.join(__dirname, "screenshots/ElectronSystemBrowserTestApp");

const TEST_CACHE_LOCATION = `${__dirname}/../data/aad.cache.json`;

import config from "../src/config/AAD.json";

test.beforeAll(async () => {
    await validateCacheLocation(TEST_CACHE_LOCATION);

    labUser = await LabResponseHelper.getLabUser(
        KeyVaultSecrets.UserPublicCloud
    );

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
            labUser.upn!,
            await labUser.getPassword()
        );
        const cachedTokens = await NodeCacheTestUtils.waitForTokens(
            TEST_CACHE_LOCATION,
            2000
        );
        expect(cachedTokens.accessTokens.length).toBe(1);
        expect(cachedTokens.idTokens.length).toBe(1);
        expect(cachedTokens.refreshTokens.length).toBe(1);

        await expect(page.locator(`text=${labUser.upn!}`).first()).toBeVisible();
    });
});
