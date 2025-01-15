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

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/profileRawContext-tests`;

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

describe("/profileRawContext", () => {
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

    it("MsalAuthenticationTemplate - invokes loginPopup if user is not signed in (class component w/ raw context)", async () => {
        const testName = "MsalAuthenticationTemplatePopupCase";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );
        await screenshot.takeScreenshot(page, "Home page loaded");

        // Navigate to /profile and expect popup to be opened without interaction
        const newPopupWindowPromise = new Promise<puppeteer.Page>((resolve) =>
            page.once("popup", resolve)
        );
        await page.goto(`http://localhost:${port}/profileRawContext`);
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

        // Verify tokens are in cache
        await verifyTokenStore(BrowserCache, ["User.Read"]);
    });
});
