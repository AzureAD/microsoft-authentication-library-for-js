import { IdTokenClaims } from "@azure/msal-common";
import {
    AppTypes,
    AzureEnvironments,
    LabApiQueryParams,
    LabClient,
    assertKmsiSigninState,
    setupCredentials,
} from "e2e-test-utils";
import * as fs from "fs";
import {
    Browser,
    BrowserContext,
    chromium,
    Frame,
    Page,
} from "playwright-core";

const EAR_DECRYPT_COUNT_KEY = "__earDecryptCount";

export interface LabCredentials {
    username: string;
    password: string;
}

export async function getLabCredentials(): Promise<LabCredentials> {
    const labApiParams: LabApiQueryParams = {
        azureEnvironment: AzureEnvironments.CLOUD,
        appType: AppTypes.CLOUD,
    };
    const labClient = new LabClient();
    const envResponse = await labClient.getVarsByCloudEnvironment(labApiParams);
    const [username, password] = await setupCredentials(
        envResponse[0],
        labClient
    );

    return { username, password };
}

export function launchBrowser(): Promise<Browser> {
    return chromium.launch({
        channel: "chrome",
        headless: process.env.HEADLESS !== "false",
    });
}

export interface TokenStore {
    idTokens: string[];
    accessTokens: string[];
    refreshTokens: string[];
}

type BrowserStorageName = "localStorage" | "sessionStorage";

export async function readBrowserTokenStore(
    page: Page | Frame,
    storageName: BrowserStorageName
): Promise<TokenStore> {
    const storage = await page.evaluate(
        (selectedStorage) =>
            Object.assign({}, window[selectedStorage]) as Record<
                string,
                string
            >,
        storageName
    );
    const store: TokenStore = {
        idTokens: [],
        accessTokens: [],
        refreshTokens: [],
    };
    for (const key of Object.keys(storage)) {
        if (key.includes("idtoken")) {
            store.idTokens.push(key);
        } else if (key.includes("accesstoken")) {
            store.accessTokens.push(key);
        } else if (key.includes("refreshtoken")) {
            store.refreshTokens.push(key);
        }
    }
    return store;
}

export function readSessionTokenStore(page: Page | Frame): Promise<TokenStore> {
    return readBrowserTokenStore(page, "sessionStorage");
}

export async function readAccountKeys(
    page: Page | Frame,
    storageName: BrowserStorageName = "sessionStorage"
): Promise<string[] | null> {
    const raw = await page.evaluate(
        (selectedStorage) =>
            window[selectedStorage].getItem("msal.3.account.keys"),
        storageName
    );
    return raw ? (JSON.parse(raw) as string[]) : null;
}

export interface CachedAccount {
    homeAccountId?: string;
    nativeAccountId?: string;
}

export async function readCachedAccount(
    page: Page | Frame,
    key: string | undefined,
    storageName: BrowserStorageName = "sessionStorage"
): Promise<CachedAccount> {
    if (!key) {
        throw new Error("Account cache key is missing");
    }
    return page.evaluate(
        ({ accountKey, selectedStorage }) => {
            const cachedAccount = window[selectedStorage].getItem(accountKey);
            if (!cachedAccount) {
                throw new Error("Account cache entry is missing");
            }
            return JSON.parse(cachedAccount) as CachedAccount;
        },
        { accountKey: key, selectedStorage: storageName }
    );
}

export async function readKmsiIdTokenClaims(
    page: Page | Frame,
    key: string | undefined,
    storageName: BrowserStorageName = "sessionStorage"
): Promise<IdTokenClaims> {
    if (!key) {
        throw new Error("ID token cache key is missing");
    }
    const idToken = await page.evaluate(
        ({ tokenKey, selectedStorage }) => {
            const cachedToken = window[selectedStorage].getItem(tokenKey);
            if (!cachedToken) {
                throw new Error("ID token cache entry is missing");
            }
            const token: { secret?: string } = JSON.parse(cachedToken);
            if (!token.secret) {
                throw new Error("ID token cache entry has no secret");
            }
            return token.secret;
        },
        { tokenKey: key, selectedStorage: storageName }
    );
    const payload = idToken.split(".")[1];
    if (!payload) {
        throw new Error("ID token has no JWT claims payload");
    }
    const claims: IdTokenClaims = JSON.parse(
        Buffer.from(payload, "base64url").toString("utf8")
    );
    assertKmsiSigninState(claims);
    return claims;
}

