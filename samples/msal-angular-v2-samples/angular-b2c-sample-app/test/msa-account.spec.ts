import * as puppeteer from "puppeteer";
import { Screenshot, setupCredentials, b2cMsaAccountEnterCredentials } from "../../../e2eTestUtils/TestUtils";
import { LabClient } from "../../../e2eTestUtils/LabClient";
import { LabApiQueryParams } from "../../../e2eTestUtils/LabApiQueryParams";
import { UserTypes, B2cProviders } from "../../../e2eTestUtils/Constants";
import { BrowserCacheUtils } from "../../../e2eTestUtils/BrowserCacheTestUtils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/msa-account-tests`;

describe('B2C user-flow tests (msa account)', () => {
    jest.retryTimes(1);
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
            userType: UserTypes.B2C,
            b2cProvider: B2cProviders.TWITTER
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParams);

        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);
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

    it("Edits profile with the policy", async (): Promise<void> => {
        const testName = "editProfileWithPolicy";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
        await screenshot.takeScreenshot(page, "Page loaded");

        // Initiate Login
        const signInButton = await page.waitForSelector("xpath=//button[contains(., 'Login')]");
        if (signInButton) {
            await signInButton.click();
        }
        await screenshot.takeScreenshot(page, "Login button clicked");

        await b2cMsaAccountEnterCredentials(page, screenshot, username, accountPwd);

        // Verify UI now displays logged in content
        await page.waitForXPath("//p[contains(., 'Login successful!')]");
        await page.waitForXPath("//button[contains(., 'Logout')]");

        await screenshot.takeScreenshot(page, "Signed in with the policy");

        // Verify tokens are in cache
        const tokenStoreBeforeEdit = await BrowserCache.getTokens();
        expect(tokenStoreBeforeEdit.idTokens.length).toBe(1);
        expect(tokenStoreBeforeEdit.accessTokens.length).toBe(1);
        expect(tokenStoreBeforeEdit.refreshTokens.length).toBe(1);
        expect(await BrowserCache.getAccountFromCache(tokenStoreBeforeEdit.idTokens[0])).not.toBeNull();
        expect(await BrowserCache.accessTokenForScopesExists(tokenStoreBeforeEdit.accessTokens, ["https://msidlabb2c.onmicrosoft.com/msidlabb2capi/read"])).toBeTruthy;
        
        // initiate edit profile flow
        const editProfileButton = await page.waitForSelector("xpath=//span[contains(., 'Edit Profile')]");
        if (editProfileButton) {
            await editProfileButton.click();
        }
        let displayName = (Math.random() + 1).toString(36).substring(7); // generate a random string
        await page.waitForSelector("#attributeVerification");
        await Promise.all([
            page.$eval('#displayName', (el: any) => el.value = ''), // clear the text field
            page.type("#displayName", `${displayName}`),
        ]);
        await page.click("#continue");
        await page.waitForFunction(`window.location.href.startsWith("http://localhost:${port}")`);
        await page.waitForSelector("#idTokenClaims");
        const htmlBody = await page.evaluate(() => document.body.innerHTML);
        expect(htmlBody).toContain(`${displayName}`);
        expect(htmlBody).toContain("B2C_1_SISOPolicy"); // implies the current active account

        // Verify tokens are in cache
        const tokenStoreAfterEdit = await BrowserCache.getTokens();
        expect(tokenStoreAfterEdit.idTokens.length).toBe(2); // 1 for each policy
        expect(tokenStoreAfterEdit.accessTokens.length).toBe(1);
        expect(tokenStoreAfterEdit.refreshTokens.length).toBe(2); // 1 for each policy
        expect(await BrowserCache.getAccountFromCache(tokenStoreAfterEdit.idTokens[0])).not.toBeNull();
        expect(await BrowserCache.getAccountFromCache(tokenStoreAfterEdit.idTokens[1])).not.toBeNull(); // new account after edit
        expect(await BrowserCache.accessTokenForScopesExists(tokenStoreAfterEdit.accessTokens, ["https://msidlabb2c.onmicrosoft.com/msidlabb2capi/read"])).toBeTruthy;
    });
  }
);