import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    setupCredentials,
    enterCredentials,
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
    msalConfig as earMsalConfig,
    request as earTokenRequest,
} from "../authConfigs/earAuthConfig.json";
import fs from "fs";
import path from "path";

const SCREENSHOT_BASE_FOLDER_NAME = path.join(
    __dirname,
    "../../../test/screenshots/customizable-e2e-test/browserEAR"
);
// The ?ear=true toggle (see auth.js) forces system.protocolMode = "EAR" so the
// sample exercises the Encrypted Authorize Response flow. Kept in the URL for
// every navigation below so the redirect round-trip stays in EAR mode.
const EAR_QUERY_STRING = "?ear=true";
let sampleHomeUrl = "";

/**
 * Returns true when a request to the /authorize endpoint used HTTP POST. EAR
 * forces the /authorize request to be a POST form (the encrypted JWK travels in
 * the body), so this is the distinguishing signal of an EAR flow versus the
 * default auth-code GET navigation.
 */
function isAuthorizePost(request: puppeteer.HTTPRequest): boolean {
    return request.url().includes("/authorize") && request.method() === "POST";
}

describe("EAR (Encrypted Authorize Response) Tests", () => {
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let username = "";
    let accountPwd = "";

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
                msalConfig: earMsalConfig,
                request: earTokenRequest,
            })
        );
    });

    afterAll(async () => {
        await context.close();
        await browser.close();
    });

    describe("login Tests", () => {
        beforeEach(async () => {
            context = await browser.createBrowserContext();
            page = await context.newPage();

            BrowserCache = new BrowserCacheUtils(
                page,
                earMsalConfig.cache.cacheLocation
            );
            await page.goto(sampleHomeUrl + EAR_QUERY_STRING);
            await pcaInitializedPoller(page, 10000);
        });

        afterEach(async () => {
            await page.evaluate(() =>
                Object.assign({}, window.sessionStorage.clear())
            );
            await page.evaluate(() =>
                Object.assign({}, window.localStorage.clear())
            );
            await page.close();
        });

        it("Performs EAR loginRedirect", async () => {
            const testName = "earRedirectBaseCase";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            // EAR forces the /authorize request to be a POST form. Capture the
            // method to assert the encrypted-response protocol was actually used.
            let authorizeWasPost = false;
            page.on("request", (request) => {
                if (isAuthorizePost(request)) {
                    authorizeWasPost = true;
                }
            });

            await clickLoginRedirect(screenshot, page);
            await enterCredentials(page, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page);

            expect(authorizeWasPost).toBe(true);
            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await BrowserCache.verifyTokenStore({
                scopes: earTokenRequest.scopes,
            });
        });

        it("Performs EAR loginPopup", async () => {
            const testName = "earPopupBaseCase";
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

            // The PCA is initialized in EAR mode (?ear=true), so a successful
            // token acquisition is by definition an Encrypted Authorize Response
            // acquisition. Verify browser cache contains Account, idToken,
            // AccessToken and RefreshToken.
            await BrowserCache.verifyTokenStore({
                scopes: earTokenRequest.scopes,
            });
        });
    });
});
