import {
    Browser,
    Page,
    BrowserContext,
    Frame,
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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { HOST_APP_PORT, NESTED_APP_PORT } = require("../sampleConfig.cjs") as {
    HOST_APP_PORT: number;
    NESTED_APP_PORT: number;
};

const hostPort = HOST_APP_PORT;
const nestedPort = NESTED_APP_PORT;
const protocol = "https";

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
    expect(tokenStore.idTokens.length).toBe(1);
    expect(tokenStore.accessTokens.length).toBe(1);
    // The host completes regular web authentication, so it keeps its own
    // refresh token. (Under a platform broker the refresh token would instead
    // be held by the OS broker and the host cache would hold none.)
    expect(tokenStore.refreshTokens.length).toBe(1);
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
    expect(tokenStore.idTokens.length).toBe(1);
    expect(tokenStore.accessTokens.length).toBe(1);
    expect(tokenStore.refreshTokens.length).toBe(0);
    expect(await browserCache.getAccountFromCache()).not.toBeNull();
    expect(
        await browserCache.accessTokenForScopesExists(
            tokenStore.accessTokens,
            scopes
        )
    ).toBeTruthy();
};

/**
 * Nested App Authentication (NAA) exercised through the host app.
 *
 * The host app implements and supplies `window.nestedAppAuthBridge`, brokering
 * the nested app's tokens over the regular web flow. The nested app acquires a
 * token silently through that bridge and never holds a refresh token — that is
 * the core NAA property under test. Requires lab credentials.
 */
describe("Nested App Authentication brokered through the host app", () => {
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
        const client = await page.createCDPSession();
        await client.send("Security.setIgnoreCertificateErrors", {
            ignore: true,
        });
        hostCache = new BrowserCacheUtils(page, "sessionStorage");
    });

    afterEach(async () => {
        await context.close();
    });

    it("nested app acquires a token through the host without holding a refresh token", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/nestedAcquireToken`
        );

        await page.goto(`${protocol}://localhost:${hostPort}`);

        // Sign the host in through the standard web (popup) authentication flow.
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

        // Nested app acquires a token silently through the host-supplied NAA
        // bridge (`window.nestedAppAuthBridge`).
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
        // The nested app caches to sessionStorage, which is scoped to the iframe's
        // browsing context, so read it from the frame directly.
        const nestedCache = new BrowserCacheUtils(
            nestedFrame as unknown as Page,
            "sessionStorage"
        );
        await verifyNestedTokenStore(nestedCache, ["User.Read"]);
    });
});
