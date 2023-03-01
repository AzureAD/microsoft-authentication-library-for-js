import {
    expect,
    test,
    Page,
    ElectronApplication,
    _electron as electron,
    chromium,
    Browser,
} from "@playwright/test";

import { NodeCacheTestUtils } from "../../../e2eTestUtils/NodeCacheTestUtils";
import { LabApiQueryParams } from "../../../e2eTestUtils/LabApiQueryParams";
import { AppTypes, AzureEnvironments } from "../../../e2eTestUtils/Constants";
import { LabClient } from "../../../e2eTestUtils/LabClient";
import { setupCredentials } from "../../../e2eTestUtils/TestUtils";

import {
    Screenshot,
    enterCredentials,
    retrieveAuthCodeUrlFromBrowserContext,
} from "../../../e2eTestUtils/ElectronPlaywrightTestUtils";

import {
    SCREENSHOT_BASE_FOLDER_NAME,
    validateCacheLocation,
} from "../../testUtils";

import * as path from "path";

let electronApp: ElectronApplication;
let page: Page;
let browser: Browser;
let browserPage: Page;
let username: string;
let accountPwd: string;

const screenshotFolder = `${SCREENSHOT_BASE_FOLDER_NAME}/ElectronSystemBrowserTestApp/AAD`;

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
        const screenshot = new Screenshot(
            `${screenshotFolder}/AcquireTokenAuthCode`
        );

        await page.waitForSelector("#SignIn");
        await screenshot.takeScreenshot(page, "samplePageInit");
        page.click("#SignIn");

        let AuthCodeUrl = await retrieveAuthCodeUrlFromBrowserContext(page);

        await browserPage.goto(AuthCodeUrl);
        await enterCredentials(browserPage, screenshot, username, accountPwd);
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
