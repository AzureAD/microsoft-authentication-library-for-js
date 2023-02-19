import puppeteer from "puppeteer";
import { Screenshot, createFolder, setupCredentials, enterCredentials, ONE_SECOND_IN_MS, retrieveAppConfiguration } from "../../../../../e2eTestUtils/TestUtils";
import { BrowserCacheUtils } from "../../../../../e2eTestUtils/BrowserCacheTestUtils";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes, UserTypes, AppPlatforms } from "../../../../../e2eTestUtils/Constants";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";
import { Configuration } from "../../../../../../lib/msal-browser/src";
import { clickLoginPopup, clickLoginRedirect, waitForReturnToApp } from "./testUtils";
import fs from "fs";
import {getBrowser, getHomeUrl} from "../../testUtils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/memStorage`;

async function verifyTokenStore(BrowserCache: BrowserCacheUtils, scopes: string[]): Promise<void> {
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
    let clientID: string;
    let authority: string;

    let browser: puppeteer.Browser;
    let msalConfig: Configuration;
    let request: any;

    beforeAll(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        browser = await getBrowser();
        sampleHomeUrl = getHomeUrl();

        const labApiParams: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD,
            userType: UserTypes.CLOUD,
            appPlatform: AppPlatforms.SPA,
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParams);

        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);
        [clientID, , authority] = await retrieveAppConfiguration(envResponse[0], labClient, false);

        msalConfig = {
            auth: {
                clientId: clientID,
                authority: authority
            },
            cache: {
                cacheLocation: "memoryStorage",
                storeAuthStateInCookie: true
            }
        };

        request = {
            scopes: ["User.Read"]
        }

        fs.writeFileSync("./app/customizable-e2e-test/testConfig.json", JSON.stringify({ msalConfig: msalConfig, request: request }));
    });

    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;

    afterAll(async () => {
        await context.close();
        await browser.close();
        fs.writeFileSync("./app/customizable-e2e-test/testConfig.json", JSON.stringify({}));
    });

    describe("login Tests", () => {
        beforeEach(async () => {
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            page.setDefaultTimeout(ONE_SECOND_IN_MS*5);
            BrowserCache = new BrowserCacheUtils(page, msalConfig.cache.cacheLocation);
            await page.goto(sampleHomeUrl);
        });

        afterEach(async () => {
            await page.close();
        });

        it("Performs loginRedirect", async () => {
            const testName = "redirectBaseCase";
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

            await clickLoginRedirect(screenshot, page);
            await enterCredentials(page, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page);
            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await verifyTokenStore(BrowserCache, request.scopes);
        });

        it("Performs loginPopup", async () => {
            const testName = "popupBaseCase";
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

            const [popupPage, popupWindowClosed] = await clickLoginPopup(screenshot, page);
            await enterCredentials(popupPage, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page, popupPage, popupWindowClosed);

            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await verifyTokenStore(BrowserCache, request.scopes);
        });
    });
});
