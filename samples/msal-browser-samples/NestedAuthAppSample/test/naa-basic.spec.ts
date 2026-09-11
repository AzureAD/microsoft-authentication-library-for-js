import {
    Browser,
    BrowserCacheUtils,
    BrowserContext,
    Frame,
    Page,
    Screenshot,
    enterCredentials,
} from "e2e-test-utils";
import { getLabCredentials } from "./naaTestUtils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/nestedAppAuth`;
const PUPPETEER_TIMEOUT = 15000;
const AUTHENTICATION_TIMEOUT = 60000;
const SCOPES = ["User.Read"];

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { HOST_APP_PORT, NESTED_APP_PORT } = require("../sampleConfig.cjs") as {
    HOST_APP_PORT: number;
    NESTED_APP_PORT: number;
};

async function getNestedFrame(page: Page): Promise<Frame> {
    const frame = await page.waitForFrame(
        (candidate) => candidate.url().includes(NESTED_APP_PORT.toString()),
        { timeout: PUPPETEER_TIMEOUT }
    );
    await frame.waitForSelector(
        "xpath=//button[contains(., 'acquireTokenSilent')]",
        { timeout: PUPPETEER_TIMEOUT }
    );
    return frame;
}

async function waitForHostSignIn(frame: Frame): Promise<void> {
    await frame.waitForFunction(
        () =>
            Array.from(document.querySelectorAll("p")).some((element) =>
                element.textContent?.includes("Signed in")
            ) || Boolean(document.querySelector("pre")),
        { timeout: AUTHENTICATION_TIMEOUT }
    );

    const error = await frame
        .$eval("pre", (element) => element.textContent)
        .catch(() => null);
    if (error) {
        throw new Error(`Host authentication failed: ${error}`);
    }
}

async function verifyHostTokenStore(
    browserCache: BrowserCacheUtils
): Promise<void> {
    const tokenStore = await browserCache.getTokens();
    expect(tokenStore.idTokens.length).toBe(1);
    expect(tokenStore.accessTokens.length).toBe(1);
    expect(tokenStore.refreshTokens.length).toBe(1);
    expect(await browserCache.getAccountFromCache()).not.toBeNull();
    expect(
        await browserCache.accessTokenForScopesExists(
            tokenStore.accessTokens,
            SCOPES
        )
    ).toBeTruthy();
}

async function verifyNestedTokenStore(
    browserCache: BrowserCacheUtils
): Promise<void> {
    const tokenStore = await browserCache.getTokens();
    expect(tokenStore.idTokens.length).toBe(1);
    expect(tokenStore.accessTokens.length).toBe(1);
    expect(tokenStore.refreshTokens.length).toBe(0);
    expect(await browserCache.getAccountFromCache()).not.toBeNull();
    expect(
        await browserCache.accessTokenForScopesExists(
            tokenStore.accessTokens,
            SCOPES
        )
    ).toBeTruthy();
}

describe("Nested App Authentication brokered through the host app", () => {
    jest.setTimeout(120000);

    let browser: Browser;
    let context: BrowserContext;
    let page: Page;
    let username: string;
    let password: string;
    let hostCache: BrowserCacheUtils;

    beforeAll(async () => {
        // @ts-ignore
        browser = await global.__BROWSER__;
        ({ username, password } = await getLabCredentials());
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

        await page.goto(`https://localhost:${HOST_APP_PORT}`);

        const hostFrame = page.mainFrame();
        const loginButton = await hostFrame.waitForSelector(
            "xpath=//button[contains(., 'Login')]",
            { timeout: PUPPETEER_TIMEOUT }
        );
        const popupPromise = new Promise<Page | null>((resolve) =>
            page.once("popup", resolve)
        );
        await loginButton?.click();
        const popupPage = await popupPromise;
        if (!popupPage) {
            throw new Error("Login popup was not opened");
        }
        await enterCredentials(popupPage, screenshot, username, password);
        await waitForHostSignIn(hostFrame);
        await verifyHostTokenStore(hostCache);

        const nestedFrame = await getNestedFrame(page);
        const acquireButton = await nestedFrame.waitForSelector(
            "xpath=//button[contains(., 'acquireTokenSilent')]"
        );
        await acquireButton?.click();
        await nestedFrame.waitForSelector(
            "xpath=//th[contains(., 'homeAccountId')]",
            { timeout: PUPPETEER_TIMEOUT }
        );
        await screenshot.takeScreenshot(page, "Nested app authenticated");

        const nestedCache = new BrowserCacheUtils(
            nestedFrame as unknown as Page,
            "sessionStorage"
        );
        await verifyNestedTokenStore(nestedCache);
    });
});