export function accessTokenForScopesExists(
    accessTokenKeys: string[],
    scopes: string[]
): boolean {
    return (
        accessTokenKeys
            .filter((key) => key.indexOf("accesstoken_with_authscheme") === -1)
            .filter((key) =>
                scopes.every((scope) => key.includes(scope.toLowerCase()))
            ).length === 1
    );
}

const USERNAME_INPUT =
    "#i0116, input[name='i0116'], #usernameEntry, input[type='email']";
const PASSWORD_INPUT =
    "#i0118, input[name='i0118'], #passwordEntry, input[type='password']";
const PRIMARY_SUBMIT =
    "#idSIButton9, input[name='idSIButton9'], #next, button[type='submit'], input[type='submit']";
const AAD_ACCOUNT_TYPE = "#aadTile, input[name='aadTile']";
const KMSI_TITLE = "#kmsiTitle";

export async function enterAadCredentials(
    page: Page,
    username: string,
    password: string,
    screenshot?: Screenshot
): Promise<void> {
    const useAnotherAccount = page.locator("#otherTile").first();
    if (
        await useAnotherAccount.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
        await useAnotherAccount.click();
    }
    await page.waitForSelector(USERNAME_INPUT, { timeout: 30000 });
    await screenshot?.takeScreenshot(page, "loginPage");
    await page.fill(USERNAME_INPUT, username);
    await screenshot?.takeScreenshot(page, "loginPageUsernameFilled");
    await page.click(PRIMARY_SUBMIT);

    const aadAccountType = page.locator(AAD_ACCOUNT_TYPE).first();
    if (await aadAccountType.isVisible({ timeout: 1000 }).catch(() => false)) {
        await screenshot?.takeScreenshot(page, "accountType");
        await aadAccountType.click();
    }

    await page.waitForSelector(PASSWORD_INPUT, { timeout: 30000 });
    await screenshot?.takeScreenshot(page, "passwordPage");
    await page.fill(PASSWORD_INPUT, password);
    await screenshot?.takeScreenshot(page, "passwordPageFilled");
    await page.click(PRIMARY_SUBMIT);
    await screenshot?.takeScreenshot(page, "passwordSubmitted");

    const deadline = Date.now() + 30000;
    while (!page.isClosed() && Date.now() < deadline) {
        await page
            .waitForLoadState("domcontentloaded", { timeout: 5000 })
            .catch(() => {});
        if (page.isClosed() || page.url().startsWith("https://localhost:")) {
            return;
        }

        const kmsiPrompt = page
            .locator(KMSI_TITLE)
            .or(page.getByText("Stay signed in?", { exact: false }));
        if (
            await kmsiPrompt
                .first()
                .isVisible()
                .catch(() => false)
        ) {
            await screenshot?.takeScreenshot(page, "keepMeSignedInPage");
            await page.locator(PRIMARY_SUBMIT).first().click();
            continue;
        }

        const skipSecurityInfo = page.locator(
            "#lightbox > div:nth-child(3) > div > div.pagination-view.has-identity-banner.animate.slide-in-next > div > div:nth-child(3) > a"
        );
        if (
            await skipSecurityInfo
                .first()
                .isVisible()
                .catch(() => false)
        ) {
            await skipSecurityInfo.first().click();
            continue;
        }

        await page.waitForTimeout(500);
    }

    if (!page.isClosed()) {
        const pageText = await page
            .locator("body")
            .innerText()
            .catch(() => "");
        throw new Error(
            `Authentication popup did not close. URL: ${page.url()}. ` +
                `Page: ${pageText.slice(0, 500)}`
        );
    }
}

