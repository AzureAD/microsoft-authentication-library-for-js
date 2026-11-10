import * as puppeteer from "puppeteer";
import path from "path";
import {
    Screenshot,
    setupCredentials,
    enterCredentials,
    LabClient,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
    BrowserCacheUtils,
} from "e2e-test-utils";
import { switchToVersion } from "./test-helpers";

const SCREENSHOT_BASE_FOLDER_NAME = path.join(
    __dirname,
    "screenshots/dpop-tests"
);
const CLIENT_ID = "0845a021-afdf-4126-abdd-099c5e6948e1";
const AUTHORITY = "https://login.microsoftonline.com/common";
const DPOP_RESOURCE_URI = "https://localhost:45471/WeatherForecast/DPoP";
const GRAPH_RESOURCE_URI = "https://graph.microsoft.com/v1.0/me";
const STALE_DPOP_NONCE = "msal-e2e-intentionally-stale-nonce";
// Temporary, remove when feature is GA
const DPOP_ESTS_DC = "ESTS-PUB-WUS3-FD000-TEST1-100";
const PLAYGROUND_RESPONSE_TIMEOUT_MS = 60000;
const LOGOUT_POPUP_TIMEOUT_MS = 90000;
const DPOP_TEST_TIMEOUT_MS = 150000;
const PLAYGROUND_CONTROL_SELECTORS = [
    "textarea#msalConfig",
    "textarea#tokenRequest",
    "button#applyConfig",
    "button#btnAcquireTokenPopup",
    "button#btnLogoutPopupActiveAccount",
];

jest.setTimeout(DPOP_TEST_TIMEOUT_MS);

type PlaygroundResponse = {
    api: string;
    result?: {
        accessToken?: string;
        dpopProof?: string;
        fromCache?: boolean;
        tokenType?: string;
    };
    response?: {
        accessToken?: string;
        dpopProof?: string;
        tokenType?: string;
    };
    message?: string;
};

type DpopResult = {
    accessToken: string;
    dpopProof: string;
    fromCache?: boolean;
    tokenType: string;
};

type DpopResourceResponse = {
    status: number;
    dpopNonce: string | null;
    wwwAuthenticate: string;
};

async function getPlaygroundPageState(page: puppeteer.Page): Promise<string> {
    const state = await page
        .evaluate((selectors) => {
            return {
                url: window.location.href,
                readyState: document.readyState,
                title: document.title,
                hasPlaygroundContainer: !!document.querySelector(
                    ".playground-container"
                ),
                selectors: selectors.reduce<Record<string, boolean>>(
                    (result, selector) => {
                        result[selector] = !!document.querySelector(selector);
                        return result;
                    },
                    {}
                ),
                responseText:
                    document
                        .getElementById("responseContent")
                        ?.textContent?.slice(0, 1000) || "",
                bodyText: document.body?.innerText?.slice(0, 1000) || "",
            };
        }, PLAYGROUND_CONTROL_SELECTORS)
        .catch((error: Error) => ({
            url: page.url(),
            evaluateError: error.message,
        }));

    return JSON.stringify(state, null, 2);
}

async function waitForPlaygroundControls(
    page: puppeteer.Page,
    timeout = PLAYGROUND_RESPONSE_TIMEOUT_MS
): Promise<void> {
    try {
        await Promise.all(
            PLAYGROUND_CONTROL_SELECTORS.map((selector) =>
                page.locator(selector).setTimeout(timeout).waitHandle()
            )
        );
    } catch {
        throw new Error(
            `Timed out waiting for playground controls: ${await getPlaygroundPageState(
                page
            )}`
        );
    }
}

function createPlaygroundConfig(port: number, redirectPath = "/redirect") {
    return {
        auth: {
            clientId: CLIENT_ID,
            authority: AUTHORITY,
            redirectUri: `http://localhost:${port}${redirectPath}`,
        },
        cache: {
            cacheLocation: "localStorage",
        },
        system: {
            allowNativeBroker: false,
        },
    };
}

function createDpopRequest(
    loginHint?: string,
    resourceRequestUri = DPOP_RESOURCE_URI,
    resourceRequestMethod = "GET"
) {
    return {
        scopes: ["User.Read"],
        ...(loginHint ? { loginHint } : {}),
        authenticationScheme: "DPoP",
        resourceRequestMethod,
        resourceRequestUri,
        extraQueryParameters: {
            dc: DPOP_ESTS_DC,
        },
    };
}

