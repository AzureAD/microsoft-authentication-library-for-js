import puppeteer, {
    Browser,
    Page,
    BrowserContext,
    Frame,
    Target,
} from "puppeteer";
import {
    Screenshot,
    setupCredentials,
    enterCredentials,
    LabClient,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
} from "e2e-test-utils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/untrusted-top-frame-tests`;
const HOST_PORT = 3000;
const HOST_ORIGIN = `https://localhost:${HOST_PORT}`;

/**
 * Returns the embedded app iframe's Frame object from within the host page.
 */
async function getEmbeddedFrame(page: Page): Promise<Frame> {
    const iframeHandle = await page.waitForSelector("#embedded-iframe");
    const frame = await iframeHandle?.contentFrame();
    if (!frame) {
        throw new Error("Could not find embedded-app iframe");
    }
    return frame;
}

/**
 * Resolves with the page whose URL contains `urlSubstring`. Uses the browser
 * context's target stream so it also catches popups opened by the iframe (which
 * `page.on('popup')` does not reliably surface).
 */
function waitForPage(
    context: BrowserContext,
    urlSubstring: string,
    timeoutMs = 30000
): Promise<Page> {
    return context
        .waitForTarget(
            (target: Target) => {
                if (target.type() !== "page") {
                    return false;
                }
                // Strip query + hash before matching. The relay page carries the
                // IdP authorize URL inside its hash (the `req` payload), so
                // matching the full URL for "login.microsoftonline.com" would
                // wrongly select the relay page instead of the IdP popup it opens.
                const url = target.url().split("#")[0].split("?")[0];
                return url.includes(urlSubstring);
            },
            { timeout: timeoutMs }
        )
        .then(async (target) => {
            const popup = await target.page();
            if (!popup) {
                throw new Error(`No page for target '${urlSubstring}'`);
            }
            return popup;
        });
}

/**
 * Drives the full popup-relay sign-in: click Sign In in the iframe (opens the
 * relay popup), click Continue in the relay (opens the IdP child popup),
 * authenticate, and wait for the iframe to show the signed-in UI (acquireTokenPopup,
 * relayed through the popup-relay page, completed and cached the tokens).
 *
 * Returns the HTTP method of the /authorize request the relay carried ("GET" for
 * the auth-code GET flow, "POST" for the POST and EAR flows) so tests can assert
 * the request shape per flow.
 */
async function signInViaRelay(
    page: Page,
    context: BrowserContext,
    frame: Frame,
    username: string,
    accountPwd: string,
    screenshot: Screenshot
): Promise<{ relayedMethod: string }> {
    const relayPromise = waitForPage(context, "/relay");
    const signInButton = await frame.waitForSelector("#signIn");
    await signInButton?.click();
    const relay = await relayPromise;
    await relay.bringToFront();
    await screenshot.takeScreenshot(relay, "Relay popup opened");

    // Capture the relayed /authorize request shape before runPopupRelay scrubs
    // it from the relay page's hash on Continue.
    const reqRaw = await relay.evaluate(() =>
        new URLSearchParams(window.location.hash.slice(1)).get("req")
    );
    const relayedMethod = reqRaw ? JSON.parse(reqRaw).method : "";

    const idpPromise = waitForPage(context, "login.microsoftonline.com");
    const continueButton = await relay.waitForSelector("#continue");
    await continueButton?.click();
    const idp = await idpPromise;

    await enterCredentials(idp, screenshot, username, accountPwd);

    // Wait for the authenticated UI to actually render. #authenticated is always
    // in the DOM (toggled via display), so wait for it to become *visible* —
    // that only happens once acquireTokenPopup resolves and showAuthenticatedUI
    // runs (which also populates #username-display). Without `visible` the
    // selector resolves immediately and the test races the token exchange.
    await frame.waitForSelector("#authenticated", {
        visible: true,
        timeout: 30000,
    });
    return { relayedMethod };
}

describe("Untrusted Top Frame Sample", () => {
    jest.retryTimes(1);
    let browser: Browser;
    let context: BrowserContext;
    let page: Page;
    let username: string;
    let accountPwd: string;

    beforeAll(async () => {
        // @ts-ignore
        browser = await puppeteer.launch({
            ignoreDefaultArgs: ["--no-sandbox", "–disable-setuid-sandbox"],
            acceptInsecureCerts: true, // accept the self-signed localhost cert
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
        jest.setTimeout(90000);
        context = await browser.createBrowserContext();
        page = await context.newPage();
        page.setDefaultTimeout(10000);
    });

    afterEach(async () => {
        await page.close();
        await context.close();
    });

    afterAll(async () => {
        await browser.close();
    });

    // Each variant drives a different /authorize request shape through the same
    // relay: a GET navigation vs a POST form. The relay, redirect bridge, and
    // redirect page are method-agnostic.
    it.each([
        ["GET", "httpMethod=GET", "GET"],
        ["POST", "httpMethod=POST", "POST"],
        // ["EAR", "ear=true", "POST"],
    ])(
        "signs in through the popup relay (%s)",
        async (label, query, expectedMethod) => {
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/signIn-${label}`
            );

            await page.goto(`${HOST_ORIGIN}/?${query}`);
            await screenshot.takeScreenshot(page, "Host page loaded");

            const frame = await getEmbeddedFrame(page);
            await frame.waitForSelector("#not-authenticated");

            const { relayedMethod } = await signInViaRelay(
                page,
                context,
                frame,
                username,
                accountPwd,
                screenshot
            );
            expect(relayedMethod).toEqual(expectedMethod);

            const displayed = await frame.$eval(
                "#username-display",
                (el) => el.textContent
            );
            expect(displayed).toContain(username);
            await screenshot.takeScreenshot(page, "Embedded app signed in");
        }
    );

    it("acquires a token silently after relay sign-in", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/silentToken`
        );

        await page.goto(HOST_ORIGIN);
        const frame = await getEmbeddedFrame(page);
        await frame.waitForSelector("#not-authenticated");

        await signInViaRelay(
            page,
            context,
            frame,
            username,
            accountPwd,
            screenshot
        );

        // Silent acquisition reads from MSAL's native cache — no relay popup.
        const silentButton = await frame.waitForSelector("#acquireTokenSilent");
        await silentButton?.click();
        await frame.waitForSelector("#token-info");
        const json = await frame.$eval(
            "#token-response",
            (el) => el.textContent || ""
        );
        expect(json).toContain('"fromCache"');
        await screenshot.takeScreenshot(page, "Silent token acquired");
    });
});
