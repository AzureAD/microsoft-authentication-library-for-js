/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { createServer, Server } from "http";
import { AddressInfo } from "net";
import * as path from "path";
import puppeteer, { Browser, BrowserContext, Page } from "puppeteer";
import type {
    Configuration,
    IPublicClientApplication,
    PopupRequest,
} from "@azure/msal-browser";

const CLIENT_ID = "0845a021-afdf-4126-abdd-099c5e6948e1";
const AUTHORITY = "https://popup-lifecycle.invalid/tenant";
const INTERACTION_KEY = "msal.interaction.status";
const PASSIVE_CALLBACK = "/__popup-lifecycle__/callback";
const LANDING_PAGE = "/__popup-lifecycle__/signed-out";
const SDK_BUNDLE = path.resolve(
    __dirname,
    "../../lib/msal-browser/lib/msal-browser.js"
);

type Outcome = { status: "success" | "error"; errorCode?: string };
type Operation = "signin" | "logout";
type Metadata = {
    authorization_endpoint: string;
    token_endpoint: string;
    end_session_endpoint: string;
    issuer: string;
    jwks_uri: string;
};
type LifecycleWindow = Window &
    typeof globalThis & {
        msal: typeof import("@azure/msal-browser");
        __popupLifecycle: {
            pca: IPublicClientApplication;
            metadata: Metadata;
            outcomes: Record<string, Outcome | undefined>;
            monitorCount: number;
            monitorStarts: Record<string, number>;
            discoveries: Array<(response: Response) => void>;
            legacyPolling: boolean;
        };
    };

async function createIdentityFixture(legacyPolling: boolean): Promise<{
    server: Server;
    origin: string;
}> {
    const callbacks = new Map<string, string>();
    const server = createServer((request, response) => {
        const url = new URL(request.url || "/", "http://localhost");
        const operation = url.searchParams.get("e2eOperation");
        if (
            (url.pathname === "/authorize" || url.pathname === "/logout") &&
            operation
        ) {
            const redirect = url.searchParams.get(
                url.pathname === "/logout"
                    ? "post_logout_redirect_uri"
                    : "redirect_uri"
            );
            const state = url.searchParams.get("state");
            if (!redirect || !state) {
                response.writeHead(400).end("Missing callback or state");
                return;
            }
            const callback = new URL(redirect);
            const parameters = new URLSearchParams({ state });
            if (url.pathname === "/authorize") {
                parameters.set("error", "login_required");
                parameters.set("error_description", "Controlled E2E response");
            }
            callback.hash = parameters.toString();
            callbacks.set(operation, callback.href);
            response.writeHead(200, {
                "Content-Type": "text/html",
                "Cache-Control": "no-store",
                ...(!legacyPolling && {
                    "Cross-Origin-Opener-Policy": "same-origin",
                }),
            });
            response.end(
                "<!doctype html><title>Controlled identity provider</title>" +
                    '<p id="ready">Waiting for the test to complete this request.</p>' +
                    `<a id="complete" href="/complete?e2eOperation=${encodeURIComponent(
                        operation
                    )}">Complete</a>`
            );
        } else if (url.pathname === "/complete" && operation) {
            const callback = callbacks.get(operation);
            if (!callback) {
                response.writeHead(404).end("Unknown operation");
                return;
            }
            response.writeHead(302, {
                Location: callback,
                "Cache-Control": "no-store",
            });
            response.end();
        } else {
            response.writeHead(404).end("Unexpected identity request");
        }
    });
    await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address() as AddressInfo;
    return { server, origin: `http://127.0.0.1:${address.port}` };
}