async function populatePlayground(
    page: puppeteer.Page,
    port: number,
    loginHint?: string,
    redirectPath?: string,
    resourceRequestUri?: string,
    resourceRequestMethod?: string
): Promise<void> {
    await waitForPlaygroundControls(page);
    await page.evaluate(
        ({ config, request }) => {
            const configElement = document.getElementById(
                "msalConfig"
            ) as HTMLTextAreaElement | null;
            const requestElement = document.getElementById(
                "tokenRequest"
            ) as HTMLTextAreaElement | null;

            if (!configElement || !requestElement) {
                throw new Error("Playground configuration controls not found");
            }

            configElement.value = JSON.stringify(config, null, 2);
            requestElement.value = JSON.stringify(request, null, 2);
        },
        {
            config: createPlaygroundConfig(port, redirectPath),
            request: createDpopRequest(
                loginHint,
                resourceRequestUri,
                resourceRequestMethod
            ),
        }
    );
}

async function applyPlaygroundConfiguration(
    page: puppeteer.Page
): Promise<void> {
    await page.locator("button#applyConfig").click();
    await page.waitForFunction(() => {
        const responseContent = document.getElementById("responseContent");
        const text = responseContent?.textContent || "";
        return (
            text.includes("MSAL instance created and initialized") ||
            text.includes("Redirect response received")
        );
    });
}

async function loadAndConfigurePlayground(
    page: puppeteer.Page,
    port: number,
    screenshot: Screenshot,
    loginHint?: string,
    redirectPath?: string,
    resourceRequestUri?: string,
    resourceRequestMethod?: string
): Promise<void> {
    await page.goto(`http://localhost:${port}/playground`, {
        timeout: 10000,
    });
    await screenshot.takeScreenshot(page, "Playground loaded");
    await switchToVersion("local", page, screenshot);
    await waitForPlaygroundControls(page);

    await populatePlayground(
        page,
        port,
        loginHint,
        redirectPath,
        resourceRequestUri,
        resourceRequestMethod
    );
    await screenshot.takeScreenshot(page, "DPoP request populated");

    await applyPlaygroundConfiguration(page);
    await screenshot.takeScreenshot(page, "Configuration applied");
}

async function readPlaygroundResponse(
    page: puppeteer.Page,
    apiName: string,
    resultProperty: "result" | "response" | "message" = "result"
): Promise<PlaygroundResponse> {
    try {
        await page.waitForFunction(
            (expectedApiName, expectedResultProperty) => {
                const responseContent =
                    document.getElementById("responseContent");
                const text = responseContent?.textContent || "";

                return (
                    text.includes(`"api": "${expectedApiName}"`) &&
                    (text.includes(`"${expectedResultProperty}"`) ||
                        text.includes('"error"')) &&
                    !text.includes('"status": "Executing..."')
                );
            },
            { timeout: PLAYGROUND_RESPONSE_TIMEOUT_MS },
            apiName,
            resultProperty
        );
    } catch (e) {
        const responseText = await page
            .$eval(
                "div#responseContent",
                (element) => element.textContent || ""
            )
            .catch(() => "No playground response content found");
        throw new Error(`Timed out waiting for ${apiName}: ${responseText}`);
    }

    const responseText = await page.$eval(
        "div#responseContent",
        (element) => element.textContent || ""
    );
    const response = JSON.parse(responseText) as PlaygroundResponse & {
        error?: string;
    };
    if (response.error) {
        throw new Error(response.error);
    }

    return response;
}

function assertDpopResult(response: PlaygroundResponse): void {
    const result = response.result || response.response;
    expect(result?.accessToken).toBeTruthy();
    expect(result?.dpopProof).toBeTruthy();
    expect(result?.tokenType).toBe("DPoP");
}

function getDpopResult(response: PlaygroundResponse): DpopResult {
    const result = response.result || response.response;
    if (
        !result?.accessToken ||
        !result.dpopProof ||
        result.tokenType !== "DPoP"
    ) {
        throw new Error("Expected a complete DPoP authentication result");
    }

    return {
        accessToken: result.accessToken,
        dpopProof: result.dpopProof,
        fromCache: response.result?.fromCache,
        tokenType: result.tokenType,
    };
}

