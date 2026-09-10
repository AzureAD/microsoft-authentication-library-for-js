import {
    Browser,
    Page,
    BrowserContext,
    Frame,
    Screenshot,
    setupCredentials,
    enterCredentials,
    LabClient,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
    BrowserCacheUtils,
} from "e2e-test-utils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/nestedAppAuth`;
const puppeteerTimeout = 15000;
const authenticationTimeout = 60000;
const jestTimeout = 120000;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { HOST_APP_PORT, NESTED_APP_PORT } = require("../sampleConfig.cjs") as {
    HOST_APP_PORT: number;
    NESTED_APP_PORT: number;
};

const hostPort = HOST_APP_PORT;
const nestedPort = NESTED_APP_PORT;
const protocol = "https";

// sessionStorage key the decrypt spy increments on every AES-GCM decrypt.
const EAR_DECRYPT_COUNT_KEY = "__earDecryptCount";

// Wraps `crypto.subtle.decrypt` on every future document so the specs can prove
// MSAL decrypted an `ear_jwe` (EAR response) instead of a plaintext auth code.
async function installEarDecryptSpy(page: Page): Promise<void> {
    await page.evaluateOnNewDocument((key: string) => {
        try {
            if (!window.crypto || !window.crypto.subtle) {
                return;
            }
            const realDecrypt = window.crypto.subtle.decrypt.bind(
                window.crypto.subtle
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window.crypto.subtle as any).decrypt = function (
                algorithm: AlgorithmIdentifier,
                cryptoKey: CryptoKey,
                data: BufferSource
            ) {
                const algName =
                    typeof algorithm === "string" ? algorithm : algorithm.name;
                if (algName === "AES-GCM") {
                    try {
                        const next =
                            parseInt(
                                window.sessionStorage.getItem(key) || "0",
                                10
                            ) + 1;
                        window.sessionStorage.setItem(key, String(next));
                    } catch {
                        // ignore storage errors
                    }
                }
                return realDecrypt(algorithm, cryptoKey, data);
            };
        } catch {
            // best-effort spy: never break the auth flow
        }
    }, EAR_DECRYPT_COUNT_KEY);
}

async function getEarDecryptCount(page: Page): Promise<number> {
    return page.evaluate(
        (key) => parseInt(window.sessionStorage.getItem(key) || "0", 10),
        EAR_DECRYPT_COUNT_KEY
    );
}

const getNestedFrame = async (page: Page): Promise<Frame> => {
    const frame = await page.waitForFrame(
        (candidate) => candidate.url().includes(nestedPort.toString()),
        { timeout: puppeteerTimeout }
    );
    await frame.waitForSelector(
        "xpath=//button[contains(., 'acquireTokenSilent')]",
        { timeout: puppeteerTimeout }
    );
    return frame;
};

const waitForHostSignIn = async (frame: Frame): Promise<void> => {
    await frame.waitForFunction(
        () =>
            Array.from(document.querySelectorAll("p")).some((element) =>
                element.textContent?.includes("Signed in")
            ) || Boolean(document.querySelector("pre")),
        { timeout: authenticationTimeout }
    );

    const error = await frame
        .$eval("pre", (element) => element.textContent)
        .catch(() => null);
    if (error) {
        throw new Error(`Host authentication failed: ${error}`);
    }
};

const verifyHostTokenStore = async (
    browserCache: BrowserCacheUtils,
    scopes: string[]
): Promise<void> => {
    const tokenStore = await browserCache.getTokens();
    expect(tokenStore.idTokens.length).toBe(1);
    expect(tokenStore.accessTokens.length).toBe(1);
    // The host completes regular web authentication, so it keeps its own
    // refresh token. (Under a platform broker the refresh token would instead
    // be held by the OS broker and the host cache would hold none.)
    expect(tokenStore.refreshTokens.length).toBe(1);
    expect(await browserCache.getAccountFromCache()).not.toBeNull();
    expect(
        await browserCache.accessTokenForScopesExists(
            tokenStore.accessTokens,
            scopes
        )
    ).toBeTruthy();
};

const verifyNestedTokenStore = async (
    browserCache: BrowserCacheUtils,
    scopes: string[]
): Promise<void> => {
    const tokenStore = await browserCache.getTokens();
    expect(tokenStore.idTokens.length).toBe(1);
    expect(tokenStore.accessTokens.length).toBe(1);
    expect(tokenStore.refreshTokens.length).toBe(0);
    expect(await browserCache.getAccountFromCache()).not.toBeNull();
    expect(
        await browserCache.accessTokenForScopesExists(
            tokenStore.accessTokens,
            scopes
        )
    ).toBeTruthy();
};