async function interceptTestPages(
    page: Page,
    appOrigin: string
): Promise<void> {
    await page.setRequestInterception(true);
    page.on("request", (request) => {
        const url = new URL(request.url());
        if (
            ["http:", "https:"].includes(url.protocol) &&
            !["localhost", "127.0.0.1"].includes(url.hostname)
        ) {
            void request.abort("blockedbyclient");
            return;
        }
        if (
            url.origin === appOrigin &&
            [PASSIVE_CALLBACK, LANDING_PAGE].includes(url.pathname)
        ) {
            void request.respond({
                status: 200,
                contentType: "text/html",
                headers: { "Cache-Control": "no-store" },
                body: '<!doctype html><title>Popup lifecycle callback</title><p id="signed-out">Signed out</p>',
            });
        } else {
            void request.continue();
        }
    });
}

async function initializeApp(
    page: Page,
    appOrigin: string,
    identityOrigin: string,
    legacyPolling: boolean,
    options: { gatedDiscovery?: boolean; ear?: boolean } = {}
): Promise<void> {
    await page.goto(appOrigin);
    await page.waitForFunction(() => "pca" in window);
    await page.addScriptTag({ path: SDK_BUNDLE });
    await interceptTestPages(page, appOrigin);
    await page.evaluate(
        async ({
            appOrigin,
            identityOrigin,
            legacyPolling,
            options,
            clientId,
            authority,
        }) => {
            const app = window as LifecycleWindow;
            const metadata: Metadata = {
                authorization_endpoint: `${identityOrigin}/authorize`,
                token_endpoint: `${identityOrigin}/token`,
                end_session_endpoint: `${identityOrigin}/logout`,
                issuer: `${authority}/v2.0`,
                jwks_uri: `${identityOrigin}/keys`,
            };
            const configuration: Configuration = {
                auth: {
                    clientId,
                    authority,
                    knownAuthorities: [new URL(authority).hostname],
                    redirectUri: `${appOrigin}${
                        legacyPolling
                            ? "/__popup-lifecycle__/callback"
                            : "/redirect"
                    }`,
                    postLogoutRedirectUri: `${appOrigin}${
                        legacyPolling
                            ? "/__popup-lifecycle__/callback"
                            : "/redirect"
                    }`,
                    ...(options.gatedDiscovery
                        ? {}
                        : { authorityMetadata: JSON.stringify(metadata) }),
                },
                cache: {
                    cacheLocation: app.msal.BrowserCacheLocation.SessionStorage,
                },
                system: {
                    allowPlatformBroker: false,
                    enableLegacyPolling: legacyPolling,
                    protocolMode: options.ear
                        ? app.msal.ProtocolMode.EAR
                        : app.msal.ProtocolMode.AAD,
                },
            };
            const pca = new app.msal.PublicClientApplication(configuration);
            app.__popupLifecycle = {
                pca,
                metadata,
                outcomes: {},
                monitorCount: 0,
                monitorStarts: {},
                discoveries: [],
                legacyPolling,
            };
            if (options.gatedDiscovery) {
                const fetch = app.fetch.bind(app);
                app.fetch = (input, init) => {
                    const url =
                        input instanceof Request ? input.url : String(input);
                    if (url.includes("/.well-known/openid-configuration")) {
                        return new Promise<Response>((resolve) => {
                            app.__popupLifecycle.discoveries.push(resolve);
                        });
                    }
                    return fetch(input, init);
                };
            }
            await pca.initialize();

            // Registration completes in the same task as these real browser
            // calls. Puppeteer's next evaluation observes the completed monitor.
            if (legacyPolling) {
                const browserWindow: Window = window;
                const setInterval =
                    browserWindow.setInterval.bind(browserWindow);
                browserWindow.setInterval = (handler, timeout, ...args) => {
                    const timer = setInterval(handler, timeout, ...args);
                    app.__popupLifecycle.monitorCount++;
                    return timer;
                };
            } else {
                const BroadcastChannel = app.BroadcastChannel;
                app.BroadcastChannel = class extends BroadcastChannel {
                    constructor(name: string) {
                        super(name);
                        app.__popupLifecycle.monitorCount++;
                    }
                };
            }
        },
        {
            appOrigin,
            identityOrigin,
            legacyPolling,
            options,
            clientId: CLIENT_ID,
            authority: AUTHORITY,
        }
    );
}