async function loadDpopNonce(
    page: puppeteer.Page,
    resourceRequestUri: string,
    nonce: string
): Promise<void> {
    const bridgeName = "__msalE2eLoadDpopNonce";
    const hasBridge = await page.evaluate(
        (name) => typeof window[name as keyof Window] === "function",
        bridgeName
    );

    if (!hasBridge) {
        await page.addScriptTag({
            type: "module",
            content: `
                import { loadDpopNonce } from "/js/playground.js";
                window.${bridgeName} = loadDpopNonce;
            `,
        });
        await page.waitForFunction(
            (name) => typeof window[name as keyof Window] === "function",
            {},
            bridgeName
        );
    }

    await page.evaluate(
        ({ name, uri, value }) => {
            const loader = window[name as keyof Window] as unknown as
                | ((
                      resourceRequestUri: string,
                      nonce: string
                  ) => Promise<void>)
                | undefined;
            if (!loader) {
                throw new Error("DPoP nonce test bridge is not available");
            }

            return loader(uri, value);
        },
        {
            name: bridgeName,
            uri: resourceRequestUri,
            value: nonce,
        }
    );
}

async function callDpopResource(
    resourceRequestUri: string,
    result: DpopResult
): Promise<DpopResourceResponse> {
    const response = await fetch(resourceRequestUri, {
        method: "GET",
        headers: {
            Authorization: `DPoP ${result.accessToken}`,
            DPoP: result.dpopProof,
        },
    });
    const resourceResponse = {
        status: response.status,
        dpopNonce: response.headers.get("dpop-nonce"),
        wwwAuthenticate: response.headers.get("www-authenticate") || "",
    };
    await response.body?.cancel();

    return resourceResponse;
}

async function acquireTokenSilent(
    page: puppeteer.Page
): Promise<PlaygroundResponse> {
    await page.click("button#btnAcquireTokenSilent");
    return readPlaygroundResponse(page, "acquireTokenSilent");
}

async function challengeGraphForNonce(
    page: puppeteer.Page,
    screenshot: Screenshot,
    username: string,
    accountPwd: string
): Promise<string> {
    await loadDpopNonce(page, GRAPH_RESOURCE_URI, STALE_DPOP_NONCE);
    const popupResponse = await acquireTokenPopup(
        page,
        screenshot,
        username,
        accountPwd
    );
    assertDpopResult(popupResponse);

    const challenge = await callDpopResource(
        GRAPH_RESOURCE_URI,
        getDpopResult(popupResponse)
    );
    expect(challenge.status).toBe(401);
    expect(challenge.wwwAuthenticate).toContain("DPoP");
    expect(challenge.wwwAuthenticate).toContain('error="use_dpop_nonce"');
    if (!challenge.dpopNonce) {
        throw new Error("Graph did not return a DPoP nonce");
    }

    return challenge.dpopNonce;
}

async function assertDpopAccessTokenCached(
    browserCache: BrowserCacheUtils
): Promise<void> {
    const tokenStore = await browserCache.getTokens();
    expect(
        tokenStore.accessTokens.some((key) =>
            key.includes("accesstoken_with_authscheme")
        )
    ).toBe(true);
    expect(tokenStore.accessTokens.some((key) => key.includes("dpop"))).toBe(
        true
    );
}

async function acquireTokenPopup(
    page: puppeteer.Page,
    screenshot: Screenshot,
    username: string,
    accountPwd: string
): Promise<PlaygroundResponse> {
    const popupPagePromise = new Promise<puppeteer.Page | null>((resolve) =>
        page.once("popup", resolve)
    );
    await page.locator("button#btnAcquireTokenPopup").click();
    const popupPage = await popupPagePromise;
    if (!popupPage) {
        throw new Error("Popup window was not opened");
    }

    const popupWindowClosed = new Promise<void>((resolve) =>
        popupPage.once("close", resolve)
    );
    await enterCredentials(popupPage, screenshot, username, accountPwd);
    await popupWindowClosed;

    return readPlaygroundResponse(page, "acquireTokenPopup");
}

