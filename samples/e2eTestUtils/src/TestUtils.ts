import * as fs from "fs";
import { Page, Browser, WaitForOptions } from "puppeteer";
import { LabConfig } from "./LabConfig";
import { LabClient } from "./LabClient";
import { HtmlSelectors, PasswordInputSelectors, SubmitButtonSelectors, UsernameSelectors } from "./Constants";

export const ONE_SECOND_IN_MS = 1000;
export const RETRY_TIMES = 5;

const WAIT_FOR_NAVIGATION_CONFIG: WaitForOptions = {
    waitUntil: ["load", "domcontentloaded", "networkidle0"],
    timeout: 2000
};

export class Screenshot {
    private folderName: string;
    private screenshotNum: number;
    private enabled: boolean;

    constructor(foldername: string) {
        this.folderName = foldername;
        this.screenshotNum = 0;
        this.enabled = process.env["ENABLE_E2E_SCREENSHOTS"] === "true";
        if (this.enabled) {
            createFolder(this.folderName);
        }
    }

    async takeScreenshot(page: Page, screenshotName: string): Promise<void> {
        if (!this.enabled) {
            return;
        }
        await page.screenshot({
            path: `${this.folderName}/${++this
                .screenshotNum}_${screenshotName}.png`,
            fullPage: true
        }).catch((e) => {
            console.error(`Error taking screenshot ${screenshotName}: ${e}`);
        });
    }
}

export function createFolder(foldername: string) {
    if (!fs.existsSync(foldername)) {
        fs.mkdirSync(foldername, { recursive: true });
    }
}

async function poller(
    callback: () => Promise<void>,
    timeoutMs: number,
    errorMessage: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        let lastError: Error;
        const interval = setInterval(async () => {
            if (Date.now() - startTime > timeoutMs) {
                clearInterval(interval);
                console.error(lastError);
                reject(new Error(errorMessage));
            }
            await callback()
                .then(() => {
                    // If callback resolves - success
                    clearInterval(interval);
                    resolve();
                })
                .catch((e: Error) => {
                    // If callback throws storage hasn't been updated yet - check again on next interval
                    lastError = e;
                });
        }, 200);
    });
}

export async function storagePoller(
    callback: () => Promise<void>,
    timeoutMs: number
): Promise<void> {
    await poller(callback, timeoutMs, "Timed out while waiting for storage");
}

export async function pcaInitializedPoller(
    page: Page,
    timeoutMs: number
): Promise<void> {
    await poller(
        () => {
            return new Promise(async (resolve, reject) => {
                await page.waitForSelector("#pca-initialized");
                const initializedText = await page.$eval(
                    "#pca-initialized",
                    (el) => el.textContent
                );
                if (initializedText === "true") {
                    resolve();
                }
            });
        },
        timeoutMs,
        "Timed out while waiting for PublicClientApplication to be initialized"
    );
}

export async function retrieveAppConfiguration(
    labConfig: LabConfig,
    labClient: LabClient,
    isConfidentialClient: boolean
): Promise<[string, string, string]> {
    let clientID = "";
    let clientSecret = "";
    let authority = "";

    if (labConfig.app.appId) {
        clientID = labConfig.app.appId;
    }

    if (labConfig.lab.authority && labConfig.lab.tenantId) {
        authority = `${labConfig.lab.authority}${labConfig.lab.tenantId}`;
    }

    if (isConfidentialClient) {
        // Use pre-populated client secret from Key Vault if available
        if (labConfig.app.clientSecret) {
            clientSecret = labConfig.app.clientSecret;
        } else if (labConfig.lab.labName && labConfig.app.appName) {
            let secretAppName = `${labConfig.lab.labName}-${labConfig.app.appName}`;

            // Reformat the secret app name to kebab case from snake case
            while (secretAppName.includes("_"))
                secretAppName = secretAppName.replace("_", "-");

            const appClientSecret = await labClient.getSecret(secretAppName);
            clientSecret = appClientSecret.value;
        }

        if (!clientSecret) {
            throw Error("Unable to get the client secret");
        }
    }

    return [clientID, clientSecret, authority];
}

