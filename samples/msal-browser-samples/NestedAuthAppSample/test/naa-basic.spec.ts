// Tests the basic NAA end-to-end flow.

import { Browser, BrowserContext, Frame, Page } from "playwright-core";
import {
    Screenshot,
    accessTokenForScopesExists,
    enterAadCredentials,
    getLabCredentials,
    launchBrowser,
    readAccountKeys,
    readSessionTokenStore,
} from "./naaTestUtils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/nestedAppAuth`;
const ACTION_TIMEOUT = 15000;
const AUTHENTICATION_TIMEOUT = 60000;
const SCOPES = ["User.Read"];

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { HOST_APP_PORT, NESTED_APP_PORT } = require("../sampleConfig.cjs") as {
    HOST_APP_PORT: number;
    NESTED_APP_PORT: number;
};

async function getNestedFrame(page: Page): Promise<Frame> {
    const handle = await page.waitForSelector("iframe[title='nestedApp']", {
        timeout: ACTION_TIMEOUT,
    });
    const frame = await handle.contentFrame();
    if (!frame) {
        throw new Error("Nested app iframe has no content frame");
    }
    await frame.waitForSelector(
        "xpath=//button[contains(., 'acquireTokenSilent')]",
        { timeout: ACTION_TIMEOUT }
    );
    return frame;
}

async function waitForHostSignIn(frame: Frame): Promise<void> {
    await frame.waitForFunction(
        () =>
            Array.from(document.querySelectorAll("p")).some((element) =>
                element.textContent?.includes("Signed in")
            ) || Boolean(document.querySelector("pre")),
        undefined,
        { timeout: AUTHENTICATION_TIMEOUT }
    );

    const error = await frame
        .$eval("pre", (element) => element.textContent)
        .catch(() => null);
    if (error) {
        throw new Error(`Host authentication failed: ${error}`);
    }
}

async function verifyHostTokenStore(page: Page): Promise<void> {
    const tokenStore = await readSessionTokenStore(page);
    expect(tokenStore.idTokens.length).toBe(1);
    expect(tokenStore.accessTokens.length).toBe(1);
    expect(tokenStore.refreshTokens.length).toBe(1);
    expect(await readAccountKeys(page)).not.toBeNull();
    expect(accessTokenForScopesExists(tokenStore.accessTokens, SCOPES)).toBe(
        true
    );
}

async function verifyNestedTokenStore(frame: Frame): Promise<void> {
    const tokenStore = await readSessionTokenStore(frame);
    expect(tokenStore.idTokens.length).toBe(1);
    expect(tokenStore.accessTokens.length).toBe(1);
    expect(tokenStore.refreshTokens.length).toBe(0);
    expect(await readAccountKeys(frame)).not.toBeNull();
}

describe("Nested App Authentication brokered through the host app", () => {
    jest.setTimeout(120000);

    let browser: Browser;
    let context: BrowserContext;
    let page: Page;
    let username: string;
    let password: string;

    beforeAll(async () => {
        browser = await launchBrowser();
        ({ username, password } = await getLabCredentials());
    });

    beforeEach(async () => {
        context = await browser.newContext({ ignoreHTTPSErrors: true });
        page = await context.newPage();
    });

    afterEach(async () => {
        await context.close();
    });

    afterAll(async () => {
        await browser.close();
    });

    it("nested app acquires a token through the host without holding a refresh token", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/nestedAcquireToken`
        );

        await page.goto(`https://localhost:${HOST_APP_PORT}`);

        const hostFrame = page.mainFrame();
        const popupPromise = page.waitForEvent("popup", {
            timeout: ACTION_TIMEOUT,
        });
        await hostFrame
            .getByRole("button", { name: "Login" })
            .click({ timeout: ACTION_TIMEOUT });
        const popupPage = await popupPromise;
        await enterAadCredentials(popupPage, username, password, screenshot);
        await waitForHostSignIn(hostFrame);
        await verifyHostTokenStore(page);

        const nestedFrame = await getNestedFrame(page);
        await nestedFrame
            .getByRole("button", { name: "acquireTokenSilent" })
            .click({ timeout: ACTION_TIMEOUT });
        await nestedFrame
            .getByRole("columnheader", { name: "homeAccountId" })
            .waitFor({ timeout: ACTION_TIMEOUT });
        await screenshot.takeScreenshot(page, "Nested app authenticated");
        await verifyNestedTokenStore(nestedFrame);
    });
});
