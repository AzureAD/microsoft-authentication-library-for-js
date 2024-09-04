import { ElectronApplication, Page } from "playwright-core";
import * as fs from "fs";
import { HtmlSelectors } from "./Constants";

export async function enterCredentials(
    page: Page,
    screenshot: Screenshot,
    username: string,
    accountPwd: string
): Promise<void> {
    await Promise.all([
        page.waitForSelector(HtmlSelectors.USERNAME_INPUT),
        page.waitForSelector(HtmlSelectors.BUTTON9SELECTOR),
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => {});
        throw e;
    });

    await screenshot.takeScreenshot(page, "loginPage");
    await page.type(HtmlSelectors.USERNAME_INPUT, username);
    await screenshot.takeScreenshot(page, "loginPageUsernameFilled");

    await Promise.all([
        page.waitForNavigation({ waitUntil: "load" }),
        page.waitForNavigation({ waitUntil: "domcontentloaded" }),
        page.waitForNavigation({ waitUntil: "networkidle" }).catch(() => {}), // Wait for navigation but don't throw due to timeout
        page.click(HtmlSelectors.BUTTON9SELECTOR),
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => {});
        throw e;
    });

    await page.waitForSelector(HtmlSelectors.FORGOT_PASSWORD_LINK);
    await page.waitForSelector(HtmlSelectors.PASSWORD_INPUT_TEXTBOX);
    await page.waitForSelector(HtmlSelectors.BUTTON9SELECTOR);
    await screenshot.takeScreenshot(page, "pwdInputPage");
    await page.type(HtmlSelectors.PASSWORD_INPUT_TEXTBOX, accountPwd);
    await screenshot.takeScreenshot(page, "loginPagePasswordFilled");
    await page.click(HtmlSelectors.BUTTON9SELECTOR, { noWaitAfter: true });
}

export async function enterCredentialsADFS(
    page: Page,
    screenshot: Screenshot,
    username: string,
    accountPwd: string
): Promise<void> {
    await Promise.all([
        page.waitForSelector(HtmlSelectors.USERNAME_INPUT),
        page.waitForSelector(HtmlSelectors.BUTTON9SELECTOR),
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => {});
        throw e;
    });

    await screenshot.takeScreenshot(page, "loginPageADFS");
    await page.type(HtmlSelectors.USERNAME_INPUT, username);
    await screenshot.takeScreenshot(page, "loginPageUsernameFilled");

    await Promise.all([
        page.waitForNavigation({ waitUntil: "load" }),
        page.waitForNavigation({ waitUntil: "domcontentloaded" }),
        page.waitForNavigation({ waitUntil: "networkidle" }).catch(() => {}), // Wait for navigation but don't throw due to timeout
        page.click(HtmlSelectors.BUTTON9SELECTOR),
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => {});
        throw e;
    });

    await page.waitForSelector(HtmlSelectors.PASSWORD_INPUT_SELECTOR);
    await page.waitForSelector(HtmlSelectors.CREDENTIALS_SUBMIT_BUTTON);
    await page.type(HtmlSelectors.PASSWORD_INPUT_SELECTOR, accountPwd);
    await screenshot.takeScreenshot(page, "passwordEntered");

    await Promise.all([
        page.waitForNavigation({ waitUntil: "load" }),
        page.waitForNavigation({ waitUntil: "domcontentloaded" }),
        page.waitForNavigation({ waitUntil: "networkidle" }).catch(() => {}), // Wait for navigation but don't throw due to timeout
        page.click(HtmlSelectors.CREDENTIALS_SUBMIT_BUTTON),
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => {});
        throw e;
    });
}

export async function clickSignIn(
    electronApp: ElectronApplication,
    page: Page,
    screenshot: Screenshot
): Promise<Page> {
    await page.waitForSelector("#SignIn");
    await screenshot.takeScreenshot(page, "samplePageInit");

    page.click("#SignIn");
    const popupPage = await electronApp.waitForEvent("window");

    await Promise.all([
        popupPage.waitForNavigation({ waitUntil: "load" }),
        popupPage.waitForNavigation({ waitUntil: "domcontentloaded" }),
        popupPage
            .waitForNavigation({ waitUntil: "networkidle" })
            .catch(() => {}), // Wait for navigation but don't throw due to timeout
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => {});
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
        await page.screenshot({
            path: `${this.folderName}/${++this
                .screenshotNum}_${screenshotName}.png`,
        });
    }
}

export function createFolder(foldername: string) {
    if (!fs.existsSync(foldername)) {
        fs.mkdirSync(foldername, { recursive: true });
    }
}

export async function retrieveAuthCodeUrlFromBrowserContext(
    page: Page
): Promise<string> {
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