export async function setupCredentials(
    labConfig: LabConfig,
    labClient: LabClient
): Promise<[string, string]> {
    let username = "";
    let accountPwd = "";

    const { user, lab } = labConfig;

    if (user.userType === "guest") {
        if (!user.homeUPN) {
            throw Error("Guest user does not have a homeUPN");
        }
        username = user.homeUPN;
    } else {
        if (!user.upn) {
            throw Error("User does not have a upn");
        }
        username = user.upn || "";
    }

    if (!lab.labName) {
        throw Error("No Labname provided!");
    }

    const testPwdSecret = await labClient.getSecret(lab.labName);

    accountPwd = testPwdSecret.value;

    if (!accountPwd) {
        throw Error("Unable to get account password!");
    }

    return [username, accountPwd];
}

export async function b2cLocalAccountEnterCredentials(
    page: Page,
    screenshot: Screenshot,
    username: string,
    accountPwd: string
) {
    await fillUsername(page, screenshot, username);
    await fillPassword(page, screenshot, accountPwd);
    await clickSubmitButton(page, screenshot);
}

export async function b2cAadPpeAccountEnterCredentials(
    page: Page,
    screenshot: Screenshot,
    username: string,
    accountPwd: string
): Promise<void> {
    await page.waitForSelector(HtmlSelectors.B2C_AAD_MSIDLAB4_SIGNIN_PAGE);
    await screenshot.takeScreenshot(page, "b2cSignInPage");
    // Select Lab Provider
    await page.click(HtmlSelectors.B2C_AAD_MSIDLAB4_SIGNIN_PAGE);
    // Enter credentials
    await enterCredentials(page, screenshot, username, accountPwd);
}

export async function b2cMsaAccountEnterCredentials(
    page: Page,
    screenshot: Screenshot,
    username: string,
    accountPwd: string
): Promise<void> {
    await page.waitForSelector(HtmlSelectors.B2C_MSA_SIGNIN_PAGE);
    await screenshot.takeScreenshot(page, "b2cSignInPage");
    // Select Lab Provider
    await page.click(HtmlSelectors.B2C_MSA_SIGNIN_PAGE);
    // Enter credentials
    await enterCredentials(page, screenshot, username, accountPwd);
}

// Constants
export const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
export const SAMPLE_HOME_URL = "http://localhost";
export const SUCCESSFUL_GRAPH_CALL_ID = "graph-called-successfully";
export const SUCCESSFUL_SILENT_TOKEN_ACQUISITION_ID = "token-acquired-silently";
export const SUCCESSFUL_GET_ALL_ACCOUNTS_ID = "accounts-retrieved-successfully";

export async function fillPassword(page: Page, screenshot: Screenshot, password: string): Promise<void> {
    try {
        await page.locator('span ::-p-text(Use your password)').setTimeout(1000).click().catch(() => {});
        await screenshot.takeScreenshot(page, "passwordPage");
        await page.locator(`${Object.values(PasswordInputSelectors).join(", ")}`).setTimeout(5000).fill(password);
        await screenshot.takeScreenshot(page, "loginPagePasswordFilled");
    } catch (e) {
        await screenshot.takeScreenshot(page, "failedToFillPassword").catch(() => {});
        throw e;
    }
}

export async function fillUsername(page: Page, screenshot: Screenshot, username: string): Promise<void> {
    try {
        await screenshot.takeScreenshot(page, "loginPage");
        await page.locator(`${Object.values(UsernameSelectors).join(", ")}`).setTimeout(5000).fill(username);
        await screenshot.takeScreenshot(page, "loginPageUsernameFilled");
    } catch (e) {
        await screenshot.takeScreenshot(page, "failedToFillUsername").catch(() => {});
        throw e;
    }
}

export async function clickSubmitButton(page: Page, screenshot: Screenshot): Promise<void> {
    try {
        await Promise.all([
            page.waitForNavigation(WAIT_FOR_NAVIGATION_CONFIG).catch(() => {}),
            page.locator(`${Object.values(SubmitButtonSelectors).join(", ")}`).setTimeout(5000).click(),
        ]);
    } catch (e) {
        await screenshot.takeScreenshot(page, "errorClickingSubmit").catch(() => {});
        throw e;
    }
}

