import * as puppeteer from "puppeteer";
import {
    Screenshot,
    setupCredentials,
    enterCredentials,
    LabClient,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
    BrowserCacheUtils
} from "e2e-test-utils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/upgrade-downgrade-tests`;

describe("Upgrade/Downgrade Tests", () => {
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
        context = await browser.createBrowserContext();
        page = await context.newPage();
        page.setDefaultTimeout(500);
        BrowserCache = new BrowserCacheUtils(page, "localStorage");
        await page.goto(`http://localhost:${port}`, { timeout: 2000 });
    });

    afterEach(async () => {
        await page.close();
        await context.close();
    });

    describe("Upgrade tests", () => {
        test("acquireTokenSilent can return tokens from the cache after upgrading from the previous version", async () => {
            const testName = "upgrade";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await screenshot.takeScreenshot(page, "Page loaded");

            await page.locator("button#versionButton").click();
            await page.locator('div#latest').click();
            await page.locator("span#currentVersionText").filter((value) => {return !!value.textContent && value.textContent.startsWith("Latest")}).wait();
            await screenshot.takeScreenshot(page, "Latest published version selected");

            await page.locator("button#signInButton").click();
            await screenshot.takeScreenshot(page, "Sign in button clicked");
            await page.locator("a#signInRedirect").click();
            await screenshot.takeScreenshot(page, "Sign in redirect clicked");
            await enterCredentials(page, screenshot, username, accountPwd);
            await page.locator("a#viewProfileButton").waitHandle();
            await screenshot.takeScreenshot(page, "Logged In");

            // Change to local build
            await page.locator("button#versionButton").click();
            await page.locator('div#local').click();
            await page.locator("span#currentVersionText").filter((value) => {return !!value.textContent && value.textContent == "Local Build"}).wait();
            await screenshot.takeScreenshot(page, "Local published version selected");
            
            // Track network requests to verify cached tokens are used
            const networkRequests: puppeteer.HTTPRequest[] = [];
            page.on('request', (request) => {
                // Track all requests to authentication endpoints
                if (request.url().includes('login.microsoftonline.com') || 
                    request.url().includes('/token') || 
                    request.url().includes('/authorize')) {
                    networkRequests.push(request);
                }
            });
            
            await page.locator("a#viewProfileButton").click();
            await screenshot.takeScreenshot(page, "Profile button clicked");

            // Verify the Raw Authentication Data section is populated
            const authDataText = await page.locator("pre#auth-json").filter((value) => {console.log(value.textContent); return !!value.textContent && value.textContent !== 'Loading...'}).map(value => value.textContent).wait();
            await screenshot.takeScreenshot(page, "Authentication data displayed");
            const authData = JSON.parse(authDataText || "");
            expect(authData).toHaveProperty('fromCache');
            expect(authData.fromCache).toBe(true); // Should be from cache after upgrade

            // Verify no authentication network requests were made (indicating cached tokens were used)
            expect(networkRequests.length).toBe(0);
        });
    });
    
    describe("Downgrade tests", () => {
        test("acquireTokenSilent can return tokens from the cache after downgrading to the previous version", () => {

        });
    });
})