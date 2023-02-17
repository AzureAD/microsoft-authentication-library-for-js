import path from "path";
import puppeteer from "puppeteer";
import {Screenshot, setupCredentials, enterCredentials, RETRY_TIMES, retrieveAppConfiguration} from "../../../e2eTestUtils/TestUtils";
import { LabClient } from "../../../e2eTestUtils/LabClient";
import { LabApiQueryParams } from "../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes, UserTypes, AppPlatforms } from "../../../e2eTestUtils/Constants";
import { BrowserCacheUtils } from "../../../e2eTestUtils/BrowserCacheTestUtils";
import { StringReplacer } from "../../../e2eTestUtils/ConfigUtils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/profileWithMsal-tests`;

const stringReplacer = new StringReplacer(path.join(__dirname, "../src/authConfig.js"));

async function verifyTokenStore(BrowserCache: BrowserCacheUtils, clientID: string, scopes: string[]): Promise<void> {
    const tokenStore = await BrowserCache.getTokens();
    expect(tokenStore.idTokens.length).toBe(1);
    expect(tokenStore.accessTokens.length).toBe(1);
    expect(tokenStore.refreshTokens.length).toBe(1);
    expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).not.toBeNull();
    expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, scopes)).toBeTruthy;
    const storage = await BrowserCache.getWindowStorage();
    expect(Object.keys(storage).length).toBe(7);
    const telemetryCacheEntry = await BrowserCache.getTelemetryCacheEntry(clientID);
    expect(telemetryCacheEntry).not.toBeNull;
    expect(telemetryCacheEntry["cacheHits"]).toBe(1);
}

describe('/profileWithMsal', () => {
    jest.retryTimes(RETRY_TIMES);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let port: number;
    let clientID: string;
    let authority: string;
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
            userType: UserTypes.CLOUD,
            appPlatform: AppPlatforms.SPA,
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParams);

        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);
        [clientID, , authority] = await retrieveAppConfiguration(envResponse[0], labClient, false);

        stringReplacer.replace({
            "ENTER_CLIENT_ID_HERE": clientID,
            "ENTER_TENANT_INFO_HERE": authority.split("/")[3],
        });
    });

    afterAll(async () => {
        stringReplacer.restore();
    });

    beforeEach(async () => {
        context = await browser.createIncognitoBrowserContext();
        page = await context.newPage();
        page.setDefaultTimeout(5000);
        BrowserCache = new BrowserCacheUtils(page, "localStorage");
        await page.goto(`http://localhost:${port}`);
    });

    afterEach(async () => {
        await page.close();
        await context.close();
    });

    it("MsalAuthenticationTemplate - invokes loginRedirect if user is not signed in (class component w/ withMsal HOC)", async () => {
        const testName = "MsalAuthenticationTemplateRedirectCase";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
        await screenshot.takeScreenshot(page, "Home page loaded");

        // Navigate to /profileWithMsal and expect redirect to be initiated without interaction
        await page.goto(`http://localhost:${port}/profileWithMsal`);
        await screenshot.takeScreenshot(page, "Profile page loaded");

        await enterCredentials(page, screenshot, username, accountPwd);

        // Wait for Graph data to display
        await page.waitForXPath("//div/ul/li[contains(., 'Name')]", {timeout: 5000});
        await screenshot.takeScreenshot(page, "Graph data acquired");

        // Verify tokens are in cache
        await verifyTokenStore(BrowserCache, clientID, ["User.Read"]);
    });
  }
);
