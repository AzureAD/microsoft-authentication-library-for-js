import * as fs from "fs";
import{ Page, HTTPResponse, WaitForOptions } from "puppeteer";
import { LabConfig } from "./LabConfig";
import { LabClient } from "./LabClient";

export const ONE_SECOND_IN_MS = 1000;
export const RETRY_TIMES = 5;
export const SAMPLE_HOME_URL = "http://localhost";

const WAIT_FOR_NAVIGATION_CONFIG: WaitForOptions = {
    waitUntil: ["load", "domcontentloaded", "networkidle0"],
};

export class Screenshot {
    private folderName: string;
    private screenshotNum: number;

    constructor (foldername: string) {
        this.folderName = foldername;
        this.screenshotNum = 0;
        createFolder(this.folderName);
    }

    async takeScreenshot(page: Page, screenshotName: string): Promise<void> {
        await page.screenshot({ path: `${this.folderName}/${++this.screenshotNum}_${screenshotName}.png` });
    }
}

export function createFolder(foldername: string) {
    if (!fs.existsSync(foldername)) {
        fs.mkdirSync(foldername, { recursive: true });
    }
}

export async function storagePoller(callback: ()=>Promise<void>, timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        let lastError: Error;
        const interval = setInterval(async () => {
            if ((Date.now() - startTime) > timeoutMs) {
                clearInterval(interval);
                console.error(lastError);
                reject(new Error("Timed out while polling storage"));
            }
            await callback().then(() => {
                // If callback resolves - success
                clearInterval(interval);
                resolve();
            }).catch((e: Error)=>{
                // If callback throws storage hasn't been updated yet - check again on next interval
                lastError = e;
            });
        }, 200);
    });
};

export async function retrieveAppConfiguration(labConfig: LabConfig, labClient: LabClient, isConfidentialClient: boolean): Promise<[string, string, string]> {
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
        if (!(labConfig.lab.labName && labConfig.app.appName)) {
            throw Error("No Labname and/or Appname provided!");
        }

        let secretAppName =`${labConfig.lab.labName}-${labConfig.app.appName}`;

        // Reformat the secret app name to kebab case from snake case
        while (secretAppName.includes("_")) secretAppName = secretAppName.replace("_", "-");

        const appClientSecret = await labClient.getSecret(secretAppName);

        clientSecret = appClientSecret.value;

        if (!clientSecret) {
            throw Error("Unable to get the client secret");
        }
    }

    return [clientID, clientSecret, authority];
}

export async function setupCredentials(labConfig: LabConfig, labClient: LabClient): Promise<[string, string]> {
    let username = "";
    let accountPwd = "";

    if (labConfig.user.upn) {
        username = labConfig.user.upn;
    }

    if (!labConfig.lab.labName) {
        throw Error("No Labname provided!");
    }

    const testPwdSecret = await labClient.getSecret(labConfig.lab.labName);

    accountPwd = testPwdSecret.value;

    if (!accountPwd) {
        throw "Unable to get account password!";
    }

    return [username, accountPwd];
}

export async function enterCredentials(
    page: Page,
    screenshot: Screenshot,
    username: string,
    accountPwd: string
): Promise<void> {
    await Promise.all([
        page.waitForNavigation(WAIT_FOR_NAVIGATION_CONFIG).catch(() => {}), // Wait for navigation but don't throw due to timeout
        page.waitForSelector("#i0116"),
        page.waitForSelector("#idSIButton9"),
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => {});
        throw e;
    });
    await screenshot.takeScreenshot(page, "loginPage");
    await page.type("#i0116", username);
    await screenshot.takeScreenshot(page, "loginPageUsernameFilled");
    await Promise.all([
        page.waitForNavigation(WAIT_FOR_NAVIGATION_CONFIG),
        page.click("#idSIButton9"),
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => {});
        throw e;
    });

    await page.waitForSelector("#idA_PWD_ForgotPassword");
    await page.waitForSelector("#i0118");
    await page.waitForSelector("#idSIButton9");
    await screenshot.takeScreenshot(page, "pwdInputPage");
    await page.type("#i0118", accountPwd);
    await screenshot.takeScreenshot(page, "loginPagePasswordFilled");
    await Promise.all([
        page.click("#idSIButton9"),

        // Wait either for another navigation to Keep me signed in page or back to redirectUri
        Promise.race([
            page.waitForNavigation(WAIT_FOR_NAVIGATION_CONFIG),
            page.waitForResponse(
                (response: HTTPResponse) =>
                    response.url().startsWith(SAMPLE_HOME_URL),
                { timeout: 0 }
            ),
        ]),
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => {});
        throw e;
    });

    if (page.url().startsWith(SAMPLE_HOME_URL)) {
        return;
    }
    await screenshot.takeScreenshot(page, "passwordSubmitted");

    // keep me signed in page
    try {
        const aadKmsi = page
            .waitForSelector("#idSIButton9", { timeout: 1000 })
            .then(() => {
                return "#idSIButton9";
            });
        const msaKmsi = page
            .waitForSelector("#kmsiTitle", { timeout: 1000 })
            .then(() => {
                return "#acceptButton";
            });
        const buttonTag = await Promise.race([aadKmsi, msaKmsi]);
        await screenshot.takeScreenshot(page, "keepMeSignedInPage");
        await Promise.all([
            page.waitForNavigation(WAIT_FOR_NAVIGATION_CONFIG),
            page.click(buttonTag),
        ]).catch(async (e) => {
            await screenshot.takeScreenshot(page, "errorPage").catch(() => {});
            throw e;
        });
    } catch (e) {
        return;
    }
}

export async function b2cLocalAccountEnterCredentials(page: Page, screenshot: Screenshot, username: string, accountPwd: string) {
    await page.waitForSelector("#logonIdentifier");
    await screenshot.takeScreenshot(page, "b2cSignInPage");
    await page.type("#logonIdentifier", username);
    await page.type("#password", accountPwd);
    await page.click("#next");
}

export async function b2cAadPpeAccountEnterCredentials(page: Page, screenshot: Screenshot, username: string, accountPwd: string): Promise<void> {
    await page.waitForSelector("#MSIDLAB4_AzureAD");
    await screenshot.takeScreenshot(page, "b2cSignInPage");
    // Select Lab Provider
    await page.click("#MSIDLAB4_AzureAD");
    // Enter credentials
    await enterCredentials(page, screenshot, username, accountPwd);
}

export async function b2cMsaAccountEnterCredentials(page: Page, screenshot: Screenshot, username: string, accountPwd: string): Promise<void> {
    await page.waitForSelector("#MicrosoftAccountExchange");
    await screenshot.takeScreenshot(page, "b2cSignInPage");
    // Select Lab Provider
    await page.click("#MicrosoftAccountExchange");
    // Enter credentials
    await enterCredentials(page, screenshot, username, accountPwd);
}
