import puppeteer, {
    Browser,
    Page,
    BrowserContext,
    Frame,
    Target,
} from "puppeteer";
import type { IPublicClientApplication } from "@azure/msal-browser";
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
const HOST_ORIGIN = `https://127.0.0.1:${HOST_PORT}`;
const APP_ORIGIN = "https://localhost:3001";

declare global {
    interface Window {
        pca: IPublicClientApplication;
    }
}

type RelayRequest =
    | { method: "GET"; url: string }
    | { method: "POST"; action: string; fields: Record<string, string> };

async function getRelayRequest(relay: Page): Promise<RelayRequest> {
    const raw = await relay.evaluate(() =>
        new URLSearchParams(window.location.hash.slice(1)).get("req")
    );
    if (!raw) {
        throw new Error("The relay did not receive a request");
    }
    return JSON.parse(raw);
}

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
    const existingTargets = new Set(context.targets());
    return context
        .waitForTarget(
            (target: Target) => {
                if (existingTargets.has(target) || target.type() !== "page") {
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
): Promise<{ relayedMethod: string; routingSlice: string | null }> {
    const relayPromise = waitForPage(context, "/relay");
    const signInButton = await frame.waitForSelector("#signIn:not([disabled])");
    await signInButton?.click();
    const relay = await relayPromise;
    await relay.bringToFront();
    await screenshot.takeScreenshot(relay, "Relay popup opened");

    // Capture the relayed /authorize request shape before runPopupRelay scrubs
    // it from the relay page's hash on Continue.
    const request = await getRelayRequest(relay);
    const relayedMethod = request.method;
    const parameters = new URL(
        request.method === "GET" ? request.url : request.action
    ).searchParams;
    if (request.method === "POST") {
        for (const [name, value] of Object.entries(request.fields)) {
            parameters.append(name, value);
        }
    }
    expect(parameters.getAll("pocd")).toEqual(["1"]);

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
    return { relayedMethod, routingSlice: parameters.get("dc") };
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
            ignoreDefaultArgs: ["--no-sandbox", "--disable-setuid-sandbox"],
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

    it("serves the redirect bridge without caching", async () => {
        const response = await page.goto(`${APP_ORIGIN}/redirect`);
        expect(response?.headers()["cache-control"]).toBe("no-store");
    });

    it("keeps sign-in disabled until the app initializes", async () => {
        await page.setJavaScriptEnabled(false);
        await page.goto(APP_ORIGIN);
        expect(
            await page.$eval("#signIn", (button) =>
                button.hasAttribute("disabled")
            )
        ).toBe(true);
        await page.setJavaScriptEnabled(true);
        await page.reload();
        await page.waitForSelector("#signIn:not([disabled])");
    });

    it("partitions BroadcastChannel between the embedded and top-level app", async () => {
        await page.goto(HOST_ORIGIN);
        const frame = await getEmbeddedFrame(page);
        await frame.waitForSelector("#signIn:not([disabled])");
        expect(
            await page.$eval("#embedded-iframe", (iframe) =>
                iframe.getAttribute("title")
            )
        ).toBe("Trusted authentication app");
        expect(new URL(page.url()).hostname).toBe("127.0.0.1");
        expect(new URL(frame.url()).hostname).toBe("localhost");
        const name = `relay-partition-${Date.now()}`;
        const probe = await frame.evaluateHandle((channelName) => {
            const state = {
                channel: new BroadcastChannel(channelName),
                received: false,
            };
            state.channel.onmessage = () => {
                state.received = true;
            };
            return state;
        }, name);
        const topLevel = await context.newPage();
        try {
            await topLevel.goto(APP_ORIGIN);
            // A same-partition control must receive the message; the embedded
            // app with the same origin but a different top-level site must not.
            await topLevel.evaluate(
                (channelName) =>
                    new Promise<void>((resolve, reject) => {
                        const receiver = new BroadcastChannel(channelName);
                        const sender = new BroadcastChannel(channelName);
                        const timeout = setTimeout(() => {
                            receiver.close();
                            sender.close();
                            reject(
                                new Error(
                                    "BroadcastChannel control did not receive the message"
                                )
                            );
                        }, 5000);
                        receiver.onmessage = () => {
                            clearTimeout(timeout);
                            receiver.close();
                            sender.close();
                            resolve();
                        };
                        sender.postMessage("partition-probe");
                    }),
                name
            );
            await frame.evaluate(
                () => new Promise((resolve) => setTimeout(resolve, 500))
            );
            expect(await probe.evaluate((state) => state.received)).toBe(false);
        } finally {
            await probe.evaluate((state) => state.channel.close());
            await probe.dispose();
            await topLevel.close();
        }
    });

    // Each variant drives a different /authorize request shape through the same
    // relay: a GET navigation vs a POST form. The relay, redirect bridge, and
    // redirect page are method-agnostic.
    it.each([
        ["GET", "httpMethod=GET", "GET"],
        ["POST", "httpMethod=POST", "POST"],
        // ["EAR", "ear=true", "POST"],
    ])(
        "signs in and preserves the request configuration on interactive fallback (%s)",
        async (label, query, expectedMethod) => {
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/signIn-${label}`
            );

            await page.goto(`${HOST_ORIGIN}/?${query}`);
            await screenshot.takeScreenshot(page, "Host page loaded");

            const frame = await getEmbeddedFrame(page);
            await frame.waitForSelector("#not-authenticated");

            const { relayedMethod, routingSlice } = await signInViaRelay(
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

            await frame.evaluate(() => {
                const acquireTokenSilent = window.pca.acquireTokenSilent.bind(
                    window.pca
                );
                window.pca.acquireTokenSilent = (request) =>
                    acquireTokenSilent({ ...request, forceRefresh: true });
                const fetch = window.fetch.bind(window);
                window.fetch = async (input, init) => {
                    const url = new URL(
                        input instanceof Request ? input.url : String(input)
                    );
                    const body = new URLSearchParams(
                        typeof init?.body === "string" ? init.body : ""
                    );
                    if (
                        url.pathname.endsWith("/token") &&
                        body.get("grant_type") === "refresh_token"
                    ) {
                        return new Response(
                            JSON.stringify({
                                error: "interaction_required",
                                error_description:
                                    "Interactive sign-in required",
                            }),
                            {
                                status: 400,
                                headers: { "Content-Type": "application/json" },
                            }
                        );
                    }
                    return fetch(input, init);
                };
            });
            const fallbackPromise = waitForPage(context, "/relay");
            await frame.click("#acquireTokenSilent");
            const fallback = await fallbackPromise;
            const fallbackRequest = await getRelayRequest(fallback);
            expect(fallbackRequest.method).toBe(expectedMethod);
            expect(routingSlice).toBeTruthy();
            expect(
                new URL(
                    fallbackRequest.method === "GET"
                        ? fallbackRequest.url
                        : fallbackRequest.action
                ).searchParams.get("dc")
            ).toBe(routingSlice);
            await fallback.close();
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
        await frame.waitForSelector("#token-info", { visible: true });
        const json = await frame.$eval(
            "#token-response",
            (el) => el.textContent || ""
        );
        expect(JSON.parse(json).fromCache).toBe(true);
        await screenshot.takeScreenshot(page, "Silent token acquired");
    });

    it("relays logout from a cross-site iframe and clears accounts and tokens", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/logout`
        );
        await page.goto(HOST_ORIGIN);
        const frame = await getEmbeddedFrame(page);
        await signInViaRelay(
            page,
            context,
            frame,
            username,
            accountPwd,
            screenshot
        );
        expect(
            await frame.evaluate(() => window.pca.getAllAccounts().length)
        ).toBe(1);

        const relayPromise = waitForPage(context, "/relay");
        await frame.click("#signOut");
        const relay = await relayPromise;
        const request = await getRelayRequest(relay);
        expect(request.method).toBe("GET");
        if (request.method !== "GET") {
            throw new Error("Logout must carry an end-session URL");
        }
        const logout = new URL(request.url);
        expect(logout.pathname).toMatch(/\/logout$/);
        expect(logout.searchParams.getAll("pocd")).toEqual(["1"]);
        expect(logout.searchParams.get("post_logout_redirect_uri")).toBe(
            `${APP_ORIGIN}/redirect`
        );
        await relay.click("#continue");
        await frame.waitForSelector("#not-authenticated", { visible: true });
        expect(
            await frame.$eval("#status-text", (element) => element.textContent)
        ).toBe("Signed out.");
        expect(await frame.evaluate(() => window.pca.getAllAccounts())).toEqual(
            []
        );
        expect(
            await frame.evaluate(() =>
                Object.keys(localStorage).filter((key) =>
                    /idtoken|accesstoken|refreshtoken/.test(key)
                )
            )
        ).toEqual([]);
    });
});
