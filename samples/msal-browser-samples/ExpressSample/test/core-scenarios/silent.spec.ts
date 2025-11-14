import * as puppeteer from "puppeteer";
import {
    Screenshot,
    setupCredentials,
    enterCredentials,
    BrowserCacheUtils,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
    LabClient,
} from "e2e-test-utils";
import path from "path";
import { defaultPcaConfig, defaultTokenRequest, setPCAConfiguration, setRequestConfiguration, signInPopup } from "../test-helpers";

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "../screenshots/core-scenarios/silent");
let sampleHomeUrl = "";

describe("Silent tests", () => {
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let port: number;
    let BrowserCache: BrowserCacheUtils;
    let username = "";
    let accountPwd = "";

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
        page.setDefaultTimeout(2000);
        BrowserCache = new BrowserCacheUtils(page, "localStorage");
        sampleHomeUrl = `http://localhost:${port}/playground`;
        await page.goto(sampleHomeUrl, { timeout: 2000 });
    });

    afterEach(async () => {
        await page.close();
        await context.close();
    });

    it("acquireTokenSilent from Cache", async () => {
        const testName = "acquireTokenSilentCache";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );
        await setPCAConfiguration(defaultPcaConfig, page, screenshot);
        await setRequestConfiguration(defaultTokenRequest, page, screenshot);
        await signInPopup(page, screenshot, username, accountPwd);

        await page.locator("button#btnAcquireTokenSilent").click();
        const response = await page.locator("div#responseDisplay").filter((value) => {
            console.log(value.textContent);
            return !!value.textContent && value.textContent.includes("Executing...")
        }).map(value => value.textContent).wait();
        expect(JSON.parse(response || "{}").fromCache).toBe(true);
        await screenshot.takeScreenshot(
            page,
            "acquireTokenSilent-fromCache-GotTokens"
        );
        // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
        await BrowserCache.verifyTokenStore({
            scopes: defaultTokenRequest.scopes,
        });
    });

    it("acquireTokenSilent via RefreshToken", async () => {
        const testName = "acquireTokenSilentRT";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );
        await page.waitForSelector("#acquireTokenSilent");

        // Remove access_tokens from cache so we can verify acquisition
        const tokenStore = await BrowserCache.getTokens();
        await BrowserCache.removeTokens(tokenStore.accessTokens);

        await page.click("#acquireTokenSilent");
        await page.waitForSelector("#scopes-acquired");
        await screenshot.takeScreenshot(
            page,
            "acquireTokenSilent-viaRefresh-GotTokens"
        );

        // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
        await BrowserCache.verifyTokenStore({
            scopes: defaultTokenRequest.scopes,
        });
    });
});