async function startOperation(
    page: Page,
    id: string,
    operation: Operation,
    request: Partial<PopupRequest> & { mainWindowRedirectUri?: string } = {}
): Promise<void> {
    await page.evaluate(
        ({ id, operation, request }) => {
            const harness = (window as LifecycleWindow).__popupLifecycle;
            delete harness.outcomes[id];
            harness.monitorStarts[id] = harness.monitorCount;
            const parameters = {
                ...request,
                extraQueryParameters: { e2eOperation: id },
            };
            const pending =
                operation === "logout"
                    ? harness.pca.logoutPopup(parameters)
                    : harness.pca.acquireTokenPopup({
                          scopes: ["User.Read"],
                          ...parameters,
                      });
            void pending.then(
                () => {
                    harness.outcomes[id] = { status: "success" };
                },
                (error: unknown) => {
                    harness.outcomes[id] = {
                        status: "error",
                        errorCode:
                            error &&
                            typeof error === "object" &&
                            "errorCode" in error &&
                            typeof error.errorCode === "string"
                                ? error.errorCode
                                : String(error),
                    };
                }
            );
        },
        { id, operation, request }
    );
}

async function openOperation(
    page: Page,
    context: BrowserContext,
    appOrigin: string,
    id: string,
    operation: Operation,
    request: Partial<PopupRequest> & { mainWindowRedirectUri?: string } = {}
): Promise<Page> {
    const existingTargets = new Set(context.targets());
    const target = context.waitForTarget(
        (target) =>
            !existingTargets.has(target) &&
            target.type() === "page" &&
            target.opener() === page.target(),
        { timeout: 15000 }
    );
    await startOperation(page, id, operation, request);
    const popup = await (await target).page();
    if (!popup) {
        throw new Error(`No popup for ${id}`);
    }
    await interceptTestPages(popup, appOrigin);
    return popup;
}

async function waitForMonitor(
    page: Page,
    popup: Page,
    id: string
): Promise<void> {
    await popup.waitForSelector("#ready");
    await page.waitForFunction(
        (id) => {
            const harness = (window as LifecycleWindow).__popupLifecycle;
            return harness.monitorCount > harness.monitorStarts[id];
        },
        { timeout: 15000 },
        id
    );
    expect(await popup.evaluate(() => window.opener === null)).toBe(
        await page.evaluate(
            () => !(window as LifecycleWindow).__popupLifecycle.legacyPolling
        )
    );
}

function waitForClose(popup: Page): Promise<void> {
    if (popup.isClosed()) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        const closed = () => {
            clearTimeout(timeout);
            resolve();
        };
        const timeout = setTimeout(() => {
            popup.off("close", closed);
            reject(new Error("The owned popup did not close"));
        }, 15000);
        popup.once("close", closed);
    });
}

async function outcome(page: Page, id: string): Promise<Outcome> {
    await page.waitForFunction(
        (id) =>
            (window as LifecycleWindow).__popupLifecycle.outcomes[id] !==
            undefined,
        { timeout: 15000 },
        id
    );
    return page.evaluate(
        (id) => (window as LifecycleWindow).__popupLifecycle.outcomes[id]!,
        id
    );
}

async function finishSignIn(
    page: Page,
    popup: Page,
    id: string
): Promise<void> {
    await popup.click("#complete");
    expect(await outcome(page, id)).toEqual({
        status: "error",
        errorCode: "login_required",
    });
}

async function expectBlocked(page: Page): Promise<void> {
    await startOperation(page, "blocked", "signin");
    expect(await outcome(page, "blocked")).toEqual({
        status: "error",
        errorCode: "interaction_in_progress",
    });
}

