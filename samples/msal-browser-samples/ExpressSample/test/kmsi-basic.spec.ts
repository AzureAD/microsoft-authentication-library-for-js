/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as puppeteer from "puppeteer";
import {
    AppTypes,
    AzureEnvironments,
    BrowserCacheUtils,
    enterCredentials,
    LabApiQueryParams,
    LabClient,
    Screenshot,
    setupCredentials,
    verifyKmsiFromCache,
} from "e2e-test-utils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/kmsiBasic`;
const KMSI_URL = "http://localhost:3000/?kmsi=true";
const CACHE_LOCATION = "sessionStorage";
const LOGIN_TIMEOUT = 120000;

describe("Keep Me Signed In Tests", () => {
    let browser: puppeteer.Browser | undefined;
    let userDataDir: string | undefined;
    let username = "";
    let accountPwd = "";

    beforeAll(async () => {
        const labClient = new LabClient();
        const labApiParams: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD,
        };
        const envResponse = await labClient.getVarsByCloudEnvironment(
            labApiParams
        );
        [username, accountPwd] = await setupCredentials(
            envResponse[0],
            labClient
        );
    });

    afterEach(async () => {
        if (browser) {
            await browser.close().catch(() => {});
            browser = undefined;
        }
        if (userDataDir) {
            fs.rmSync(userDataDir, { recursive: true, force: true });
            userDataDir = undefined;
        }
    });

    async function launchBrowser(): Promise<puppeteer.Browser> {
        if (!userDataDir) {
            throw new Error("KMSI browser profile was not created");
        }
        return puppeteer.launch({
            headless: process.env.HEADLESS !== "false",
            timeout: 60000,
            userDataDir,
        });
    }

    it("persists a web KMSI sign-in across browser sessions", async () => {
        const screenshot = new Screenshot(SCREENSHOT_BASE_FOLDER_NAME);
        userDataDir = fs.mkdtempSync(
            path.join(os.tmpdir(), "kmsi-browser-profile-")
        );

        browser = await launchBrowser();
        let page = await browser.newPage();
        let browserCache = new BrowserCacheUtils(page, CACHE_LOCATION);

        await page.goto(KMSI_URL, { timeout: 10000 });
        await page.locator("button#signInButton").click();
        await page.locator("a#signInRedirect").click();
        await enterCredentials(page, screenshot, username, accountPwd);
        await page.waitForSelector("a#viewProfileButton", {
            visible: true,
            timeout: LOGIN_TIMEOUT,
        });
        await verifyKmsiFromCache(browserCache);

        await browser.close();
        browser = undefined;

        browser = await launchBrowser();
        page = await browser.newPage();
        browserCache = new BrowserCacheUtils(page, CACHE_LOCATION);

        await page.goto(KMSI_URL, { timeout: 10000 });
        await page.waitForSelector("button#ssoSilentButton");
        await page.evaluate(() => {
            document.getElementById("ssoSilentButton")?.click();
        });
        await page.waitForFunction(
            () => {
                const status =
                    document.getElementById("silentStatus")?.dataset.status;
                return (
                    status === "ssoSilent:success" ||
                    status === "ssoSilent:error"
                );
            },
            { timeout: LOGIN_TIMEOUT }
        );
        const silentStatus = await page.evaluate(
            () => document.getElementById("silentStatus")?.dataset.status
        );
        expect(silentStatus).toBe("ssoSilent:success");
        await page.waitForSelector("a#viewProfileButton", {
            visible: true,
            timeout: LOGIN_TIMEOUT,
        });
        await verifyKmsiFromCache(browserCache);
    }, 180000);
});
