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
        "0845a021-afdf-4126-abdd-099c5e6948e1"
    );
    expect(telemetryCacheEntry).not.toBeNull();
    expect(telemetryCacheEntry["cacheHits"]).toBeGreaterThanOrEqual(1);
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
        context = await browser.createBrowserContext();
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
        const newPopupWindowPromise = new Promise<puppeteer.Page|null>((resolve) =>
            page.once("popup", resolve)
        );
        await page.goto(`http://localhost:${port}/profile`);
        await screenshot.takeScreenshot(page, "Profile page loaded");
        const popupPage = await newPopupWindowPromise;
        if (!popupPage) {
            throw new Error('Popup window was not opened');
          }

        await enterCredentials(popupPage, screenshot, username, accountPwd);

        // Wait for Graph data to display
        await page.waitForSelector("xpath/.//div/ul/li[contains(., 'Name')]", {
            timeout: 5000,
        });
        await screenshot.takeScreenshot(page, "Graph data acquired");

        // Verify UI now displays logged in content
        await page.waitForSelector("xpath/.//header[contains(., 'Welcome,')]");
        const profileButton = await page.waitForSelector(
            "xpath=//header//button"
        );
        await profileButton.click();
        const logoutButtons = await page.$$(
            "xpath/.//li[contains(., 'Logout using')]"
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
        const newPopupWindowPromise = new Promise<puppeteer.Page|null>((resolve) =>
            page.once("popup", resolve)
        );
        await loginPopupButton.click();
        const popupPage = await newPopupWindowPromise;
        if (!popupPage) {
            throw new Error('Popup window was not opened');
          }

        await enterCredentials(popupPage, screenshot, username, accountPwd);
        await page.waitForSelector("xpath/.//header[contains(., 'Welcome,')]", {
            timeout: 3000,
        });
        await screenshot.takeScreenshot(page, "Popup closed");

        // Verify UI now displays logged in content
        await page.waitForSelector("xpath/.//header[contains(., 'Welcome,')]");
        const profileButton = await page.waitForSelector(
            "xpath=//header//button"
        );
        await profileButton.click();
        const logoutButtons = await page.$$(
            "xpath/.//li[contains(., 'Logout using')]"
        );
        expect(logoutButtons.length).toBe(2);
        await screenshot.takeScreenshot(page, "App signed in");

        // Go to protected page
        await page.goto(`http://localhost:${port}/profile`);
        // Wait for Graph data to display
        await page.waitForSelector("xpath/.//div/ul/li[contains(., 'Name')]", {
            timeout: 5000,
        });
        await screenshot.takeScreenshot(page, "Graph data acquired");
        // Verify tokens are in cache
        await verifyTokenStore(BrowserCache, ["User.Read"]);
    });
});