export function describePopupLifecycle(
    appOrigin: string,
    legacyPolling: boolean
): void {
    describe(`Popup lifecycle (${
        legacyPolling ? "legacy polling" : "bridge with COOP"
    })`, () => {
        let browser: Browser;
        let context: BrowserContext;
        let page: Page;
        let fixture: Awaited<ReturnType<typeof createIdentityFixture>>;

        beforeAll(async () => {
            browser = await puppeteer.launch({ acceptInsecureCerts: true });
        });

        beforeEach(async () => {
            context = await browser.createBrowserContext();
            page = await context.newPage();
            page.setDefaultTimeout(15000);
            fixture = await createIdentityFixture(legacyPolling);
        });

        afterEach(async () => {
            await context.close();
            fixture.server.closeAllConnections();
            await new Promise<void>((resolve, reject) => {
                fixture.server.close((error) =>
                    error ? reject(error) : resolve()
                );
            });
        });

        afterAll(async () => {
            await browser.close();
        });

        it("keeps the replacement popup and lock after cancelling an active sign-in", async () => {
            await initializeApp(page, appOrigin, fixture.origin, legacyPolling);
            const first = await openOperation(
                page,
                context,
                appOrigin,
                "first",
                "signin"
            );
            await waitForMonitor(page, first, "first");

            const replacement = await openOperation(
                page,
                context,
                appOrigin,
                "replacement",
                "signin",
                { overrideInteractionInProgress: true }
            );
            await waitForMonitor(page, replacement, "replacement");
            expect(await outcome(page, "first")).toEqual({
                status: "error",
                errorCode: "interaction_in_progress_cancelled",
            });

            await expectBlocked(page);
            expect(replacement.isClosed()).toBe(false);
            await finishSignIn(page, replacement, "replacement");
            expect(
                await page.evaluate(
                    (key) => sessionStorage.getItem(key),
                    INTERACTION_KEY
                )
            ).toBeNull();
        });

        it("cancels monitored all-account logout without navigating or releasing the replacement lock", async () => {
            await initializeApp(page, appOrigin, fixture.origin, legacyPolling);
            const logout = await openOperation(
                page,
                context,
                appOrigin,
                "logout",
                "logout",
                { mainWindowRedirectUri: `${appOrigin}${LANDING_PAGE}` }
            );
            await waitForMonitor(page, logout, "logout");
            await expectBlocked(page);

            const replacement = await openOperation(
                page,
                context,
                appOrigin,
                "replacement",
                "signin",
                { overrideInteractionInProgress: true }
            );
            await waitForMonitor(page, replacement, "replacement");
            expect(await outcome(page, "logout")).toEqual({
                status: "error",
                errorCode: "interaction_in_progress_cancelled",
            });
            expect(new URL(page.url()).pathname).toBe("/");
            await expectBlocked(page);
            expect(replacement.isClosed()).toBe(false);
            await finishSignIn(page, replacement, "replacement");
        });

        it("does not let failed setup close a replacement with the same correlation ID", async () => {
            await initializeApp(
                page,
                appOrigin,
                fixture.origin,
                legacyPolling,
                {
                    gatedDiscovery: true,
                }
            );
            const request = {
                correlationId: "11111111-1111-4111-8111-111111111111",
            };
            const first = await openOperation(
                page,
                context,
                appOrigin,
                "first",
                "signin",
                request
            );
            await page.waitForFunction(
                () =>
                    (window as LifecycleWindow).__popupLifecycle.discoveries
                        .length === 1
            );
            const replacement = await openOperation(
                page,
                context,
                appOrigin,
                "replacement",
                "signin",
                { ...request, overrideInteractionInProgress: true }
            );
            await page.waitForFunction(
                () =>
                    (window as LifecycleWindow).__popupLifecycle.discoveries
                        .length === 2
            );

            const firstClosed = waitForClose(first);
            await page.evaluate(() =>
                (window as LifecycleWindow).__popupLifecycle.discoveries[0](
                    new Response("{}", { status: 500 })
                )
            );
            expect(await outcome(page, "first")).toMatchObject({
                status: "error",
            });
            await firstClosed;
            expect(replacement.isClosed()).toBe(false);
            expect(first.target()).not.toBe(replacement.target());
            await expectBlocked(page);

            await page.evaluate(() => {
                const harness = (window as LifecycleWindow).__popupLifecycle;
                harness.discoveries[1](
                    new Response(JSON.stringify(harness.metadata), {
                        status: 200,
                        headers: { "Content-Type": "application/json" },
                    })
                );
            });
            await waitForMonitor(page, replacement, "replacement");
            await finishSignIn(page, replacement, "replacement");
        });

        it("releases the logout marker before real main-window navigation", async () => {
            await initializeApp(page, appOrigin, fixture.origin, legacyPolling);
            const logout = await openOperation(
                page,
                context,
                appOrigin,
                "logout",
                "logout",
                { mainWindowRedirectUri: `${appOrigin}${LANDING_PAGE}` }
            );
            await waitForMonitor(page, logout, "logout");
            await expectBlocked(page);
            const navigation = page.waitForNavigation({ waitUntil: "load" });

            await logout.click("#complete");
            await navigation;

            expect(new URL(page.url()).pathname).toBe(LANDING_PAGE);
            await page.waitForSelector("#signed-out");
            expect(
                await page.evaluate(
                    (key) => sessionStorage.getItem(key),
                    INTERACTION_KEY
                )
            ).toBeNull();
        });

        it("closes the pre-opened EAR popup and releases the lock when discovery fails", async () => {
            await initializeApp(
                page,
                appOrigin,
                fixture.origin,
                legacyPolling,
                {
                    gatedDiscovery: true,
                    ear: true,
                }
            );
            const popup = await openOperation(
                page,
                context,
                appOrigin,
                "ear",
                "signin"
            );
            await page.waitForFunction(
                () =>
                    (window as LifecycleWindow).__popupLifecycle.discoveries
                        .length === 1
            );

            const closed = waitForClose(popup);
            await page.evaluate(() =>
                (window as LifecycleWindow).__popupLifecycle.discoveries[0](
                    new Response("{}", { status: 500 })
                )
            );

            expect(await outcome(page, "ear")).toMatchObject({
                status: "error",
            });
            await closed;
            expect(
                await page.evaluate(
                    (key) => sessionStorage.getItem(key),
                    INTERACTION_KEY
                )
            ).toBeNull();
            const recovery = await openOperation(
                page,
                context,
                appOrigin,
                "recovery",
                "signin"
            );
            await page.waitForFunction(
                () =>
                    (window as LifecycleWindow).__popupLifecycle.discoveries
                        .length === 2
            );
            const recoveryClosed = waitForClose(recovery);
            await page.evaluate(() =>
                (window as LifecycleWindow).__popupLifecycle.discoveries[1](
                    new Response("{}", { status: 500 })
                )
            );
            expect(await outcome(page, "recovery")).toMatchObject({
                status: "error",
            });
            await recoveryClosed;
        });

        if (legacyPolling) {
            it("keeps ordinary popup closure best-effort and releases the logout marker before navigation", async () => {
                await initializeApp(
                    page,
                    appOrigin,
                    fixture.origin,
                    legacyPolling
                );
                const logout = await openOperation(
                    page,
                    context,
                    appOrigin,
                    "logout",
                    "logout",
                    { mainWindowRedirectUri: `${appOrigin}${LANDING_PAGE}` }
                );
                await waitForMonitor(page, logout, "logout");
                const navigation = page.waitForNavigation({
                    waitUntil: "load",
                });

                await logout.close();
                await navigation;

                expect(new URL(page.url()).pathname).toBe(LANDING_PAGE);
                expect(
                    await page.evaluate(
                        (key) => sessionStorage.getItem(key),
                        INTERACTION_KEY
                    )
                ).toBeNull();
            });
        }
    });
}
