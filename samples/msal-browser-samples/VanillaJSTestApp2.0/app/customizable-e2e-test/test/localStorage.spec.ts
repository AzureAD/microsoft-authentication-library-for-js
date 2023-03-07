import puppeteer from "puppeteer";
import { Screenshot, createFolder, setupCredentials, enterCredentials, storagePoller, ONE_SECOND_IN_MS } from "../../../../../e2eTestUtils/TestUtils";
import { BrowserCacheUtils } from "../../../../../e2eTestUtils/BrowserCacheTestUtils";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes } from "../../../../../e2eTestUtils/Constants";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";
import { msalConfig as aadMsalConfig, request as aadTokenRequest } from "../authConfigs/localStorageAuthConfig.json";
import { clickLoginPopup, clickLoginRedirect, waitForReturnToApp } from "./testUtils";
import fs from "fs";
import {getBrowser, getHomeUrl} from "../../testUtils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/localStorageTests`;

async function verifyTokenStore(BrowserCache: BrowserCacheUtils, scopes: string[]): Promise<void> {
    const tokenStore = await BrowserCache.getTokens();
    expect(tokenStore.idTokens).toHaveLength(1);
    expect(tokenStore.accessTokens).toHaveLength(1);
    expect(tokenStore.refreshTokens).toHaveLength(1);
    expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).toBeDefined();
    expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, scopes)).toBeTruthy();
    const storage = await BrowserCache.getWindowStorage();
    expect(Object.keys(storage).length).toEqual(4);
}

describe("LocalStorage Tests", function () {
    let username = "";
    let accountPwd = "";
    let sampleHomeUrl = "";

    let browser: puppeteer.Browser;
    beforeAll(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        browser = await getBrowser();
        sampleHomeUrl = getHomeUrl();

        const labApiParams: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParams);

        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);

        fs.writeFileSync("./app/customizable-e2e-test/testConfig.json", JSON.stringify({msalConfig: aadMsalConfig, request: aadTokenRequest}));
    });

    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;

    afterAll(async () => {
        await context.close();
        await browser.close();
    });

    describe("login Tests", () => {
        beforeEach(async () => {
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            page.setDefaultTimeout(ONE_SECOND_IN_MS*5);
            BrowserCache = new BrowserCacheUtils(page, aadMsalConfig.cache.cacheLocation);
            await page.goto(sampleHomeUrl);
        });

        afterEach(async () => {
            await page.evaluate(() =>  Object.assign({}, window.localStorage.clear()));
            await page.close();
        });

        it("Performs loginRedirect", async () => {
            const testName = "redirectBaseCase";
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

            await clickLoginRedirect(screenshot, page);
            await enterCredentials(page, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page);
            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await verifyTokenStore(BrowserCache, aadTokenRequest.scopes);
        });

        it("Going back to app during redirect clears cache", async () => {
            const testName = "redirectBrowserBackButton";
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
            await clickLoginRedirect(screenshot, page);
            await page.waitForNavigation({ waitUntil: "networkidle0"});
            // Navigate back to home page
            await page.goto(sampleHomeUrl);
            // Wait for processing
            await storagePoller(async () => {
                // Temporary Cache always uses sessionStorage
                const sessionBrowserStorage = new BrowserCacheUtils(page, "sessionStorage");
                const sessionStorage = await sessionBrowserStorage.getWindowStorage();
                const localStorage = await BrowserCache.getWindowStorage();
                expect(Object.keys(localStorage).length).toEqual(0);
                expect(Object.keys(sessionStorage).length).toEqual(0);
            }, ONE_SECOND_IN_MS);

        });

        it("Performs loginPopup", async () => {
            const testName = "popupBaseCase";
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

            const [popupPage, popupWindowClosed] = await clickLoginPopup(screenshot, page);
            await enterCredentials(popupPage, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page, popupPage, popupWindowClosed);

            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await verifyTokenStore(BrowserCache, aadTokenRequest.scopes);
        });

        it("Closing popup before login resolves clears cache", async () => {
            const testName = "popupCloseWindow";
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
            const [popupPage, popupWindowClosed] = await clickLoginPopup(screenshot, page);
            await popupPage.waitForNavigation({waitUntil: 'networkidle0'});
            await popupPage.close();
            // Wait until popup window closes
            await popupWindowClosed;
            // Wait for processing
            await storagePoller(async () => {
                // Temporary Cache always uses sessionStorage
                const sessionBrowserStorage = new BrowserCacheUtils(page, "sessionStorage");
                const sessionStorage = await sessionBrowserStorage.getWindowStorage();
                const localStorage = await BrowserCache.getWindowStorage();
                expect(Object.keys(localStorage).length).toEqual(1); // Telemetry
                expect(Object.keys(sessionStorage).length).toEqual(0);
            }, ONE_SECOND_IN_MS)
        });
    });
});
