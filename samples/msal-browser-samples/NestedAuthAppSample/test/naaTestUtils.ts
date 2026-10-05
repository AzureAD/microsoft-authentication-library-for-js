import {
    AppTypes,
    AzureEnvironments,
    LabApiQueryParams,
    LabClient,
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

export async function readSessionTokenStore(
    page: Page | Frame
): Promise<TokenStore> {
    const storage = await page.evaluate(() =>
        Object.assign({}, window.sessionStorage)
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

export async function readAccountKeys(
    page: Page | Frame
): Promise<string[] | null> {
    const raw = await page.evaluate(
        () => window.sessionStorage["msal.3.account.keys"]
    );
    return raw ? (JSON.parse(raw) as string[]) : null;
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