export async function enterCredentials(
    page: Page,
    screenshot: Screenshot,
    username: string,
    accountPwd: string
): Promise<void> {
    try {
        await page.waitForNavigation(WAIT_FOR_NAVIGATION_CONFIG).catch(() => {});
        await fillUsername(page, screenshot, username);
        await clickSubmitButton(page, screenshot);

        // agce: which type of account do you want to use
        try {
            await page.waitForSelector(HtmlSelectors.AAD_TITLE, { timeout: 1000 });
            await screenshot.takeScreenshot(page, "accountType");
            await Promise.all([
                page.waitForNavigation(WAIT_FOR_NAVIGATION_CONFIG),
                page.click(HtmlSelectors.AAD_TITLE),
            ]).catch(async (e) => {
                await screenshot.takeScreenshot(page, "errorPage").catch(() => {});
                throw e;
            });
        } catch (e) {
            //
        }

        await fillPassword(page, screenshot, accountPwd);
        await clickSubmitButton(page, screenshot);

        if (page.isClosed() || page.url().startsWith(SAMPLE_HOME_URL)) {
            return;
        }
        await screenshot.takeScreenshot(page, "passwordSubmitted");

        // agce: check if the "help us protect your account" dialog appears
        try {
            const selector =
                "#lightbox > div:nth-child(3) > div > div.pagination-view.has-identity-banner.animate.slide-in-next > div > div:nth-child(3) > a";
            await page.waitForSelector(selector, { timeout: 1000 });
            await page.click(selector);
        } catch (e) {
            // continue
        }

        // keep me signed in page
        try {
            await screenshot.takeScreenshot(page, "keepMeSignedInPage");
            await clickSubmitButton(page, screenshot);
        } catch (e) {
            return;
        }

        // agce: private tenant sign in page
        try {
            await screenshot.takeScreenshot(page, "privateTenantSignInPage");
            await clickSubmitButton(page, screenshot);
        } catch (e) {
            return;
        }
    } catch (e) {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => {});
        throw e;
    }
}

export async function approveRemoteConnect(
    page: Page,
    screenshot: Screenshot
): Promise<void> {
    try {
        await page.waitForSelector(HtmlSelectors.REMOTE_LOCATION_DESCRPITION);
        await clickSubmitButton(page, screenshot);
    } catch (e) {
        return;
    }
}

export async function enterCredentialsADFSWithConsent(
    page: Page,
    screenshot: Screenshot,
    username: string,
    accountPwd: string
): Promise<void> {
    await enterCredentialsADFS(page, screenshot, username, accountPwd);
    await approveConsent(page, screenshot);
}

export async function approveConsent(
    page: Page,
    screenshot: Screenshot
): Promise<void> {
    await clickSubmitButton(page, screenshot);
    await screenshot.takeScreenshot(page, "consentApproved");
}

export async function clickSignIn(
    page: Page,
    screenshot: Screenshot
): Promise<void> {
    await page.waitForSelector("#SignIn");
    await screenshot.takeScreenshot(page, "samplePageInit");
    await Promise.all([
        page.waitForNavigation(WAIT_FOR_NAVIGATION_CONFIG),
        page.click("#SignIn"),
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => {});
        throw e;
    });
    await screenshot.takeScreenshot(page, "signInClicked");
}

export async function enterCredentialsADFS(
    page: Page,
    screenshot: Screenshot,
    username: string,
    accountPwd: string
): Promise<void> {
    await page.waitForNavigation(WAIT_FOR_NAVIGATION_CONFIG).catch(() => {});
    await fillUsername(page, screenshot, username);
    await clickSubmitButton(page, screenshot);
    await page.waitForSelector(PasswordInputSelectors.PASSWORD_INPUT);
    await fillPassword(page, screenshot, accountPwd);
    await clickSubmitButton(page, screenshot);
}

