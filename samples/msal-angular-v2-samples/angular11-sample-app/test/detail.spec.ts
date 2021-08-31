import * as puppeteer from "puppeteer";
import { Screenshot, setupCredentials, enterCredentials } from "../../../e2eTestUtils/TestUtils";
import { LabClient } from "../../../e2eTestUtils/LabClient";
import { LabApiQueryParams } from "../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes } from "../../../e2eTestUtils/Constants";
import { BrowserCacheUtils } from "../../../e2eTestUtils/BrowserCacheTestUtils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/detail-tests`;

async function verifyTokenStore(BrowserCache: BrowserCacheUtils, scopes: string[]): Promise<void> {
    const tokenStore = await BrowserCache.getTokens();
    expect(tokenStore.idTokens.length).toBe(1);
    expect(tokenStore.accessTokens.length).toBe(1);
    expect(tokenStore.refreshTokens.length).toBe(1);
    expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).not.toBeNull();
    expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, scopes)).toBeTruthy;
    const storage = await BrowserCache.getWindowStorage();
    expect(Object.keys(storage).length).toBe(6);
}

describe('/ (Detail Page)', () => {
    jest.retryTimes(1);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let port: number;
    let username: string;
    let accountPwd: string;
    let BrowserCache: BrowserCacheUtils;

    beforeAll(async () => {
        // @ts-ignore
        browser = await global.__BROWSER__;
        // @ts-ignore
        port = global.__PORT__;

        const labApiParams: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.PPE,
            appType: AppTypes.CLOUD
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParams);

        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);
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

    it("Detail page - children are rendered after clicking profile, logging in with redirect, and detail buttons clicked", async () => {
        const testName = "detailsBaseCase";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
        await screenshot.takeScreenshot(page, "Page loaded");

        // Initiate Login via MsalGuard by clicking Profile
        const profileButton = await page.waitForXPath("//span[contains(., 'Profile')]");
        await profileButton.click();

        await enterCredentials(page, screenshot, username, accountPwd);

        // Verify UI now displays logged in content
        await page.waitForXPath("//button[contains(., 'Logout')]");
        await screenshot.takeScreenshot(page, "Profile page signed in");

        // Verify tokens are in cache
        await verifyTokenStore(BrowserCache, ["User.Read"]);
        
        // Verify displays profile page
        await page.waitForXPath("//strong[contains(., 'First Name: ')]");

        // Navigate to details page 
        const detailsButton = await page.waitForXPath("//a[contains(., 'details')]");
        await detailsButton.click();
        await screenshot.takeScreenshot(page, "Details page");
        
        // Wait for Graph data to display
        await page.waitForXPath("//p[contains(., 'Details for: ')]", {timeout: 5000});
        await screenshot.takeScreenshot(page, "Graph data acquired");
    });
  }
);