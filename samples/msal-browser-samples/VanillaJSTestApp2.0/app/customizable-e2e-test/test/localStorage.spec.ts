import "mocha";
import puppeteer from "puppeteer";
import { expect } from "chai";
import { Screenshot, createFolder, setupCredentials, enterCredentials } from "../../../../../e2eTestUtils/TestUtils";
import { BrowserCacheUtils } from "../../../../../e2eTestUtils/BrowserCacheTestUtils";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes } from "../../../../../e2eTestUtils/Constants";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";
import { msalConfig as aadMsalConfig, request as aadTokenRequest } from "../authConfigs/localStorageAuthConfig.json";
import { clickLoginPopup, clickLoginRedirect, waitForReturnToApp } from "./testUtils";
import fs from "fs";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/localStorageTests`;
const SAMPLE_HOME_URL = "http://localhost:30662/";

async function verifyTokenStore(BrowserCache: BrowserCacheUtils, scopes: string[]): Promise<void> {
    const tokenStore = await BrowserCache.getTokens();
    expect(tokenStore.idTokens).to.be.length(1);
    expect(tokenStore.accessTokens).to.be.length(1);
    expect(tokenStore.refreshTokens).to.be.length(1);
    expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).to.not.be.null;
    expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, scopes)).to.be.true;
    const storage = await BrowserCache.getWindowStorage();
    expect(Object.keys(storage).length).to.be.eq(4);
}

describe("LocalStorage Tests", function () {
    this.timeout(0);
    this.retries(1);

    let username = "";
    let accountPwd = "";

    let browser: puppeteer.Browser;
    before(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        browser = await puppeteer.launch({
            headless: true,
            ignoreDefaultArgs: ["--no-sandbox", "–disable-setuid-sandbox"]
        });

        const labApiParams: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.PPE,
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

    after(async () => {
        await context.close();
        await browser.close();
    });

    describe("login Tests", () => {
        beforeEach(async () => {
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            BrowserCache = new BrowserCacheUtils(page, aadMsalConfig.cache.cacheLocation);
            await page.goto(SAMPLE_HOME_URL);
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
            await page.goto(SAMPLE_HOME_URL);
            await page.waitForTimeout(500);

            // Temporary Cache always uses sessionStorage
            const sessionBrowserStorage = new BrowserCacheUtils(page, "sessionStorage");
            const sessionStorage = await sessionBrowserStorage.getWindowStorage();
            const localStorage = await BrowserCache.getWindowStorage();
            expect(Object.keys(localStorage).length).to.be.eq(0);
            expect(Object.keys(sessionStorage).length).to.be.eq(0);
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
            await page.waitForTimeout(200);
            // Temporary Cache always uses sessionStorage
            const sessionBrowserStorage = new BrowserCacheUtils(page, "sessionStorage");
            const sessionStorage = await sessionBrowserStorage.getWindowStorage();
            const localStorage = await BrowserCache.getWindowStorage();
            expect(Object.keys(localStorage).length).to.be.eq(1); // Telemetry
            expect(Object.keys(sessionStorage).length).to.be.eq(0);
        });
    });
});
