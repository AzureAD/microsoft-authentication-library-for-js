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

export async function setupCredentials(labConfig: LabConfig, labClient: LabClient): Promise<[string, string]> {
    let username = "";
    let accountPwd = "";

    if (labConfig.user.upn) {
        username = labConfig.user.upn;
    }

    const testPwdSecret = await labClient.getSecret(labConfig.lab.labName);

    accountPwd = testPwdSecret.value;

    if (!accountPwd) {
        throw "Unable to get account password!";
    }

    return [username, accountPwd];
}

export async function enterCredentials(page: Page, screenshot: Screenshot, username: string, accountPwd: string): Promise<void> {
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        page.waitForSelector("#i0116")
    ]);
    await screenshot.takeScreenshot(page, "loginPage");
    await page.type("#i0116", username);
    await Promise.all([
        page.click("#idSIButton9"),
        page.waitForNavigation({ waitUntil: "networkidle0" })
    ]);
    await page.waitForSelector("#idA_PWD_ForgotPassword");
    await screenshot.takeScreenshot(page, "pwdInputPage");
    await page.type("#i0118", accountPwd);
    await Promise.all([
        page.click("#idSIButton9"),

        // Wait either for another navigation to Keep me signed in page or back to redirectUri
        Promise.race([
            page.waitForNavigation({ waitUntil: "networkidle0" }),
            page.waitForResponse((response: HTTPResponse) => response.url().startsWith("http://localhost"), { timeout: 0 })
        ])
    ]);

    if (page.url().startsWith("http://localhost")) {
        return;
    }

    await page.waitForSelector('#KmsiCheckboxField', {timeout: 1000});
    await screenshot.takeScreenshot(page, "kmsiPage");
    await Promise.all([
        page.waitForResponse((response: HTTPResponse) => response.url().startsWith("http://localhost")),
        page.click('#idSIButton9')
    ]);
}
