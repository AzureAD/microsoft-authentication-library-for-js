import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    setupCredentials,
    enterCredentials,
    storagePoller,
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
    msalConfig as aadMsalConfig,
    request as aadTokenRequest,
} from "../authConfigs/localStorageAuthConfig.json";
import fs from "fs";
import path from "path";

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "../../../test/screenshots/customizable-e2e-test/localStorage");

describe("LocalStorage Tests", function () {
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
                msalConfig: aadMsalConfig,
                request: aadTokenRequest,
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
                aadMsalConfig.cache.cacheLocation
            );
            await page.goto(sampleHomeUrl);
            await pcaInitializedPoller(page, 5000);
        });

        afterEach(async () => {
            await page.evaluate(() =>
                Object.assign({}, window.localStorage.clear())
            );
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
            await BrowserCache.verifyTokenStore({
                scopes: aadTokenRequest.scopes,
            });
        });

        it("Going back to app during redirect clears cache", async () => {
            const testName = "redirectBrowserBackButton";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await clickLoginRedirect(screenshot, page);
            await page.waitForNavigation({ waitUntil: "networkidle0" });
            // Navigate back to home page
            await page.goto(sampleHomeUrl);
            // Wait for processing
            await storagePoller(async () => {
                // Temporary Cache always uses sessionStorage
                const sessionBrowserStorage = new BrowserCacheUtils(
                    page,
                    "sessionStorage"
                );
                const sessionStorage =
                    await sessionBrowserStorage.getWindowStorage();
                const localStorage = await BrowserCache.getWindowStorage();
                expect(Object.keys(localStorage).length).toBeLessThanOrEqual(2);
                Object.keys(localStorage).forEach((key) => {
                    expect(key.startsWith("msal.token.keys") || key === "msal.account.keys").toBe(true);
                });
                expect(Object.keys(sessionStorage).length).toEqual(0);
            }, ONE_SECOND_IN_MS);
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
            await BrowserCache.verifyTokenStore({
                scopes: aadTokenRequest.scopes,
            });
        });

        it("Closing popup before login resolves clears cache", async () => {
            const testName = "popupCloseWindow";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            const [popupPage, popupWindowClosed] = await clickLoginPopup(
                screenshot,
                page
            );
            await popupPage.waitForNavigation({ waitUntil: "networkidle0" });
            await popupPage.close();
            // Wait until popup window closes
            await popupWindowClosed;
            // Wait for processing
            await storagePoller(async () => {
                // Temporary Cache always uses sessionStorage
                const sessionBrowserStorage = new BrowserCacheUtils(
                    page,
                    "sessionStorage"
                );
                const sessionStorage =
                    await sessionBrowserStorage.getWindowStorage();
                const localStorage = await BrowserCache.getWindowStorage();
                expect(Object.keys(localStorage).length).toEqual(1); // Telemetry
                expect(Object.keys(sessionStorage).length).toEqual(0);
            }, ONE_SECOND_IN_MS);
        });

        it.skip("Logging in on one tab updates cache/UI in another tab", async () => {
            const testName = "multi-tab";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            const tab1 = page;
            const tab2 = await context.newPage();
            tab2.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
            await tab2.goto(sampleHomeUrl);
            await pcaInitializedPoller(tab2, 5000);

            const checkSignInState = (expectedState: boolean) => {
                const state = document.getElementById("SignIn").innerHTML.trim();
                if (state === "Sign In") {
                    return !expectedState;
                } else if (state === "Sign Out") {
                    return expectedState;
                } else {
                    throw `Sign In Button cannot be found or has unexpected value. Value: ${state}`;
                };
            };

            // Check that both tabs start signed out
            await tab1.waitForFunction(checkSignInState, {}, false);
            await tab2.waitForFunction(checkSignInState, {}, false);

            await tab1.bringToFront();
            const [popupPage, popupWindowClosed] = await clickLoginPopup(
                screenshot,
                tab1
            );
            await enterCredentials(popupPage, screenshot, username, accountPwd);
            await waitForReturnToApp(
                screenshot,
                tab1,
                popupPage,
                popupWindowClosed
            );
            // Check that both tabs have updated UI
            await tab1.waitForFunction(checkSignInState, {}, true);
            await tab1.waitForSelector("#acquireTokenSilent");
            await screenshot.takeScreenshot(tab1, "tab1SignedIn");

            await tab2.bringToFront();
            await tab2.waitForFunction(checkSignInState, {}, true);
            await tab2.waitForSelector("#acquireTokenSilent");
            await screenshot.takeScreenshot(tab2, "tab2SignedIn");
            
            await tab2.click("#acquireTokenSilent");
            await tab2.waitForSelector("#fromCache");
            await screenshot.takeScreenshot(tab2, "tab2AcquiredToken");

            await tab1.bringToFront();
            await tab1.click("#acquireTokenSilent");
            await tab1.waitForSelector("#fromCache");
            await screenshot.takeScreenshot(tab1, "tab1AcquiredToken");


            // Check that both tabs got tokens from cache
            const fromCache = () => {
                const fromCacheEl = document.getElementById("fromCache").innerHTML.trim();;
                if (fromCacheEl.includes("true")) {
                    return true;
                } else if (fromCacheEl.includes("false")) {
                    return false;
                }
                
                throw `fromCache element cannot be found or has unexpected value. Value: ${fromCacheEl}`;
            };

            expect(await tab1.evaluate(fromCache)).toEqual(true);
            expect(await tab2.evaluate(fromCache)).toEqual(true);
        });
    });
});
