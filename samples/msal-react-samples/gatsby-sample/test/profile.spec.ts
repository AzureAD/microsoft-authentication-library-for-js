import puppeteer from "puppeteer";
import { Screenshot, setupCredentials, enterCredentials } from "../../../e2eTestUtils/TestUtils";
import { LabClient } from "../../../e2eTestUtils/LabClient";
import { LabApiQueryParams } from "../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes } from "../../../e2eTestUtils/Constants";
import { BrowserCacheUtils } from "../../../e2eTestUtils/BrowserCacheTestUtils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/profile-tests`;

async function verifyTokenStore(BrowserCache: BrowserCacheUtils, scopes: string[]): Promise<void> {
    const tokenStore = await BrowserCache.getTokens();
    expect(tokenStore.idTokens.length).toBe(1);
    expect(tokenStore.accessTokens.length).toBe(1);
    expect(tokenStore.refreshTokens.length).toBe(1);
    expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).not.toBeNull();
    expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, scopes)).toBeTruthy;
    const storage = await BrowserCache.getWindowStorage();
    expect(Object.keys(storage).length).toBe(5);
    const telemetryCacheEntry = await BrowserCache.getTelemetryCacheEntry("3fba556e-5d4a-48e3-8e1a-fd57c12cb82e");
    expect(telemetryCacheEntry).not.toBeNull;
    expect(telemetryCacheEntry["cacheHits"]).toBe(1);
}

describe('/profile', () => {
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
        BrowserCache = new BrowserCacheUtils(page, "sessionStorage");
        await page.goto(`http://localhost:${port}`);
    });

    afterEach(async () => {
        await page.close();
        await context.close();
    });

    it("MsalAuthenticationTemplate - invokes loginRedirect if user is not signed in", async () => {
        const testName = "MsalAuthenticationTemplateBaseCase";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
        await page.waitForXPath("//a[contains(., 'MS Identity Platform')]");
        await screenshot.takeScreenshot(page, "Home page loaded");

        // Navigate to /profile and expect redirect to occur to AAD without interaction
        await page.goto(`http://localhost:${port}/profile`);
        await screenshot.takeScreenshot(page, "Profile page loaded");

        await enterCredentials(page, screenshot, username, accountPwd);
        await screenshot.takeScreenshot(page, "Returned to app");

        // Wait for Graph data to display
        await page.waitForXPath("//div/ul/li[contains(., 'Name')]");
        await screenshot.takeScreenshot(page, "Graph data acquired");

        // Verify UI now displays logged in content
        await page.waitForXPath("//header[contains(.,'Welcome,')]");
        const profileButton = await page.waitForXPath("//header//button");
        await profileButton.click();
        const logoutButtons = await page.$x("//li[contains(., 'Logout with')]");
        expect(logoutButtons.length).toBe(2);
        await screenshot.takeScreenshot(page, "App signed in");

        // Verify tokens are in cache
        await verifyTokenStore(BrowserCache, ["User.Read"]);
    });

    it("MsalAuthenticationTemplate - renders children without invoking login if user is already signed in", async () => {
        const testName = "MsalAuthenticationTemplateSignedInCase";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
        await page.waitForXPath("//a[contains(., 'MS Identity Platform')]");
        await screenshot.takeScreenshot(page, "Page loaded");

        // Initiate Login
        const [signInButton] = await page.$x("//button[contains(., 'Login')]");
        await signInButton.click();
        await screenshot.takeScreenshot(page, "Login button clicked");
        const [loginPopupButton] = await page.$x("//li[contains(., 'Sign in using Popup')]");
        const newPopupWindowPromise = new Promise<puppeteer.Page>(resolve => page.once("popup", resolve));
        await loginPopupButton.click();
        const popupPage = await newPopupWindowPromise;
        const popupWindowClosed = new Promise<void>(resolve => popupPage.once("close", resolve));

        await enterCredentials(popupPage, screenshot, username, accountPwd);
        await popupWindowClosed;
        await page.waitForXPath("//header[contains(., 'Welcome,')]");
        await screenshot.takeScreenshot(page, "Popup closed");

        // Verify UI now displays logged in content
        await page.waitForXPath("//header[contains(.,'Welcome,')]");
        const profileButton = await page.waitForXPath("//header//button");
        await profileButton.click();
        const logoutButtons = await page.$x("//li[contains(., 'Logout with')]");
        expect(logoutButtons.length).toBe(2);
        await screenshot.takeScreenshot(page, "App signed in");

        // Go to protected page
        await page.goto(`http://localhost:${port}/profile`);
        // Wait for Graph data to display
        await page.waitForXPath("//div/ul/li[contains(., 'Name')]");
        await screenshot.takeScreenshot(page, "Graph data acquired");
        // Verify tokens are in cache
        await verifyTokenStore(BrowserCache, ["User.Read"]);
    });
  }
);