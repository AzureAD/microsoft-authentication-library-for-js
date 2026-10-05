/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as path from "path";
import { ChildProcess, spawn } from "child_process";
import * as puppeteer from "puppeteer";
import {
    BrowserCacheUtils,
    Screenshot,
    verifyKmsiFromResponse,
} from "e2e-test-utils";
import { AuthenticationFlowTestUtils } from "./AuthenticationFlowTestUtils";
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

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/earPlatformBrokerKmsi`;
const EXPRESS_SAMPLE_ROOT = path.join(__dirname, "..");
const SERVER_PORT = 3443;
const SERVER_START_CMD = "npm run start:ear-kmsi:e2e";
const TEST_ORIGIN = `https://localhost:${SERVER_PORT}`;
const TEST_URL = `${TEST_ORIGIN}/?ear=true&platformBroker=true`;
const CACHE_LOCATION = "localStorage";
const EAR_CRYPTO_ALGORITHM = "AES-GCM";

describe("EAR + Platform Broker + Keep Me Signed In Tests", () => {
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

    it("restores an EAR KMSI platform-broker sign-in after a browser restart", async () => {
        if (!profile) {
            throw new Error("Platform-broker browser profile was not created");
        }

        const screenshot = new Screenshot(SCREENSHOT_BASE_FOLDER_NAME);

        browser = await launchPlatformBrokerBrowser(profile);
        let page = await browser.newPage();
        let browserCache = new BrowserCacheUtils(page, CACHE_LOCATION);
        let flowUtils = new AuthenticationFlowTestUtils(page);
        await flowUtils.installCryptoOperationSpy(
            TEST_ORIGIN,
            EAR_CRYPTO_ALGORITHM
        );

        await page.goto(TEST_URL, { timeout: 10000 });
        await page.locator("button#signInButton").click();
        await page.locator("a#signInRedirect").click();
        await page.waitForSelector("a#viewProfileButton", {
            visible: true,
            timeout: PLATFORM_LOGIN_TIMEOUT,
        });
        await screenshot.takeScreenshot(page, "Initial combined sign-in");

        expect(flowUtils.getRequestCount("/authorize", "POST")).toBeGreaterThan(
            0
        );
        expect(flowUtils.getFragmentParameterCount("ear_jwe")).toBeGreaterThan(
            0
        );
        expect(
            await flowUtils.getCryptoOperationCount(EAR_CRYPTO_ALGORITHM)
        ).toBeGreaterThan(0);
        const initialBrokerResponse = await verifyPlatformBrokerResponse(page);
        await verifyPlatformBrokerTokenStore(browserCache);
        await verifyKmsiFromResponse(page);
        const initialAccountKeys = await browserCache.getAccountFromCache();
        expect(initialAccountKeys).toHaveLength(1);
        console.info(
            "Combined-flow diagnostics: EAR response decrypted; platform broker provenance and KMSI verified"
        );

        await browser.close();
        browser = undefined;

        browser = await launchPlatformBrokerBrowser(profile);
        page = await browser.newPage();
        browserCache = new BrowserCacheUtils(page, CACHE_LOCATION);
        flowUtils = new AuthenticationFlowTestUtils(page);
        await flowUtils.installCryptoOperationSpy(
            TEST_ORIGIN,
            EAR_CRYPTO_ALGORITHM
        );

        await page.goto(TEST_URL, { timeout: 10000 });
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
        await screenshot.takeScreenshot(page, "Combined sign-in restored");

        expect(popupOpened).toBe(false);
        expect(flowUtils.getRequestCount("/authorize", "POST")).toBeGreaterThan(
            0
        );
        expect(flowUtils.getFragmentParameterCount("ear_jwe")).toBeGreaterThan(
            0
        );
        expect(
            await flowUtils.getCryptoOperationCount(EAR_CRYPTO_ALGORITHM)
        ).toBeGreaterThan(0);
        const restoredBrokerResponse = await verifyPlatformBrokerResponse(page);
        expect(restoredBrokerResponse.nativeAccountId).toBe(
            initialBrokerResponse.nativeAccountId
        );
        await verifyPlatformBrokerTokenStore(browserCache);
        await verifyKmsiFromResponse(page);
        expect(await browserCache.getAccountFromCache()).toEqual(
            initialAccountKeys
        );
        console.info(
            "Combined-flow diagnostics: browser restart restored the same broker account silently"
        );
    }, 300000);
});
