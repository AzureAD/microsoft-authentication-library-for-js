import { Browser, Page, BrowserContext, Frame } from "puppeteer";
import {
    Screenshot,
    setupCredentials,
    enterCredentials,
    LabClient,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
    BrowserCacheUtils,
} from "e2e-test-utils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/nestedAppAuth`;
const puppeteerTimeout = 15000;
const jestTimeout = 120000;

// Host is the top frame (also enables the platform broker); nested app is an iframe.
const hostPort = 30668;
const nestedPort = 30667;

const getNestedFrame = async (page: Page): Promise<Frame> => {
    const frame = await page.waitForFrame(
        (candidate) => candidate.url().includes(nestedPort.toString()),
        { timeout: puppeteerTimeout }
    );
    await frame.waitForSelector(
        "xpath=//button[contains(., 'acquireTokenSilent')]",
        { timeout: puppeteerTimeout }
    );
    return frame;
};

const verifyHostTokenStore = async (
    browserCache: BrowserCacheUtils,
    scopes: string[]
): Promise<void> => {
    const tokenStore = await browserCache.getTokens();
    expect(tokenStore.idTokens).toHaveLength(1);
    expect(tokenStore.accessTokens).toHaveLength(1);
    expect(tokenStore.refreshTokens).toHaveLength(1);
    expect(await browserCache.getAccountFromCache()).not.toBeNull();
    expect(
        await browserCache.accessTokenForScopesExists(
            tokenStore.accessTokens,
            scopes
        )
    ).toBeTruthy();
};

const verifyNestedTokenStore = async (
    browserCache: BrowserCacheUtils,
    scopes: string[]
): Promise<void> => {
    const tokenStore = await browserCache.getTokens();
    expect(tokenStore.idTokens).toHaveLength(1);
    expect(tokenStore.accessTokens).toHaveLength(1);
    expect(tokenStore.refreshTokens).toHaveLength(0);
    expect(await browserCache.getAccountFromCache()).not.toBeNull();
    expect(
        await browserCache.accessTokenForScopesExists(
            tokenStore.accessTokens,
            scopes
        )
    ).toBeTruthy();
};

/**
 * Nested App Authentication (NAA) brokered through the platform broker.
 *
 * NOTE: this suite requires the platform-broker (JS-WAM) bridge to be present in
 * the browser environment and lab credentials, so it runs only in the e2e
 * pipeline, not in a plain local checkout.
 */
describe("Nested App Authentication brokered via platform broker", () => {
    jest.setTimeout(jestTimeout);

    let browser: Browser;
    let context: BrowserContext;
    let page: Page;

    let username: string;
    let accountPwd: string;
    let hostCache: BrowserCacheUtils;

    beforeAll(async () => {
        // @ts-ignore
        browser = await global.__BROWSER__;

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
        hostCache = new BrowserCacheUtils(page, "localStorage");
    });

    afterEach(async () => {
        await context.close();
    });

    it("nested app acquires a token through the host without holding a refresh token", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/nestedAcquireToken`
        );

        await page.goto(`http://localhost:${hostPort}`);

        // Sign the host in through the platform broker.
        const hostFrame = page.mainFrame();
        const loginButton = await hostFrame.waitForSelector(
            "xpath=//button[contains(., 'Login')]",
            { timeout: puppeteerTimeout }
        );
        const popupPromise = new Promise<Page | null>((resolve) =>
            page.once("popup", resolve)
        );
        await loginButton?.click();
        const popupPage = await popupPromise;
        if (!popupPage) {
            throw new Error("Login popup was not opened");
        }
        await enterCredentials(popupPage, screenshot, username, accountPwd);
        await hostFrame.waitForSelector("xpath=//p[contains(., 'Signed in')]", {
            timeout: puppeteerTimeout,
        });
        await verifyHostTokenStore(hostCache, ["User.Read"]);

        // Nested app acquires a token silently through the NAA bridge.
        const nestedFrame = await getNestedFrame(page);
        const acquireButton = await nestedFrame.waitForSelector(
            "xpath=//button[contains(., 'acquireTokenSilent')]"
        );
        await acquireButton?.click();
        await nestedFrame.waitForSelector(
            "xpath=//th[contains(., 'homeAccountId')]",
            { timeout: puppeteerTimeout }
        );
        await screenshot.takeScreenshot(page, "Nested app authenticated");

        // Nested app must not hold a refresh token — it stays with the host/broker.
        const nestedCachePage = await context.newPage();
        await nestedCachePage.goto(`http://localhost:${nestedPort}`);
        const nestedCache = new BrowserCacheUtils(
            nestedCachePage,
            "localStorage"
        );
        await verifyNestedTokenStore(nestedCache, ["User.Read"]);
    });
});