async function runLogoutPopup(
    page: puppeteer.Page
): Promise<[puppeteer.Page, Promise<void>]> {
    await waitForPlaygroundControls(page, LOGOUT_POPUP_TIMEOUT_MS);

    const popupPagePromise = new Promise<puppeteer.Page | null>((resolve) =>
        page.once("popup", resolve)
    );
    const logoutErrorPromise = page
        .waitForFunction(
            () => {
                const responseContent =
                    document.getElementById("responseContent");
                const responseText = responseContent?.textContent || "";

                return (
                    responseText.includes(
                        '"api": "logoutPopupActiveAccount"'
                    ) && responseText.includes('"error"')
                );
            },
            { timeout: LOGOUT_POPUP_TIMEOUT_MS }
        )
        .then(() => null);

    await page.click("button#btnLogoutPopupActiveAccount");
    let popupPage: puppeteer.Page | null;
    try {
        popupPage = await Promise.race([popupPagePromise, logoutErrorPromise]);
    } finally {
        logoutErrorPromise.catch(() => undefined);
    }
    if (!popupPage) {
        const responseText = await page.$eval(
            "div#responseContent",
            (element) => element.textContent || ""
        );
        const response = JSON.parse(responseText) as PlaygroundResponse & {
            error?: string;
        };
        throw new Error(response.error || "Logout popup window was not opened");
    }

    const logoutPopupPage = popupPage;
    const popupWindowClosed = new Promise<void>((resolve) =>
        logoutPopupPage.once("close", resolve)
    );

    return [logoutPopupPage, popupWindowClosed];
}