export class Screenshot {
    private screenshotNumber = 0;
    private readonly enabled = process.env.ENABLE_E2E_SCREENSHOTS === "true";

    constructor(private readonly folderName: string) {
        if (this.enabled) {
            fs.mkdirSync(folderName, { recursive: true });
        }
    }

    async takeScreenshot(page: Page, screenshotName: string): Promise<void> {
        if (!this.enabled) {
            return;
        }
        await page
            .screenshot({
                path: `${this.folderName}/${++this
                    .screenshotNumber}_${screenshotName}.png`,
                fullPage: true,
            })
            .catch((error) => {
                console.error(
                    `Error taking screenshot ${screenshotName}: ${error}`
                );
            });
    }
}

export async function installEarDecryptSpy(
    context: BrowserContext
): Promise<void> {
    await context.addInitScript((key: string) => {
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
                        // Storage is best-effort test instrumentation.
                    }
                }
                return realDecrypt(algorithm, cryptoKey, data);
            };
        } catch {
            // The spy must never interfere with authentication.
        }
    }, EAR_DECRYPT_COUNT_KEY);
}

export async function getEarDecryptCount(page: Page | Frame): Promise<number> {
    return page.evaluate(
        (key) => parseInt(window.sessionStorage.getItem(key) || "0", 10),
        EAR_DECRYPT_COUNT_KEY
    );
}

export const ACTION_TIMEOUT = 60000;
export const NAA_KMSI_SCOPES = ["User.Read"];
export const NAA_KMSI_TOKEN_APIS = [
    { name: "acquireTokenSilent", bridge: "GetToken", silent: true },
    { name: "ssoSilent", bridge: "GetToken", silent: true },
    { name: "acquireTokenPopup", bridge: "GetTokenPopup", silent: false },
    { name: "loginPopup", bridge: "GetTokenPopup", silent: false },
] as const;

export interface HostAuthResult {
    fromPlatformBroker: boolean;
    correlationId: string;
    account: {
        homeAccountId: string;
        nativeAccountId?: string;
    };
    idTokenClaims: IdTokenClaims;
}

interface BridgeRequest {
    messageType: string;
    method: string;
    tokenParams?: {
        clientId: string;
        correlationId: string;
        scope: string;
    };
}

export interface TokenStoreExpectations {
    idTokens: number;
    accessTokens: number;
    refreshTokens: number;
}

export interface NestedTokenTestContext {
    hostPage: Page;
    initialHostResult: HostAuthResult;
    fromPlatformBroker: boolean;
    nestedClientId: string;
    hostTokenStore?: TokenStoreExpectations;
}

declare global {
    interface Window {
        __naaKmsiRequests: BridgeRequest[];
    }
}

async function observeBridgeRequests(
    page: Page,
    nestedUrl: string
): Promise<void> {
    await page.addInitScript((nestedOrigin) => {
        window.__naaKmsiRequests = [];
        window.addEventListener("message", (event) => {
            if (
                event.origin !== nestedOrigin ||
                event.source !==
                    document.querySelector<HTMLIFrameElement>(
                        "iframe[title='nestedApp']"
                    )?.contentWindow ||
                typeof event.data !== "string"
            ) {
                return;
            }
            let request: BridgeRequest;
            try {
                request = JSON.parse(event.data);
            } catch {
                return;
            }
            if (request?.messageType === "NestedAppAuthRequest") {
                window.__naaKmsiRequests.push(request);
            }
        });
    }, nestedUrl);
}

export async function openKmsiHost(
    context: BrowserContext,
    hostUrl: string,
    nestedUrl: string
): Promise<Page> {
    const hostPage = await context.newPage();
    await observeBridgeRequests(hostPage, nestedUrl);
    await hostPage.goto(hostUrl, {
        waitUntil: "domcontentloaded",
        timeout: ACTION_TIMEOUT,
    });
    const loginButton = hostPage.getByRole("button", {
        name: "Login",
        exact: true,
    });
    try {
        await loginButton.waitFor({ timeout: 10000 });
    } catch {
        await hostPage.reload({
            waitUntil: "domcontentloaded",
            timeout: ACTION_TIMEOUT,
        });
        await loginButton.waitFor({ timeout: ACTION_TIMEOUT });
    }
    return hostPage;
}

