import { ElectronApplication, Page } from "playwright-core";
import * as fs from "fs";

export async function enterCredentials(page: Page, screenshot: Screenshot, username: string, accountPwd: string): Promise<void> {
    await Promise.all([
        page.waitForSelector("#i0116"),
        page.waitForSelector("#idSIButton9")
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => { });
        throw e;
    });

    await screenshot.takeScreenshot(page, "loginPage");
    await page.type("#i0116", username);
    await screenshot.takeScreenshot(page, "loginPageUsernameFilled")

    await Promise.all([
        page.waitForNavigation({ waitUntil: "load" }),
        page.waitForNavigation({ waitUntil: "domcontentloaded" }),
        page.waitForNavigation({ waitUntil: "networkidle" }).catch(() => { }),  // Wait for navigation but don't throw due to timeout
        page.click("#idSIButton9")
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => { });
        throw e;
    });

    await page.waitForSelector("#idA_PWD_ForgotPassword");
    await page.waitForSelector("#i0118");
    await page.waitForSelector("#idSIButton9");
    await screenshot.takeScreenshot(page, "pwdInputPage");
    await page.type("#i0118", accountPwd);
    await screenshot.takeScreenshot(page, "loginPagePasswordFilled");
    await page.click("#idSIButton9", { noWaitAfter: true });
}

export async function enterCredentialsADFS(page: Page, screenshot: Screenshot, username: string, accountPwd: string): Promise<void> {
    await Promise.all([
        page.waitForSelector("#i0116"),
        page.waitForSelector("#idSIButton9")
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => { });
        throw e;
    });

    await screenshot.takeScreenshot(page, "loginPageADFS");
    await page.type("#i0116", username);
    await screenshot.takeScreenshot(page, "loginPageUsernameFilled");

    await Promise.all([
        page.waitForNavigation({ waitUntil: "load" }),
        page.waitForNavigation({ waitUntil: "domcontentloaded" }),
        page.waitForNavigation({ waitUntil: "networkidle" }).catch(() => { }),  // Wait for navigation but don't throw due to timeout
        page.click("#idSIButton9")
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => { });
        throw e;
    });

    await page.waitForSelector("#passwordInput");
    await page.waitForSelector("#submitButton");
    await page.type("#passwordInput", accountPwd);
    await screenshot.takeScreenshot(page, "passwordEntered");

    await Promise.all([
        page.waitForNavigation({ waitUntil: "load" }),
        page.waitForNavigation({ waitUntil: "domcontentloaded" }),
        page.waitForNavigation({ waitUntil: "networkidle" }).catch(() => { }),  // Wait for navigation but don't throw due to timeout
        page.click("#submitButton")
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => { });
        throw e;
    });
}

export async function clickSignIn(electronApp: ElectronApplication, page: Page, screenshot: Screenshot): Promise<Page> {
    await page.waitForSelector("#SignIn")
    await screenshot.takeScreenshot(page, "samplePageInit");

    page.click("#SignIn");
    const popupPage = await electronApp.waitForEvent('window');

    await Promise.all([
        popupPage.waitForNavigation({ waitUntil: "load" }),
        popupPage.waitForNavigation({ waitUntil: "domcontentloaded" }),
        popupPage.waitForNavigation({ waitUntil: "networkidle" }).catch(() => { }), // Wait for navigation but don't throw due to timeout
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => { });
        throw e;
    });

    await screenshot.takeScreenshot(popupPage, "signInClicked");
    return popupPage;
}

export class Screenshot {
    private folderName: string;
    private screenshotNum: number;

    constructor(foldername: string) {
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

export async function retrieveAuthCodeUrlFromBrowserContext(page: Page): Promise<string> {
    const msgPromise = await page.waitForEvent("console", {
        predicate: async (message) => {
            const text = message.text();
            if (text.includes("https://login.microsoftonline.com/")) {
                return true;
            }
            return false;
        },
    });
    return msgPromise.text();
}