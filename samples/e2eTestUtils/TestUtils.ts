import * as fs from "fs";
import{ Page, HTTPResponse } from "puppeteer";
import { LabConfig } from "./LabConfig";
import { LabClient } from "./LabClient";

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

export async function enterCredentials(page: Page, screenshot: Screenshot, username: string, accountPwd: string): Promise<void> {
    try {
        await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 10000});
        await page.waitForSelector("input#i0116.input.text-box");
    } catch (e) {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => {});
        throw e;
    };
    await page.type("input#i0116.input.text-box", username);
    await page.waitForSelector("input#idSIButton9");
    await screenshot.takeScreenshot(page, "loginPage");
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        page.click("input#idSIButton9")
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => {});
        throw e;
    });
    await page.waitForSelector("#idA_PWD_ForgotPassword");
    await page.waitForSelector("input#i0118.input.text-box");
    await page.waitForSelector("input#idSIButton9");
    await screenshot.takeScreenshot(page, "pwdInputPage");
    await page.type("input#i0118.input.text-box", accountPwd);
    await Promise.all([
        page.click("input#idSIButton9"),

        // Wait either for another navigation to Keep me signed in page or back to redirectUri
        Promise.race([
            page.waitForNavigation({ waitUntil: "networkidle0" }),
            page.waitForResponse((response: HTTPResponse) => response.url().startsWith("http://localhost"), { timeout: 0 })
        ])
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => {});
        throw e;
    });

    if (page.url().startsWith("http://localhost")) {
        return;
    }

    await page.waitForSelector('input#KmsiCheckboxField', {timeout: 1000});
    await page.waitForSelector("input#idSIButton9");
    await screenshot.takeScreenshot(page, "kmsiPage");
    await Promise.all([
        page.waitForResponse((response: HTTPResponse) => response.url().startsWith("http://localhost")),
        page.click('input#idSIButton9')
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => {});
        throw e;
    });
}
