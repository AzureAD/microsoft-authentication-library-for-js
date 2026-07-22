process.env.VITE_NESTED_APP_PORT = "30667";

import puppeteer, { Browser, Page, BrowserContext, Frame } from "puppeteer";
import {
    Screenshot,
    setupCredentials,
    enterCredentials,
    LabClient,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
    BrowserCacheUtils,
    BrokerCacheSnapshot,
    verifyBrokerTokenStore as verifyBrokerTokenStoreShared,
    verifyBrokeredTokenStore as verifyBrokeredTokenStoreShared,
    getBrokerFrame as getBrokerFrameShared,
    getEmbeddedFrame as getEmbeddedFrameShared,
    getAuthenticatedEmbeddedFrame as getAuthenticatedEmbeddedFrameShared,
} from "e2e-test-utils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/nestedAppAuth`;
const puppeteerTimeout = 15000;
const jestTimeout = 120000;

// Host is the top frame (also enables the platform broker); nested app is an iframe.
const hostPort = 30668;
const nestedPort = 30667;

let hostSnapshot: BrokerCacheSnapshot;

const getHostFrame = (page: Page): Promise<Frame> =>
    getBrokerFrameShared(page, hostPort, puppeteerTimeout);

const getNestedFrame = (page: Page): Promise<Frame> =>
    getEmbeddedFrameShared(page, nestedPort, puppeteerTimeout);

const getAuthenticatedNestedFrame = (page: Page): Promise<Frame> =>
    getAuthenticatedEmbeddedFrameShared(page, nestedPort, puppeteerTimeout);

const verifyHostTokenStore = async (
    browserCache: BrowserCacheUtils,
    scopes: string[]
): Promise<void> => {
    hostSnapshot = await verifyBrokerTokenStoreShared(browserCache, scopes);
};

const verifyNestedTokenStore = (
    browserCache: BrowserCacheUtils,
    scopes: string[]
): Promise<void> =>
    verifyBrokeredTokenStoreShared(browserCache, scopes, hostSnapshot);

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
    let nestedCache: BrowserCacheUtils;

    beforeAll(async () => {
        // @ts-ignore
        browser = await puppeteer.launch({
            ignoreDefaultArgs: ["--no-sandbox", "–disable-setuid-sandbox"],
        });

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
        nestedCache = new BrowserCacheUtils(page, "localStorage");
    });

    afterEach(async () => {
        await page.close();
        await context.close();
    });

    afterAll(async () => {
        await browser.close();
    });

    it("nested app acquires a token through the host without holding a refresh token", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/nestedAcquireToken`
        );

        await page.goto(`http://localhost:${hostPort}`);

        // Sign the host in through the platform broker.
        const hostFrame = await getHostFrame(page);
        const loginButton = await hostFrame.waitForSelector(
            "xpath=//button[contains(., 'Login')]"
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
        await getAuthenticatedNestedFrame(page);
        await screenshot.takeScreenshot(page, "Nested app authenticated");

        // Nested app must not hold a refresh token — it stays with the host/broker.
        await verifyNestedTokenStore(nestedCache, ["User.Read"]);
    });
});
