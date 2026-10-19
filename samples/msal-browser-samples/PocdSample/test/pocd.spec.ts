import puppeteer, {
    Browser,
    BrowserContext,
    HTTPResponse,
    Page,
    Target,
} from "puppeteer";
import type {
    IPublicClientApplication,
    PopupRequest,
} from "@azure/msal-browser";
import {
    AppTypes,
    AzureEnvironments,
    BrowserCacheUtils,
    enterCredentials,
    LabClient,
    Screenshot,
    setupCredentials,
} from "e2e-test-utils";

const HOST_ORIGIN = "https://localhost:3000";
const APP_ORIGIN = "https://localhost:3001";
const ESTS_TEST_SLICE =
    process.env.VITE_ESTS_TEST_SLICE || "ESTS-PUB-SCUS-FD000-TEST3-100";
const SCREENSHOT_FOLDER = `${__dirname}/screenshots/pocd`;

type PopupOutcome = {
    status: "success" | "error";
    accountCount: number;
    hasAccessToken: boolean;
    username?: string;
    errorCode?: string;
};

declare global {
    interface Window {
        pca: IPublicClientApplication;
        __pocdOutcome?: PopupOutcome;
    }
}

type PopupCapture = {
    popup: Page;
    firstResponse: HTTPResponse;
    responses: HTTPResponse[];
};

const scenarios = [
    { name: "trusted top-level app", untrustedOpener: false, pocd: "1" },
    { name: "untrusted opener", untrustedOpener: true, pocd: null },
    {
        name: "untrusted opener with explicit pocd=0",
        untrustedOpener: true,
        pocd: "0",
    },
];

async function openApp(
    context: BrowserContext,
    untrustedOpener: boolean
): Promise<Page> {
    let app: Page;
    if (untrustedOpener) {
        const host = await context.newPage();
        await host.goto(HOST_ORIGIN);
        const targetPromise = context.waitForTarget(
            (target) =>
                target.type() === "page" && target.opener() === host.target(),
            { timeout: 30000 }
        );
        await host.click("#open-with-opener");
        const target = await targetPromise;
        const popup = await target.page();
        if (!popup) {
            throw new Error("The untrusted host did not open the app");
        }
        app = popup;
    } else {
        app = await context.newPage();
        await app.goto(APP_ORIGIN);
    }

    await app.waitForFunction(() => Boolean(window.pca));
    await app.evaluate(() => window.pca.initialize());
    expect(await app.evaluate(() => window.opener !== null)).toBe(
        untrustedOpener
    );
    return app;
}

async function startPopup(
    app: Page,
    context: BrowserContext,
    request: PopupRequest
): Promise<PopupCapture> {
    const existingTargets = new Set(context.targets());
    const matchesEndpoint = (response: HTTPResponse): boolean => {
        const url = new URL(response.url());
        return (
            response.request().isNavigationRequest() &&
            url.origin === "https://login.microsoftonline.com" &&
            url.pathname.endsWith("/authorize")
        );
    };
    const popupPromise = context
        .waitForTarget(
            (target) =>
                !existingTargets.has(target) &&
                target.type() === "page" &&
                target.opener() === app.target(),
            { timeout: 30000 }
        )
        .then(async (target) => {
            const popup = await target.page();
            if (!popup) {
                throw new Error("No popup for authorize");
            }
            const responses: HTTPResponse[] = [];
            popup.on("response", (response) => {
                if (response.request().isNavigationRequest()) {
                    responses.push(response);
                }
            });
            const firstResponse = await popup.waitForResponse(matchesEndpoint, {
                timeout: 30000,
            });
            return { popup, firstResponse, responses };
        });

    const [capture] = await Promise.all([
        popupPromise,
        startInteraction(app, request, "authorize"),
    ]);
    return capture;
}

