/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as path from "path";
import { spawn, ChildProcess } from "child_process";
import * as puppeteer from "puppeteer";
import {
    BrowserCacheUtils,
    Screenshot,
    verifyKmsiFromCache,
} from "e2e-test-utils";
import {
    createPlatformBrokerProfile,
    launchPlatformBrokerBrowser,
    PLATFORM_LOGIN_TIMEOUT,
    PlatformBrokerProfile,
    removePlatformBrokerProfile,
    verifyPlatformBrokerResponse,
    verifyPlatformBrokerTokenStore,
} from "./platformBrokerTestUtils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const serverUtils = require("../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/platformBrokerKmsi`;
const EXPRESS_SAMPLE_ROOT = path.join(__dirname, "..");
const SERVER_PORT = 3443;
const SERVER_START_CMD = "npm run start:ear:e2e";
const PLATFORM_BROKER_URL = `https://localhost:${SERVER_PORT}/?platformBroker=true`;
const CACHE_LOCATION = "sessionStorage";

describe("Platform Broker + Keep Me Signed In Tests", () => {
    let browser: puppeteer.Browser | undefined;
    let profile: PlatformBrokerProfile | undefined;
    let serverProcess: ChildProcess | undefined;

    beforeAll(async () => {
        profile = createPlatformBrokerProfile();
        serverProcess = spawn(SERVER_START_CMD, {
            shell: true,
            cwd: EXPRESS_SAMPLE_ROOT,
            stdio: ["ignore", "inherit", "inherit"],
        });

        const serverUp = await serverUtils.isServerUp(SERVER_PORT, 60000);
        if (!serverUp) {
            throw new Error(
                `ExpressSample HTTPS server did not start on port ${SERVER_PORT}`
            );
        }
    });

    afterAll(async () => {
        if (browser) {
            await browser.close().catch(() => {});
        }
        await serverUtils.killServer(SERVER_PORT);
        await new Promise<void>((resolve) => {
            if (!serverProcess || serverProcess.exitCode !== null) {
                resolve();
                return;
            }
            serverProcess.once("exit", () => resolve());
            serverProcess.kill();
            setTimeout(() => resolve(), 5000);
        });
        removePlatformBrokerProfile(profile);
    });

    it("persists a KMSI platform-broker sign-in across browser sessions", async () => {
        if (!profile) {
            throw new Error("Platform-broker browser profile was not created");
        }

        const screenshot = new Screenshot(SCREENSHOT_BASE_FOLDER_NAME);

        browser = await launchPlatformBrokerBrowser(profile);
        let page = await browser.newPage();
        let browserCache = new BrowserCacheUtils(page, CACHE_LOCATION);

        await page.goto(PLATFORM_BROKER_URL, { timeout: 10000 });
        await page.locator("button#signInButton").click();
        await page.locator("a#signInRedirect").click();
        await page.waitForSelector("a#viewProfileButton", {
            visible: true,
            timeout: PLATFORM_LOGIN_TIMEOUT,
        });
        await screenshot.takeScreenshot(page, "Initial broker sign-in");

        await verifyPlatformBrokerResponse(page);
        await verifyPlatformBrokerTokenStore(browserCache);
        await verifyKmsiFromCache(browserCache);

        await browser.close();
        browser = undefined;

        browser = await launchPlatformBrokerBrowser(profile);
        page = await browser.newPage();
        browserCache = new BrowserCacheUtils(page, CACHE_LOCATION);

        await page.goto(PLATFORM_BROKER_URL, { timeout: 10000 });
        let popupOpened = false;
        page.once("popup", () => {
            popupOpened = true;
        });
        await page.locator("button#ssoSilentButton").click();
        await page.waitForSelector(
            'div#silentStatus[data-status="ssoSilent:success"]',
            { timeout: PLATFORM_LOGIN_TIMEOUT }
        );
        await page.waitForSelector("a#viewProfileButton", {
            visible: true,
            timeout: PLATFORM_LOGIN_TIMEOUT,
        });
        await screenshot.takeScreenshot(page, "Silent broker sign-in restored");

        expect(popupOpened).toBe(false);
        await verifyPlatformBrokerResponse(page);
        await verifyPlatformBrokerTokenStore(browserCache);
        await verifyKmsiFromCache(browserCache);
    }, 300000);
});
