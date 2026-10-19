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

function createDpopRequest(loginHint?: string) {
    return {
        scopes: ["User.Read"],
        ...(loginHint ? { loginHint } : {}),
        authenticationScheme: "DPoP",
        resourceRequestMethod: "GET",
        resourceRequestUri: DPOP_RESOURCE_URI,
        extraQueryParameters: {
            dc: DPOP_ESTS_DC,
        },
    };
}

async function populatePlayground(
    page: puppeteer.Page,
    port: number,
    loginHint?: string,
    redirectPath?: string
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
            request: createDpopRequest(loginHint),
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
    redirectPath?: string
): Promise<void> {
    await page.goto(`http://localhost:${port}/playground`, {
        timeout: 10000,
    });
    await screenshot.takeScreenshot(page, "Playground loaded");
    await switchToVersion("local", page, screenshot);
    await waitForPlaygroundControls(page);

    await populatePlayground(page, port, loginHint, redirectPath);
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
