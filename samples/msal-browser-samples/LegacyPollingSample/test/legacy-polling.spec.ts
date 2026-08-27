import puppeteer from "puppeteer";
import {
    Screenshot,
    setupCredentials,
    enterCredentials,
    LabClient,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
    BrowserCacheUtils,
    Browser,
    Page,
    BrowserContext,
} from "e2e-test-utils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
const port = 30664;

async function expectLoginPopupSucceeded(page: Page): Promise<void> {
    const handle = await page.waitForFunction(
        () => {
            const el = document.getElementById("output");
            const txt = el?.textContent ?? "";
            if (txt.startsWith("loginPopup result")) return { ok: true, txt };
            if (txt.startsWith("loginPopup error")) return { ok: false, txt };
            return null;
        },
        { timeout: 15000 }
    );
    const outcome = (await handle.jsonValue()) as { ok: boolean; txt: string };
    if (!outcome.ok) {
        throw new Error(`loginPopup did not succeed:\n${outcome.txt}`);
    }
}

async function expectSsoSucceeded(page: Page): Promise<void> {
    const handle = await page.waitForFunction(
        () => {
            const el = document.getElementById("output");
            const txt = el?.textContent ?? "";
            if (txt.startsWith("ssoSilent result")) return { ok: true, txt };
            if (txt.startsWith("ssoSilent error")) return { ok: false, txt };
            return null;
        },
        { timeout: 15000 }
    );
    const outcome = (await handle.jsonValue()) as { ok: boolean; txt: string };
    if (!outcome.ok) {
        throw new Error(`ssoSilent did not succeed:\n${outcome.txt}`);
    }
}

/*
 * E2E coverage for the legacy popup / ssoSilent flow gated by
 * `system.enableLegacyPolling: true`.
 */