describe("ExpressSample DPoP tests", () => {
    let browser: puppeteer.Browser;
    let port: number;
    let username: string;
    let accountPwd: string;

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

    describe("popup, silent, and SSO silent", () => {
        let context: puppeteer.BrowserContext;
        let page: puppeteer.Page;
        let browserCache: BrowserCacheUtils;
        let screenshot: Screenshot;

        beforeEach(async () => {
            context = await browser.createBrowserContext();
            page = await context.newPage();
            browserCache = new BrowserCacheUtils(page, "localStorage");
            screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/popup-silent-sso`
            );
            await loadAndConfigurePlayground(page, port, screenshot);
        });

        afterEach(async () => {
            await page.close();
            await context.close();
        });

        it("acquires DPoP proofs with popup, silent, and SSO silent", async () => {
            const popupResponse = await acquireTokenPopup(
                page,
                screenshot,
                username,
                accountPwd
            );
            assertDpopResult(popupResponse);
            await assertDpopAccessTokenCached(browserCache);

            await page.click("button#btnAcquireTokenSilent");
            const silentResponse = await readPlaygroundResponse(
                page,
                "acquireTokenSilent"
            );
            assertDpopResult(silentResponse);
            expect(silentResponse.result?.fromCache).toBe(true);

            const tokenStore = await browserCache.getTokens();
            await browserCache.removeTokens(tokenStore.accessTokens);
            await populatePlayground(page, port, username);

            await page.click("button#btnSsoSilent");
            const ssoSilentResponse = await readPlaygroundResponse(
                page,
                "ssoSilent"
            );
            assertDpopResult(ssoSilentResponse);
            await assertDpopAccessTokenCached(browserCache);
        });
    });

    describe("Microsoft Graph resource server", () => {
        let context: puppeteer.BrowserContext;
        let page: puppeteer.Page;
        let screenshot: Screenshot;

        beforeEach(async () => {
            context = await browser.createBrowserContext();
            page = await context.newPage();
            screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/graph`);
            await loadAndConfigurePlayground(
                page,
                port,
                screenshot,
                undefined,
                undefined,
                GRAPH_RESOURCE_URI
            );
        });

        afterEach(async () => {
            await page.close();
            await context.close();
        });

        it("retries a nonce challenge with a fresh DPoP proof", async () => {
            const nonce = await challengeGraphForNonce(
                page,
                screenshot,
                username,
                accountPwd
            );
            await loadDpopNonce(page, GRAPH_RESOURCE_URI, nonce);

            const silentResponse = await acquireTokenSilent(page);
            assertDpopResult(silentResponse);
            expect(silentResponse.result?.fromCache).toBe(true);

            const retry = await callDpopResource(
                GRAPH_RESOURCE_URI,
                getDpopResult(silentResponse)
            );
            expect(retry.status).toBe(200);
            expect(retry.wwwAuthenticate).toBe("");
            expect(retry.dpopNonce).toBeTruthy();
        });

        it("rejects a DPoP proof bound to a different HTTP method", async () => {
            const nonce = await challengeGraphForNonce(
                page,
                screenshot,
                username,
                accountPwd
            );
            await loadDpopNonce(page, GRAPH_RESOURCE_URI, nonce);
            await populatePlayground(
                page,
                port,
                undefined,
                undefined,
                GRAPH_RESOURCE_URI,
                "POST"
            );

            const silentResponse = await acquireTokenSilent(page);
            assertDpopResult(silentResponse);
            expect(silentResponse.result?.fromCache).toBe(true);

            const rejection = await callDpopResource(
                GRAPH_RESOURCE_URI,
                getDpopResult(silentResponse)
            );
            expect(rejection.status).toBe(401);
            expect(rejection.wwwAuthenticate).toContain("DPoP");
            expect(rejection.wwwAuthenticate).toContain(
                'error="invalid_token"'
            );
            expect(rejection.wwwAuthenticate).toContain(
                'error_description="The DPoP proof is invalid."'
            );
        });
    });

    describe("logout", () => {
        let context: puppeteer.BrowserContext;
        let page: puppeteer.Page;
        let browserCache: BrowserCacheUtils;
        let screenshot: Screenshot;

        beforeEach(async () => {
            context = await browser.createBrowserContext();
            page = await context.newPage();
            browserCache = new BrowserCacheUtils(page, "localStorage");
            screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/logout`
            );
            await loadAndConfigurePlayground(page, port, screenshot);

            const popupResponse = await acquireTokenPopup(
                page,
                screenshot,
                username,
                accountPwd
            );
            assertDpopResult(popupResponse);
            await assertDpopAccessTokenCached(browserCache);

            await loadAndConfigurePlayground(page, port, screenshot);
        });

        afterEach(async () => {
            await page.close();
            await context.close();
        });

        it("logoutPopup clears cached DPoP tokens", async () => {
            const [popupPage, popupWindowClosed] = await runLogoutPopup(page);
            expect(popupPage.url().startsWith(`${AUTHORITY}/`)).toBeTruthy();
            expect(popupPage.url()).toContain("logout");

            await page.waitForFunction(
                () =>
                    Object.keys(window.localStorage).every(
                        (key) =>
                            !key.includes("idtoken") &&
                            !key.includes("accesstoken") &&
                            !key.includes("refreshtoken") &&
                            !key.includes("account")
                    ),
                { timeout: LOGOUT_POPUP_TIMEOUT_MS }
            );

            const tokenStore = await browserCache.getTokens();
            expect(tokenStore.idTokens).toHaveLength(0);
            expect(tokenStore.accessTokens).toHaveLength(0);
            expect(tokenStore.refreshTokens).toHaveLength(0);
            expect(await browserCache.getAccountFromCache()).toBeNull();

            await popupWindowClosed;
            expect(popupPage.isClosed()).toBeTruthy();
        });
    });

    describe("redirect", () => {
        let context: puppeteer.BrowserContext;
        let page: puppeteer.Page;
        let browserCache: BrowserCacheUtils;

        beforeEach(async () => {
            context = await browser.createBrowserContext();
            page = await context.newPage();
            browserCache = new BrowserCacheUtils(page, "localStorage");
            await page.goto(`http://localhost:${port}/playground`, {
                timeout: 10000,
            });
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/redirect-setup`
            );
            await switchToVersion("local", page, screenshot);
        });

        afterEach(async () => {
            await page.close();
            await context.close();
        });

        it("acquireTokenRedirect returns a DPoP proof", async () => {
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/redirect`
            );
            await screenshot.takeScreenshot(page, "Playground loaded");

            await populatePlayground(page, port);
            await applyPlaygroundConfiguration(page);

            await page.locator("button#btnAcquireTokenRedirect").click();
            await enterCredentials(page, screenshot, username, accountPwd);
            await page.waitForFunction(() =>
                window.location.href.startsWith(
                    `${window.location.origin}/playground`
                )
            );

            await populatePlayground(page, port);
            await applyPlaygroundConfiguration(page);
            const redirectResponse = await readPlaygroundResponse(
                page,
                "acquireTokenRedirect",
                "response"
            );
            assertDpopResult(redirectResponse);
            await assertDpopAccessTokenCached(browserCache);
        });
    });
});