export async function enterDeviceCode(
    page: Page,
    screenshot: Screenshot,
    code: string,
    deviceCodeUrl: string
): Promise<void> {
    await page.goto(deviceCodeUrl, {
        waitUntil: ["load", "domcontentloaded", "networkidle0"],
    });
    await page.waitForSelector(HtmlSelectors.DEVICE_OTC_INPUT_SELECTOR);
    await screenshot.takeScreenshot(page, "deviceCodePage");
    await page.type(HtmlSelectors.DEVICE_OTC_INPUT_SELECTOR, code);
    await clickSubmitButton(page, screenshot);
}

export async function validateCacheLocation(
    cacheLocation: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.readFile(cacheLocation, "utf-8", (err, data) => {
            if (err || data === "") {
                fs.writeFile(cacheLocation, "{}", (error) => {
                    if (error) {
                        console.log("Error writing to cache file: ", error);
                        reject();
                    } else {
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    });
}

export function checkTimeoutError(output: string): boolean {
    const timeoutErrorRegex = /user_timeout_reached/;
    return timeoutErrorRegex.test(output);
}

export async function clickLoginRedirect(
    screenshot: Screenshot,
    page: Page
): Promise<void> {
    await page.waitForSelector("#SignIn", { timeout: 5000 });
    // Home Page
    await screenshot.takeScreenshot(page, "samplePageInit");
    // Click Sign In
    await page.click("#SignIn");
    await screenshot.takeScreenshot(page, "signInClicked");
    // Click Sign In With Redirect
    await Promise.all([
        page.waitForNavigation(WAIT_FOR_NAVIGATION_CONFIG).catch(() => {}),
        page.click("#redirect"),
    ]);
}

export async function clickLogoutRedirect(
    screenshot: Screenshot,
    page: Page
): Promise<void> {
    await page.click("#SignIn");
    await screenshot.takeScreenshot(page, "signOutClicked");
    // Click Sign Out With Redirect
    await page.click("#redirect");
}

export async function clickLoginPopup(
    screenshot: Screenshot,
    page: Page
): Promise<[Page, Promise<void>]> {
    // Home Page
    await screenshot.takeScreenshot(page, "samplePageInit");
    // Click Sign In
    await page.click("#SignIn");
    await screenshot.takeScreenshot(page, "signInClicked");
    // Click Sign In With Popup
    const newPopupWindowPromise = new Promise<Page|null>((resolve) =>
        page.once("popup", resolve)
    );
    await page.click("#popup");
    const popupPage = await newPopupWindowPromise;
    if (!popupPage) {
        throw new Error('Popup window was not opened');
      }
    const popupWindowClosed = new Promise<void>((resolve) =>
        popupPage.once("close", resolve)
    );

    return [popupPage, popupWindowClosed];
}

export async function clickLogoutPopup(
    screenshot: Screenshot,
    page: Page
): Promise<[Page, Promise<void>]> {
    await page.click("#SignIn");
    await screenshot.takeScreenshot(page, "signOutClicked");
    // Click Sign Out With Popup
    const newPopupWindowPromise = new Promise<Page|null>((resolve) =>
        page.once("popup", resolve)
    );
    await page.click("#popup");
    const popupPage = await newPopupWindowPromise;
    if (!popupPage) {
        throw new Error('Popup window was not opened');
      }
    const popupWindowClosed = new Promise<void>((resolve) =>
        popupPage.once("close", resolve)
    );

    return [popupPage, popupWindowClosed];
}

export async function waitForReturnToApp(
    screenshot: Screenshot,
    page: Page,
    popupPage?: Page,
    popupWindowClosed?: Promise<void>
): Promise<void> {
    // Wait for token acquisition
    await page.waitForSelector("#scopes-acquired");
    await screenshot.takeScreenshot(page, "samplePageLoggedIn");
}

/**
 * Returns an instance of {@link puppeteer.Browser}.
 */
export async function getBrowser(): Promise<Browser> {
    // @ts-ignore
    return global.__BROWSER__;
}

/**
 * Returns a host url.
 */
export function getHomeUrl(): string {
    // @ts-ignore
    return `http://localhost:${global.__PORT__}/`;
}
