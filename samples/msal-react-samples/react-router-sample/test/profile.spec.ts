import * as puppeteer from "puppeteer";
import {
    Screenshot,
    setupCredentials,
    enterCredentials,
    RETRY_TIMES,
    LabClient,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
    BrowserCacheUtils,
} from "e2e-test-utils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/profile-tests`;

async function verifyTokenStore(
    BrowserCache: BrowserCacheUtils,
    scopes: string[]
): Promise<void> {
    await BrowserCache.verifyTokenStore({
        scopes,
    });
    const telemetryCacheEntry = await BrowserCache.getTelemetryCacheEntry(
        "b5c2e510-4a17-4feb-b219-e55aa5b74144"
    );
    expect(telemetryCacheEntry).not.toBeNull;
    expect(telemetryCacheEntry["cacheHits"]).toBe(1);
}

describe("/profile", () => {
    jest.retryTimes(RETRY_TIMES);
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
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD,
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(
            labApiParams
        );

        [username, accountPwd] = await setupCredentials(
            envResponse[0],
            labClient
        );
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

    it("MsalAuthenticationTemplate - invokes loginPopup if user is not signed in", async () => {
        const testName = "MsalAuthenticationTemplateBaseCase";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );
        await screenshot.takeScreenshot(page, "Home page loaded");

        // Navigate to /profile and expect popup to be opened without interaction
        const newPopupWindowPromise = new Promise<puppeteer.Page>((resolve) =>
            page.once("popup", resolve)
        );
        await page.goto(`http://localhost:${port}/profile`);
        await screenshot.takeScreenshot(page, "Profile page loaded");
        const popupPage = await newPopupWindowPromise;
        const popupWindowClosed = new Promise<void>((resolve) =>
            popupPage.once("close", resolve)
        );

        await enterCredentials(popupPage, screenshot, username, accountPwd);
        await popupWindowClosed;

        // Wait for Graph data to display
        await page.waitForXPath("//div/ul/li[contains(., 'Name')]", {
            timeout: 5000,
        });
        await screenshot.takeScreenshot(page, "Graph data acquired");

        // Verify UI now displays logged in content
        await page.waitForXPath("//header[contains(., 'Welcome,')]");
        const profileButton = await page.waitForSelector(
            "xpath=//header//button"
        );
        await profileButton.click();
        const logoutButtons = await page.$x(
            "//li[contains(., 'Logout using')]"
        );
        expect(logoutButtons.length).toBe(2);
        await screenshot.takeScreenshot(page, "App signed in");

        // Verify tokens are in cache
        await verifyTokenStore(BrowserCache, ["User.Read"]);
    });

    it("MsalAuthenticationTemplate - renders children without invoking login if user is already signed in", async () => {
        const testName = "MsalAuthenticationTemplateSignedInCase";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );
        await screenshot.takeScreenshot(page, "Page loaded");

        // Initiate Login
        const signInButton = await page.waitForSelector(
            "xpath=//button[contains(., 'Login')]"
        );
        await signInButton.click();
        await screenshot.takeScreenshot(page, "Login button clicked");
        const loginPopupButton = await page.waitForSelector(
            "xpath=//li[contains(., 'Sign in using Popup')]"
        );
        const newPopupWindowPromise = new Promise<puppeteer.Page>((resolve) =>
            page.once("popup", resolve)
        );
        await loginPopupButton.click();
        const popupPage = await newPopupWindowPromise;
        const popupWindowClosed = new Promise<void>((resolve) =>
            popupPage.once("close", resolve)
        );

        await enterCredentials(popupPage, screenshot, username, accountPwd);
        await popupWindowClosed;
        await page.waitForXPath("//header[contains(., 'Welcome,')]", {
            timeout: 3000,
        });
        await screenshot.takeScreenshot(page, "Popup closed");

        // Verify UI now displays logged in content
        await page.waitForXPath("//header[contains(., 'Welcome,')]");
        const profileButton = await page.waitForSelector(
            "xpath=//header//button"
        );
        await profileButton.click();
        const logoutButtons = await page.$x(
            "//li[contains(., 'Logout using')]"
        );
        expect(logoutButtons.length).toBe(2);
        await screenshot.takeScreenshot(page, "App signed in");

        // Go to protected page
        await page.goto(`http://localhost:${port}/profile`);
        // Wait for Graph data to display
        await page.waitForXPath("//div/ul/li[contains(., 'Name')]", {
            timeout: 5000,
        });
        await screenshot.takeScreenshot(page, "Graph data acquired");
        // Verify tokens are in cache
        await verifyTokenStore(BrowserCache, ["User.Read"]);
    });

    it("MsalAuthenticationTemplate - renders loading component when popup is open, then error component when loginPopup is cancelled", async () => {
        const testName = "MsalAuthenticationTemplateError";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );
        await screenshot.takeScreenshot(page, "Home page loaded");

        // Navigate to /profile and expect popup to be opened without interaction
        const newPopupWindowPromise = new Promise<puppeteer.Page>((resolve) =>
            page.once("popup", resolve)
        );
        await page.goto(`http://localhost:${port}/profile`);
        await screenshot.takeScreenshot(page, "Profile page loaded");
        const popupPage = await newPopupWindowPromise;
        const popupWindowClosed = new Promise<void>((resolve) =>
            popupPage.once("close", resolve)
        );

        // Wait until the popup has navigated to login page
        await popupPage.waitForNavigation({ waitUntil: "networkidle0" });

        await page.waitForXPath(
            "//h6[contains(., 'Authentication in progress...')]"
        );
        await screenshot.takeScreenshot(page, "Loading component rendered");

        await popupPage.close();
        await popupWindowClosed;

        await page.waitForXPath(
            "//h6[contains(., 'An Error Occurred: user_cancelled')]"
        );
        await screenshot.takeScreenshot(page, "Error component rendered");
    });
});
