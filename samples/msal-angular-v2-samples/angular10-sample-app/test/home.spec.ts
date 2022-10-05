import * as puppeteer from "puppeteer";
import { Screenshot, setupCredentials, enterCredentials } from "../../../e2eTestUtils/TestUtils";
import { LabClient } from "../../../e2eTestUtils/LabClient";
import { LabApiQueryParams } from "../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes } from "../../../e2eTestUtils/Constants";
import { BrowserCacheUtils } from "../../../e2eTestUtils/BrowserCacheTestUtils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/home-tests`;

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

describe('/ (Home Page)', () => {
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

    it("Home page - children are rendered after logging in with loginRedirect", async () => {
        const testName = "redirectBaseCase";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
        await screenshot.takeScreenshot(page, "Page loaded");

        // Initiate Login
        const signInButton = await page.waitForSelector("xpath=//button[contains(., 'Login')]");
        await signInButton.click();
        await screenshot.takeScreenshot(page, "Login button clicked");
        const loginRedirectButton = await page.waitForSelector("xpath=//div//button[contains(., 'Login using Redirect')]");
        await loginRedirectButton.click();

        await enterCredentials(page, screenshot, username, accountPwd);

        // Verify UI now displays logged in content
        page.waitForXPath("//p[contains(., 'Login successful!')]");
        const logoutButton = await page.waitForSelector("xpath=//button[contains(., 'Logout')]");
        await logoutButton.click();
        const logoutButtons = await page.$x("//div//button[contains(., 'Logout using')]");
        expect(logoutButtons.length).toBe(2);
        await logoutButton.click();
        await screenshot.takeScreenshot(page, "App signed in");

        // Verify tokens are in cache
        await verifyTokenStore(BrowserCache, ["User.Read"]);

        // Navigate to profile page
        const profileButton = await page.waitForSelector("xpath=//span[contains(., 'Profile')]");
        await profileButton.click();
        await screenshot.takeScreenshot(page, "Profile page loaded");

        // Verify displays profile page without activating MsalGuard
        await page.waitForXPath("//strong[contains(., 'First Name: ')]");
    });

    it("Home page - children are rendered after logging in with loginPopup", async () => {
        const testName = "popupBaseCase";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
        await screenshot.takeScreenshot(page, "Page loaded");

        // Initiate Login
        const signInButton = await page.waitForSelector("xpath=//button[contains(., 'Login')]");
        await signInButton.click();
        await screenshot.takeScreenshot(page, "Login button clicked");
        const loginPopupButton = await page.waitForSelector("xpath=//button[contains(., 'Login using Popup')]");
        const newPopupWindowPromise = new Promise<puppeteer.Page>(resolve => page.once("popup", resolve));
        await loginPopupButton.click();
        const popupPage = await newPopupWindowPromise;
        const popupWindowClosed = new Promise<void>(resolve => popupPage.once("close", resolve));

        await enterCredentials(popupPage, screenshot, username, accountPwd);
        await popupWindowClosed;

        await page.waitForXPath("//p[contains(., 'Login successful!')]", {timeout: 3000});
        await screenshot.takeScreenshot(page, "Popup closed");

        // Verify UI now displays logged in content
        await page.waitForXPath("//p[contains(., 'Login successful!')]");
        const logoutButton = await page.waitForSelector("xpath=//button[contains(., 'Logout')]");
        await logoutButton.click();
        const logoutButtons = await page.$x("//button[contains(., 'Logout using')]");
        expect(logoutButtons.length).toBe(2);
        await logoutButton.click();
        await screenshot.takeScreenshot(page, "App signed in");

        // Verify tokens are in cache
        await verifyTokenStore(BrowserCache, ["User.Read"]);

        // Navigate to profile page
        const profileButton = await page.waitForSelector("xpath=//span[contains(., 'Profile')]");
        await profileButton.click();
        await screenshot.takeScreenshot(page, "Profile page loaded");

        // Verify displays profile page without activating MsalGuard
        await page.waitForXPath("//strong[contains(., 'First Name: ')]");
    });
  }
);