export async function readHostAuthResult(
    page: Page,
    fromPlatformBroker: boolean
): Promise<HostAuthResult> {
    await page
        .locator("[data-testid='authResult'], [data-testid='hostError']")
        .waitFor({ timeout: ACTION_TIMEOUT });
    const error = page.locator("[data-testid='hostError']");
    if (await error.count()) {
        throw new Error(
            `Host authentication failed: ${await error.innerText()}`
        );
    }
    const result: HostAuthResult = JSON.parse(
        await page.locator("[data-testid='authResult']").innerText()
    );
    expect(result.fromPlatformBroker).toBe(fromPlatformBroker);
    expect(result.account.homeAccountId).toBeTruthy();
    if (fromPlatformBroker) {
        expect(result.account.nativeAccountId).toBeTruthy();
    }
    assertKmsiSigninState(result.idTokenClaims);
    return result;
}

export async function authenticateKmsiHost(
    hostPage: Page,
    fromPlatformBroker: boolean
): Promise<HostAuthResult> {
    const popupPromise = hostPage
        .context()
        .waitForEvent("page", { timeout: 15000 })
        .catch(() => null);
    await hostPage
        .getByRole("button", { name: "Login", exact: true })
        .click({ timeout: ACTION_TIMEOUT });
    const popup = await popupPromise;
    if (popup) {
        await popup.waitForLoadState("domcontentloaded");
        const loginSelector = fromPlatformBroker
            ? "input[type='email'], #i0116"
            : "input[type='email'], #i0116, #otherTile";
        const loginInput = popup.locator(loginSelector).first();
        const hasLogin = await loginInput
            .waitFor({ state: "visible", timeout: 10000 })
            .then(() => true)
            .catch(() => false);
        if (hasLogin) {
            const { username, password } = await getLabCredentials();
            await enterAadCredentials(popup, username, password);
        }
    }
    return readHostAuthResult(hostPage, fromPlatformBroker);
}

async function getNestedFrame(page: Page): Promise<Frame> {
    const handle = await page.waitForSelector("iframe[title='nestedApp']", {
        timeout: ACTION_TIMEOUT,
    });
    const frame = await handle.contentFrame();
    if (!frame) {
        throw new Error("Nested app iframe has no content frame");
    }
    await frame.waitForSelector("#acquireTokenSilent", {
        timeout: ACTION_TIMEOUT,
    });
    return frame;
}

async function resetNestedFrame(page: Page): Promise<Frame> {
    const frame = await getNestedFrame(page);
    await frame.evaluate(() => window.sessionStorage.clear());
    await Promise.all([
        frame.waitForNavigation({
            waitUntil: "domcontentloaded",
            timeout: ACTION_TIMEOUT,
        }),
        page.evaluate(() => {
            const iframe = document.querySelector<HTMLIFrameElement>(
                "iframe[title='nestedApp']"
            );
            if (!iframe) {
                throw new Error("Nested app iframe is missing");
            }
            iframe.src = iframe.src;
        }),
    ]);
    await frame.waitForSelector("#acquireTokenSilent", {
        timeout: ACTION_TIMEOUT,
    });
    return frame;
}

export async function verifyHostTokenStore(
    page: Page,
    expected: TokenStoreExpectations
): Promise<void> {
    const store = await readBrowserTokenStore(page, "localStorage");
    expect(store.idTokens).toHaveLength(expected.idTokens);
    expect(store.accessTokens).toHaveLength(expected.accessTokens);
    expect(store.refreshTokens).toHaveLength(expected.refreshTokens);
    expect(await readAccountKeys(page, "localStorage")).toHaveLength(1);
}

