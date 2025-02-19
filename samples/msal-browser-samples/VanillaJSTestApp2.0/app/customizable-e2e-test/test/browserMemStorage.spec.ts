import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    setupCredentials,
    enterCredentials,
    ONE_SECOND_IN_MS,
    clickLoginPopup,
    clickLoginRedirect,
    waitForReturnToApp,
    getBrowser,
    getHomeUrl,
    pcaInitializedPoller,
    BrowserCacheUtils,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
    LabClient,
} from "e2e-test-utils";
import {
    msalConfig as memStorageConfig,
    request as memStorageTokenRequest,
} from "../authConfigs/memStorageAuthConfig.json";
import fs from "fs";
import path from "path";

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "../../../test/screenshots/customizable-e2e-test/browserMemStorage");

async function verifyTokenStore(
    BrowserCache: BrowserCacheUtils,
    scopes: string[]
): Promise<void> {
    const tokenStore = await BrowserCache.getTokens();
    expect(tokenStore.idTokens).toHaveLength(0);
    expect(tokenStore.accessTokens).toHaveLength(0);
    expect(tokenStore.refreshTokens).toHaveLength(0);
    const storage = await BrowserCache.getWindowStorage();
    expect(Object.keys(storage).length).toEqual(0);
}

describe("In Memory Storage Tests", function () {
    let username = "";
    let accountPwd = "";
    let sampleHomeUrl = "";

    let browser: puppeteer.Browser;
    beforeAll(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        browser = await getBrowser();
        sampleHomeUrl = getHomeUrl();

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

        fs.writeFileSync(
            "./app/customizable-e2e-test/testConfig.json",
            JSON.stringify({
                msalConfig: memStorageConfig,
                request: memStorageTokenRequest,
            })
        );
    });

    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;

    afterAll(async () => {
        await context.close();
        await browser.close();
    });

    describe("login Tests", () => {
        beforeEach(async () => {
            context = await browser.createBrowserContext();
            page = await context.newPage();
            page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
            BrowserCache = new BrowserCacheUtils(
                page,
                memStorageConfig.cache.cacheLocation
            );
            await page.goto(sampleHomeUrl);
            await pcaInitializedPoller(page, 5000);
        });

        afterEach(async () => {
            await page.close();
        });

        it("Performs loginRedirect", async () => {
            const testName = "redirectBaseCase";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            await clickLoginRedirect(screenshot, page);
            await enterCredentials(page, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page);
            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await verifyTokenStore(BrowserCache, memStorageTokenRequest.scopes);
        });

        it("Performs loginPopup", async () => {
            const testName = "popupBaseCase";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            const [popupPage, popupWindowClosed] = await clickLoginPopup(
                screenshot,
                page
            );
            await enterCredentials(popupPage, screenshot, username, accountPwd);
            await waitForReturnToApp(
                screenshot,
                page,
                popupPage,
                popupWindowClosed
            );

            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await verifyTokenStore(BrowserCache, memStorageTokenRequest.scopes);
        });
    });
});
