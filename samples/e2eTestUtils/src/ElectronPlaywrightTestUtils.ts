import { ElectronApplication, ElementHandle, Page } from "playwright-core";
import * as fs from "fs";
import { HtmlSelectors, PasswordInputSelectors, SubmitButtonSelectors, UsernameSelectors } from "./Constants";

export async function getUsernameInput(page: Page): Promise<ElementHandle> {
    const usernameInput = await Promise.any([
        page.waitForSelector(
            UsernameSelectors.I0116),
        page.waitForSelector(
            UsernameSelectors.USERNAME_ENTRY),
        page.waitForSelector(
            UsernameSelectors.LOGON_IDENTIFIER)
    ]).catch(() => {
        throw new Error("Username input not found");
    });

    return usernameInput;
}

export async function getSubmitButton(page: Page): Promise<ElementHandle> {
    const submitButton = await Promise.any([
        page.waitForSelector(SubmitButtonSelectors.IDSIBUTTON9),
        page.waitForSelector(SubmitButtonSelectors.NEXT),
        page.waitForSelector(SubmitButtonSelectors.ACCEPTBUTTON),
        page.waitForSelector(SubmitButtonSelectors.REMOTE_CONNECT_SUBMIT),
        page.waitForSelector(SubmitButtonSelectors.SUBMITBUTTON),
        page.waitForSelector(SubmitButtonSelectors.SUBMIT),
    ]).catch(() => {
        throw new Error("Submit button not found");
    });

    return submitButton;
}

export async function getPasswordInput(page: Page): Promise<ElementHandle> {
    const passwordInput = await Promise.any([
        page.waitForSelector(PasswordInputSelectors.PASSWORD),
        page.waitForSelector(PasswordInputSelectors.PASSWORD_INPUT),
        page.waitForSelector(PasswordInputSelectors.I0118),
        page.waitForSelector(PasswordInputSelectors.PASSWORDENTRY),
    ]).catch(() => {
        throw new Error("Password input not found");
    });
    return passwordInput;
}

export async function enterCredentials(
    page: Page,
    screenshot: Screenshot,
    username: string,
    accountPwd: string
): Promise<void> {
    const usernameInput = await getUsernameInput(page);
    await screenshot.takeScreenshot(page, "loginPage");
    await usernameInput.fill(username);
    await screenshot.takeScreenshot(page, "loginPageUsernameFilled");
    let submitButton = await getSubmitButton(page);

    await Promise.all([
        page.waitForNavigation({ waitUntil: "load" }),
        page.waitForNavigation({ waitUntil: "domcontentloaded" }),
        page.waitForNavigation({ waitUntil: "networkidle" }).catch(() => {}), // Wait for navigation but don't throw due to timeout
        submitButton.click(),
    ]).catch(async (e) => {
        await screenshot.takeScreenshot(page, "errorPage").catch(() => {});
        throw e;
    });

    const passwordInput = await getPasswordInput(page);    
    await screenshot.takeScreenshot(page, "pwdInputPage");
    await passwordInput.fill(accountPwd);
    await screenshot.takeScreenshot(page, "loginPagePasswordFilled");
    submitButton = await getSubmitButton(page);
    await submitButton.click({ noWaitAfter: true });
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
    private enabled: boolean;

    constructor(foldername: string) {
        this.folderName = foldername;
        this.screenshotNum = 0;
        this.enabled = process.env.ENABLE_E2E_SCREENSHOTS === "true";
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