export async function acquireNestedKmsiToken(
    context: NestedTokenTestContext,
    api: (typeof NAA_KMSI_TOKEN_APIS)[number]
): Promise<void> {
    const {
        hostPage,
        initialHostResult,
        fromPlatformBroker,
        nestedClientId,
        hostTokenStore,
    } = context;

    await hostPage.reload({
        waitUntil: "domcontentloaded",
        timeout: ACTION_TIMEOUT,
    });
    const frame = await resetNestedFrame(hostPage);
    expect(await readSessionTokenStore(frame)).toEqual({
        idTokens: [],
        accessTokens: [],
        refreshTokens: [],
    });
    expect(await readAccountKeys(frame)).toBeNull();
    await hostPage.evaluate(() => {
        window.__naaKmsiRequests = [];
    });

    const popups: Page[] = [];
    const onPage = (page: Page): void => {
        popups.push(page);
    };
    hostPage.context().on("page", onPage);
    try {
        await frame.locator(`#${api.name}`).click({
            timeout: ACTION_TIMEOUT,
        });
        await frame
            .locator(
                `[data-testid='lastApi'][data-api='${api.name}'], ` +
                    `[data-testid='apiError'][data-api='${api.name}']`
            )
            .waitFor({ timeout: ACTION_TIMEOUT });
        const error = frame.locator("[data-testid='apiError']");
        if (await error.count()) {
            throw new Error(
                `Nested ${api.name} failed: ${await error.innerText()}`
            );
        }
        if (api.silent) {
            expect(popups).toHaveLength(0);
        }
    } finally {
        hostPage.context().off("page", onPage);
    }

    const requests = await hostPage.evaluate(() => window.__naaKmsiRequests);
    const tokenRequests = requests.filter(
        (request) =>
            request.method === "GetToken" || request.method === "GetTokenPopup"
    );
    expect(tokenRequests).toHaveLength(1);
    expect(tokenRequests[0].method).toBe(api.bridge);
    const tokenParams = tokenRequests[0].tokenParams;
    if (!tokenParams) {
        throw new Error("NAA token request did not contain tokenParams");
    }
    expect(tokenParams.clientId).toBe(nestedClientId);
    expect(tokenParams.scope.toLowerCase().split(" ")).toEqual(
        expect.arrayContaining(
            NAA_KMSI_SCOPES.map((scope) => scope.toLowerCase())
        )
    );
    await hostPage.waitForFunction(
        (correlationId) => {
            const result = document.querySelector(
                "[data-testid='authResult']"
            )?.textContent;
            return result && JSON.parse(result).correlationId === correlationId;
        },
        tokenParams.correlationId,
        { timeout: ACTION_TIMEOUT }
    );
    const hostResult = await readHostAuthResult(hostPage, fromPlatformBroker);
    expect(hostResult.correlationId).toBe(tokenParams.correlationId);
    expect(hostResult.account.homeAccountId).toBe(
        initialHostResult.account.homeAccountId
    );
    if (fromPlatformBroker) {
        expect(hostResult.account.nativeAccountId).toBeTruthy();
    }
    if (hostTokenStore) {
        await verifyHostTokenStore(hostPage, hostTokenStore);
    }

    const store = await readSessionTokenStore(frame);
    expect(store.idTokens).toHaveLength(1);
    expect(store.accessTokens).toHaveLength(1);
    expect(store.refreshTokens).toHaveLength(0);
    expect(
        accessTokenForScopesExists(store.accessTokens, NAA_KMSI_SCOPES)
    ).toBe(true);
    const accountKeys = await readAccountKeys(frame);
    expect(accountKeys).toHaveLength(1);
    const nestedAccount = await readCachedAccount(frame, accountKeys?.[0]);
    expect(nestedAccount.homeAccountId).toBe(
        initialHostResult.account.homeAccountId
    );
    if (fromPlatformBroker) {
        expect(nestedAccount.nativeAccountId).toBe(
            hostResult.account.nativeAccountId
        );
    }
    const claims = await readKmsiIdTokenClaims(frame, store.idTokens[0]);
    expect(claims.aud).toBe(nestedClientId);
    expect(
        await frame
            .locator("[data-testid='lastApi'] tbody td")
            .first()
            .innerText()
    ).toBe(initialHostResult.account.homeAccountId);
}