/**
 * Nested App Authentication (NAA) exercised through the host app, generated as
 * two suites from one factory:
 *
 *   1. the standard web-brokered NAA flow, and
 *   2. the NAA + Encrypted Authorize Response (EAR) combination, where the host
 *      is opened with `?ear=true` so it runs `ProtocolMode.EAR` and both its own
 *      login and the token it brokers for the nested app return an encrypted
 *      `ear_jwe`.
 *
 * The host app implements and supplies `window.nestedAppAuthBridge`, brokering
 * the nested app's tokens over the regular web flow. The nested app acquires a
 * token silently through that bridge and never holds a refresh token — that is
 * the core NAA property under test. (When a platform broker is available the
 * host can forward the same requests to it; that path is
 * `naa-platform-broker.spec.ts`.)
 *
 * Requires lab credentials.
 */
export function runBasicNaaSuite(
    title: string,
    ear: boolean,
    enabled = true
): void {
    const suite = enabled ? describe : describe.skip;
    suite(title, () => {
        jest.setTimeout(jestTimeout);

        let browser: Browser;
        let context: BrowserContext;
        let page: Page;

        let username: string;
        let accountPwd: string;
        let hostCache: BrowserCacheUtils;

        // Host URL, opting into EAR for the combination suite.
        const hostUrl = `${protocol}://localhost:${hostPort}${
            ear ? "/?ear=true" : ""
        }`;

        beforeAll(async () => {
            // @ts-ignore
            browser = await global.__BROWSER__;

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
            const client = await page.createCDPSession();
            await client.send("Security.setIgnoreCertificateErrors", {
                ignore: true,
            });
            // Install the EAR decrypt spy before the first navigation so it is
            // present on the host document that processes the authorize response.
            if (ear) {
                await installEarDecryptSpy(page);
            }
            hostCache = new BrowserCacheUtils(page, "sessionStorage");
        });

        afterEach(async () => {
            await context.close();
        });

        it("nested app acquires a token through the host without holding a refresh token", async () => {
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/nestedAcquireToken${
                    ear ? "Ear" : ""
                }`
            );

            await page.goto(hostUrl);

            // Sign the host in through the standard web (popup) authentication flow.
            const hostFrame = page.mainFrame();
            const loginButton = await hostFrame.waitForSelector(
                "xpath=//button[contains(., 'Login')]",
                { timeout: puppeteerTimeout }
            );
            const popupPromise = new Promise<Page | null>((resolve) =>
                page.once("popup", resolve)
            );
            await loginButton?.click();
            const popupPage = await popupPromise;
            if (!popupPage) {
                throw new Error("Login popup was not opened");
            }
            await enterCredentials(popupPage, screenshot, username, accountPwd);
            await waitForHostSignIn(hostFrame);
            await verifyHostTokenStore(hostCache, ["User.Read"]);

            // In EAR mode the host login must have decrypted an `ear_jwe`; a zero
            // count means it silently fell back to a plaintext auth-code response.
            if (ear) {
                expect(await getEarDecryptCount(page)).toBeGreaterThan(0);
            }

            // Nested app acquires a token silently through the host-supplied NAA
            // bridge (`window.nestedAppAuthBridge`).
            const nestedFrame = await getNestedFrame(page);
            const acquireButton = await nestedFrame.waitForSelector(
                "xpath=//button[contains(., 'acquireTokenSilent')]"
            );
            const earDecryptCountBeforeNested = ear
                ? await getEarDecryptCount(page)
                : 0;
            await acquireButton?.click();
            await nestedFrame.waitForSelector(
                "xpath=//th[contains(., 'homeAccountId')]",
                { timeout: puppeteerTimeout }
            );
            await screenshot.takeScreenshot(page, "Nested app authenticated");

            // The brokered nested acquisition runs through the host's EAR PCA, so
            // it drives another `ear_jwe` decrypt on the host origin.
            if (ear) {
                expect(await getEarDecryptCount(page)).toBeGreaterThan(
                    earDecryptCountBeforeNested
                );
            }

            // Nested app must not hold a refresh token — it stays with the host/broker.
            // The nested app caches to sessionStorage, which is scoped to the iframe's
            // browsing context, so read it from the frame directly.
            const nestedCache = new BrowserCacheUtils(
                nestedFrame as unknown as Page,
                "sessionStorage"
            );
            await verifyNestedTokenStore(nestedCache, ["User.Read"]);
        });
    });
}