function startInteraction(
    app: Page,
    request: PopupRequest,
    endpoint: "authorize" | "logout"
): Promise<void> {
    return app.evaluate(
        ({ request, endpoint }) => {
            window.__pocdOutcome = undefined;
            const operation =
                endpoint === "logout"
                    ? window.pca.logoutPopup({
                          account: window.pca.getAllAccounts()[0],
                          extraQueryParameters: request.extraQueryParameters,
                      })
                    : window.pca.acquireTokenPopup(request);
            void operation.then(
                (result) => {
                    window.__pocdOutcome = {
                        status: "success",
                        accountCount: window.pca.getAllAccounts().length,
                        hasAccessToken: Boolean(result && result.accessToken),
                        username: result ? result.account?.username : undefined,
                    };
                },
                (error: unknown) => {
                    console.error(`POCD ${endpoint} failed`, error);
                    window.__pocdOutcome = {
                        status: "error",
                        accountCount: window.pca.getAllAccounts().length,
                        hasAccessToken: false,
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
        { request, endpoint }
    );
}

async function expectLogout(
    app: Page,
    context: BrowserContext,
    request: PopupRequest,
    expectedPocd: string | null
): Promise<void> {
    const existingTargets = new Set(context.targets());
    const navigations: URL[] = [];
    const observeNavigation = (target: Target): void => {
        if (
            !existingTargets.has(target) &&
            target.type() === "page" &&
            target.opener() === app.target()
        ) {
            navigations.push(new URL(target.url()));
        }
    };
    // The logout document can redirect before Puppeteer attaches its Page.
    // Target URL changes still record that navigation and the bridge return.
    context.on("targetcreated", observeNavigation);
    context.on("targetchanged", observeNavigation);
    try {
        await startInteraction(app, request, "logout");
        expect(await getOutcome(app)).toMatchObject({
            status: "success",
            accountCount: 0,
            hasAccessToken: false,
        });
        const logout = navigations.find(
            (url) =>
                url.origin === "https://login.microsoftonline.com" &&
                url.pathname.endsWith("/logout")
        );
        if (!logout) {
            throw new Error("The logout popup never navigated to ESTS");
        }
        expectParameters(logout.searchParams, expectedPocd);
        expect(
            navigations.some(
                (url) =>
                    url.origin === APP_ORIGIN && url.pathname === "/redirect"
            )
        ).toBe(true);
    } finally {
        context.off("targetcreated", observeNavigation);
        context.off("targetchanged", observeNavigation);
    }
}

function expectRequest(
    response: HTTPResponse,
    expectedPocd: string | null,
    expectedMethod: string
): void {
    const request = response.request();
    expect(request.method()).toBe(expectedMethod);
    const parameters = new URL(request.url()).searchParams;
    if (expectedMethod === "POST") {
        for (const [key, value] of new URLSearchParams(request.postData())) {
            parameters.append(key, value);
        }
    }
    expectParameters(parameters, expectedPocd);
    expect(parameters.get("client_id")).toBe(
        "0845a021-afdf-4126-abdd-099c5e6948e1"
    );
    expect(response.headers()["x-ms-ests-server"]).toMatch(/TestSlice/i);
}

function expectParameters(
    parameters: URLSearchParams,
    expectedPocd: string | null
): void {
    expect(parameters.getAll("pocd")).toEqual(
        expectedPocd === null ? [] : [expectedPocd]
    );
    expect(parameters.get("dc")).toBe(ESTS_TEST_SLICE);
}

async function getOutcome(app: Page): Promise<PopupOutcome> {
    await app.waitForFunction(() => window.__pocdOutcome !== undefined, {
        timeout: 30000,
    });
    const outcome = await app.evaluate(() => window.__pocdOutcome);
    if (!outcome) {
        throw new Error("The popup interaction did not report an outcome");
    }
    return outcome;
}

describe("Popup origin check (pocd) against the ESTS test slice", () => {
    let browser: Browser;
    let context: BrowserContext;
    let credentials: [string, string] | undefined;

    async function getCredentials(): Promise<[string, string]> {
        if (!credentials) {
            const labClient = new LabClient();
            const environments = await labClient.getVarsByCloudEnvironment({
                azureEnvironment: AzureEnvironments.CLOUD,
                appType: AppTypes.CLOUD,
            });
            credentials = await setupCredentials(environments[0], labClient);
        }
        return credentials;
    }

    beforeAll(async () => {
        browser = await puppeteer.launch({ acceptInsecureCerts: true });
    });

    beforeEach(async () => {
        context = await browser.createBrowserContext();
    });

    afterEach(async () => {
        await context.close();
    });

    afterAll(async () => {
        await browser.close();
    });

    it("supports POST sign-in, sign-out, and rejection from the sample UI", async () => {
        const app = await openApp(context, false);
        await app.waitForSelector("#sign-in:not([disabled])");
        await app.select("#http-method", "POST");
        const popupPromise = context
            .waitForTarget(
                (target) =>
                    target.type() === "page" &&
                    target.opener() === app.target(),
                { timeout: 30000 }
            )
            .then((target) => target.page());
        await app.click("#sign-in");
        const popup = await popupPromise;
        if (!popup) {
            throw new Error("The sample UI did not open an auth popup");
        }
        const response = await popup.waitForResponse(
            (candidate) =>
                candidate.request().isNavigationRequest() &&
                new URL(candidate.url()).pathname.endsWith("/authorize"),
            { timeout: 30000 }
        );
        expectRequest(response, "1", "POST");
        const [username, password] = await getCredentials();
        await enterCredentials(
            popup,
            new Screenshot(`${SCREENSHOT_FOLDER}/sample-ui`),
            username,
            password
        );
        await app.waitForSelector("#sign-out:not([disabled])");
        expect(
            await app.$eval("#output", (element) =>
                JSON.parse(element.textContent || "")
            )
        ).toMatchObject({ username, hasAccessToken: true });
        await app.click("#sign-out");
        await app.waitForFunction(() =>
            document
                .getElementById("output")
                ?.textContent?.startsWith("Signed out.")
        );
        await app.click("#prompt-none");
        await app.waitForFunction(() =>
            document
                .getElementById("output")
                ?.textContent?.startsWith("login_required:")
        );
        expect(
            await new BrowserCacheUtils(app, "localStorage").getTokens()
        ).toEqual({
            idTokens: [],
            accessTokens: [],
            refreshTokens: [],
        });
    });

    describe.each(scenarios)("$name", ({ name, untrustedOpener, pocd }) => {
        it.each(["GET", "POST"] as const)(
            "preserves the expected isolation and completes %s sign-in and logout",
            async (httpMethod) => {
                const app = await openApp(context, untrustedOpener);
                const request: PopupRequest = {
                    scopes: ["User.Read"],
                    httpMethod,
                    extraQueryParameters: {
                        dc: ESTS_TEST_SLICE,
                        ...(pocd === "0" ? { pocd: "0" } : {}),
                    },
                };
                const capture = await startPopup(app, context, request);
                expectRequest(capture.firstResponse, pocd, httpMethod);
                await capture.popup.waitForSelector("input[name=loginfmt]", {
                    timeout: 30000,
                });

                // The first /authorize response can be a redirect shim. Check
                // the committed sign-in document, not that intermediate page.
                const documents = capture.responses.filter(
                    (response) =>
                        response.status() === 200 &&
                        new URL(response.url()).pathname.endsWith("/authorize")
                );
                const document = documents[documents.length - 1];
                expect(document).toBeDefined();
                expect(document.headers()["x-ms-ests-server"]).toMatch(
                    /TestSlice/i
                );
                const coop = document.headers()["cross-origin-opener-policy"];
                if (untrustedOpener && !coop) {
                    throw new Error(
                        `ESTS slice ${ESTS_TEST_SLICE} did not enforce COOP for ` +
                            `pocd=${
                                pocd ?? "(omitted)"
                            }. Report-only policy: ` +
                            `${
                                document.headers()[
                                    "cross-origin-opener-policy-report-only"
                                ] ?? "(absent)"
                            }. ` +
                            "Verify the app is not COOP-excluded and this test slice has enforcing pocd behavior."
                    );
                }
                expect({
                    slice: ESTS_TEST_SLICE,
                    pocd,
                    coop: coop?.split(";")[0].trim() ?? null,
                    reportOnly:
                        document.headers()[
                            "cross-origin-opener-policy-report-only"
                        ] ?? null,
                }).toMatchObject({
                    coop: untrustedOpener ? "same-origin" : null,
                });
                expect(
                    await capture.popup.evaluate(() => window.opener === null)
                ).toBe(untrustedOpener);

                const [username, password] = await getCredentials();
                const screenshot = new Screenshot(
                    `${SCREENSHOT_FOLDER}/${name}-${httpMethod}`
                );
                await enterCredentials(
                    capture.popup,
                    screenshot,
                    username,
                    password
                );
                expect(await getOutcome(app)).toMatchObject({
                    status: "success",
                    accountCount: 1,
                    hasAccessToken: true,
                    username,
                });
                const cache = new BrowserCacheUtils(app, "localStorage");
                await cache.verifyTokenStore({ scopes: ["User.Read"] });

                await expectLogout(app, context, request, pocd);
                expect(await cache.getTokens()).toEqual({
                    idTokens: [],
                    accessTokens: [],
                    refreshTokens: [],
                });
            }
        );

        it.each(["GET", "POST"] as const)(
            "returns the %s prompt=none rejection without caching tokens",
            async (httpMethod) => {
                const app = await openApp(context, untrustedOpener);
                const capture = await startPopup(app, context, {
                    scopes: ["User.Read"],
                    prompt: "none",
                    httpMethod,
                    extraQueryParameters: {
                        dc: ESTS_TEST_SLICE,
                        ...(pocd === "0" ? { pocd: "0" } : {}),
                    },
                });
                expectRequest(capture.firstResponse, pocd, httpMethod);
                expect(await getOutcome(app)).toMatchObject({
                    status: "error",
                    errorCode: "login_required",
                    accountCount: 0,
                    hasAccessToken: false,
                });
                expect(
                    await new BrowserCacheUtils(app, "localStorage").getTokens()
                ).toEqual({
                    idTokens: [],
                    accessTokens: [],
                    refreshTokens: [],
                });
            }
        );
    });
});
