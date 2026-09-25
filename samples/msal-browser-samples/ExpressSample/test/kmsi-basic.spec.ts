/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ChildProcess, spawn } from "child_process";
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
    verifyKmsiFromResponse,
} from "e2e-test-utils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const serverUtils = require("../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/kmsiBasic`;
const WEB_KMSI_URL = "http://localhost:3000/";
const EAR_PORT = 3443;
const EAR_KMSI_URL = `https://localhost:${EAR_PORT}/?ear=true`;
const EAR_START_CMD = "npm run start:ear-kmsi:e2e";
const EXPRESS_SAMPLE_ROOT = path.join(__dirname, "..");
const CACHE_LOCATION = "localStorage";
const LOGIN_TIMEOUT = 120000;

describe("Keep Me Signed In Tests", () => {
    let browser: puppeteer.Browser | undefined;
    let userDataDir: string | undefined;
    let username = "";
    let accountPwd = "";
    let earServerProcess: ChildProcess;

    beforeAll(async () => {
        earServerProcess = spawn(EAR_START_CMD, {
            shell: true,
            cwd: EXPRESS_SAMPLE_ROOT,
            stdio: ["ignore", "inherit", "inherit"],
        });
        const serverUp = await serverUtils.isServerUp(EAR_PORT, 60000);
        if (!serverUp) {
            throw new Error(
                `EAR https server did not come up on port ${EAR_PORT}`
            );
        }

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

    afterAll(async () => {
        await serverUtils.killServer(EAR_PORT);
        await new Promise<void>((resolve) => {
            if (!earServerProcess || earServerProcess.exitCode !== null) {
                resolve();
                return;
            }
            const done = () => resolve();
            earServerProcess.once("exit", done);
            earServerProcess.kill();
            setTimeout(done, 5000);
        });
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

    async function launchBrowser(
        acceptInsecureCerts: boolean = false
    ): Promise<puppeteer.Browser> {
        if (!userDataDir) {
            throw new Error("KMSI browser profile was not created");
        }
        return puppeteer.launch({
            headless: process.env.HEADLESS !== "false",
            acceptInsecureCerts,
            timeout: 60000,
            userDataDir,
        });
    }

    async function verifyKmsiPersistence(
        kmsiUrl: string,
        screenshotFolder: string,
        isEar: boolean
    ): Promise<void> {
        const screenshot = new Screenshot(screenshotFolder);
        userDataDir = fs.mkdtempSync(
            path.join(os.tmpdir(), "kmsi-browser-profile-")
        );

        browser = await launchBrowser(isEar);
        let page = await browser.newPage();
        let browserCache = new BrowserCacheUtils(page, CACHE_LOCATION);
        let authorizeWasPost = false;
        if (isEar) {
            page.on("request", (request) => {
                if (
                    request.url().includes("/authorize") &&
                    request.method() === "POST"
                ) {
                    authorizeWasPost = true;
                }
            });
        }

        await page.goto(kmsiUrl, { timeout: 10000 });
        await page.locator("button#signInButton").click();
        await page.locator("a#signInRedirect").click();
        await enterCredentials(page, screenshot, username, accountPwd);
        await page.waitForSelector("a#viewProfileButton", {
            visible: true,
            timeout: LOGIN_TIMEOUT,
        });
        if (isEar) {
            expect(authorizeWasPost).toBe(true);
        }
        await verifyKmsiFromResponse(page);
        await verifyKmsiFromCache(browserCache);

        await browser.close();
        browser = undefined;

        browser = await launchBrowser(isEar);
        page = await browser.newPage();
        browserCache = new BrowserCacheUtils(page, CACHE_LOCATION);

        await page.goto(kmsiUrl, { timeout: 10000 });
        await page.waitForSelector("a#viewProfileButton", {
            visible: true,
            timeout: LOGIN_TIMEOUT,
        });
        expect(await browserCache.getAccountFromCache()).not.toBeNull();
        await verifyKmsiFromCache(browserCache);
    }

    it("persists a web KMSI sign-in across browser sessions", async () => {
        await verifyKmsiPersistence(
            WEB_KMSI_URL,
            `${SCREENSHOT_BASE_FOLDER_NAME}/web`,
            false
        );
    }, 180000);

    it("persists an EAR KMSI sign-in across browser sessions", async () => {
        await verifyKmsiPersistence(
            EAR_KMSI_URL,
            `${SCREENSHOT_BASE_FOLDER_NAME}/ear`,
            true
        );
    }, 180000);
});