describe("LegacyPopupSample - auth code stripping (enableLegacyPolling)", () => {
    jest.retryTimes(1);
    let browser: Browser;
    let context: BrowserContext;
    let page: Page;
    let username: string;
    let accountPwd: string;
    let BrowserCache: BrowserCacheUtils;

    beforeAll(async () => {
        // @ts-ignore
        browser = await puppeteer.launch({
            ignoreDefaultArgs: ["--no-sandbox", "--disable-setuid-sandbox"],
            acceptInsecureCerts: true, // To allow using self-signed certificates
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
        jest.setTimeout(60000);
        context = await browser.createBrowserContext();
        page = await context.newPage();
        page.setDefaultTimeout(5000);
        BrowserCache = new BrowserCacheUtils(page, "sessionStorage");
    });

    afterEach(async () => {
        await page.close();
        await context.close();
    });

    afterAll(async () => {
        await browser.close();
    });

    it("loginPopup completes and the popup URL is scrubbed before close", async () => {
        await page.goto(`http://localhost:${port}`);

        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/loginPopup`
        );
        await screenshot.takeScreenshot(page, "Page loaded");

        const loginButton = await page.waitForSelector("#btn-login");

        const popupPromise = new Promise<Page | null>((resolve) =>
            page.once("popup", resolve)
        );

        await loginButton?.click();
        const popupPage = await popupPromise;
        if (!popupPage) {
            throw new Error("Popup window was not opened");
        }

        let finalPopupUrl: string | null = null;
        popupPage.on("framenavigated", (frame) => {
            if (frame === popupPage.mainFrame()) {
                finalPopupUrl = frame.url();
            }
        });
        await enterCredentials(popupPage, screenshot, username, accountPwd);
        await screenshot.takeScreenshot(page, "Returned to app");

        await expectLoginPopupSucceeded(page);

        await BrowserCache.verifyTokenStore({ scopes: ["User.Read"] });

        // Auth code stripping: the last URL the popup landed on must not retain
        // `code` or `state` query/fragment params.
        expect(finalPopupUrl).not.toBeNull();
        expect(finalPopupUrl!).not.toMatch(/[?#&]code=/);
        expect(finalPopupUrl!).not.toMatch(/[?#&]state=/);

        // Top-frame URL must never have hosted an auth code in the first place.
        expect(page.url()).not.toMatch(/[?#&]code=/);
    });

    it("ssoSilent completes", async () => {
        await page.goto(`http://localhost:${port}`);

        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/ssoSilent`
        );
        await screenshot.takeScreenshot(page, "Page loaded");

        const loginButton = await page.waitForSelector("#btn-login");

        const popupPromise = new Promise<Page | null>((resolve) =>
            page.once("popup", resolve)
        );

        await loginButton?.click();
        const popupPage = await popupPromise;
        if (!popupPage) {
            throw new Error("Popup window was not opened");
        }

        let finalPopupUrl: string | null = null;
        popupPage.on("framenavigated", (frame) => {
            if (frame === popupPage.mainFrame()) {
                finalPopupUrl = frame.url();
            }
        });
        await enterCredentials(popupPage, screenshot, username, accountPwd);
        await screenshot.takeScreenshot(page, "Returned to app after login");

        await expectLoginPopupSucceeded(page);

        await BrowserCache.verifyTokenStore({ scopes: ["User.Read"] });

        await page.evaluate(() => {
            sessionStorage.clear();
            localStorage.clear();
        });

        // Pre-condition: log in once via popup so ssoSilent has a session hint.
        const ssoButton = await page.waitForSelector("#btn-sso-silent");
        await ssoButton?.click();

        await screenshot.takeScreenshot(page, "Returned to app after SSO");

        await expectSsoSucceeded(page);

        await BrowserCache.verifyTokenStore({ scopes: ["User.Read"] });
    });

    it("popup auth code is stripped even if the user cancels (popup closed early)", async () => {
        await page.goto(`http://localhost:${port}`);

        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/userCancelled`
        );
        await screenshot.takeScreenshot(page, "Page loaded");

        const loginButton = await page.waitForSelector("#btn-login");
        const popupPromise = new Promise<Page | null>((resolve) =>
            page.once("popup", resolve)
        );
        await loginButton?.click();
        const popupPage = await popupPromise;
        if (!popupPage) throw new Error("Popup window was not opened");

        let lastUrl = popupPage.url();
        popupPage.on("framenavigated", (frame) => {
            if (frame === popupPage.mainFrame()) {
                lastUrl = frame.url();
            }
        });

        await new Promise((r) => setTimeout(r, 1500));
        await popupPage.close();

        await page.waitForSelector(
            "xpath/.//pre[contains(., 'loginPopup error')]",
            {
                timeout: 10000,
            }
        );

        // The last popup URL must not retain a `code` param.
        expect(lastUrl).not.toMatch(/[?#&]code=/);
    });

    it("logoutPopup completes and clears the active account", async () => {
        await page.goto(`http://localhost:${port}`);

        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/logoutPopup`
        );
        await screenshot.takeScreenshot(page, "Page loaded");

        // Pre-condition: log in via popup so there's an active account to clear.
        const loginButton = await page.waitForSelector("#btn-login");
        const loginPopupPromise = new Promise<Page | null>((resolve) =>
            page.once("popup", resolve)
        );
        await loginButton?.click();
        const loginPopup = await loginPopupPromise;
        if (!loginPopup) throw new Error("Login popup was not opened");
        await enterCredentials(loginPopup, screenshot, username, accountPwd);
        await expectLoginPopupSucceeded(page);
        // Confirm cache is populated before logout.
        expect(await BrowserCache.getAccountFromCache()).not.toBeNull();

        // Trigger logoutPopup and capture the popup's final URL.
        const logoutButton = await page.waitForSelector("#btn-logout");
        const logoutPopupPromise = new Promise<Page | null>((resolve) =>
            page.once("popup", resolve)
        );
        await logoutButton?.click();
        const logoutPopup = await logoutPopupPromise;
        if (!logoutPopup) throw new Error("Logout popup was not opened");

        let finalLogoutUrl: string | null = logoutPopup.url();
        logoutPopup.on("framenavigated", (frame) => {
            if (frame === logoutPopup.mainFrame()) {
                finalLogoutUrl = frame.url();
            }
        });

        await page.waitForSelector(
            "xpath/.//pre[contains(., 'logoutPopup:') and contains(., 'completed')]",
            { timeout: 15000 }
        );
        await screenshot.takeScreenshot(page, "logoutPopup completed");

        expect(await BrowserCache.getAccountFromCache()).toBeNull();

        // Logout response carries `state` (no `code`); the URL the popup ends
        // up on must still be scrubbed by clearAuthResponseFromUrl.
        expect(finalLogoutUrl).not.toBeNull();
        expect(finalLogoutUrl!).not.toMatch(/[?#&]code=/);
        expect(finalLogoutUrl!).not.toMatch(/[?#&]state=/);
    });
});
