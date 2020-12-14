import { Screenshot } from "../../../../e2eTestUtils/TestUtils";
import { Page } from "puppeteer";

export const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
export const SAMPLE_HOME_URL = 'http://localhost:3000';
export const SUCCESSFUL_GRAPH_CALL_ID = "graph-called-successfully";
export const SUCCESSFUL_GET_ALL_ACCOUNTS_ID = "accounts-retrieved-successfully";
export const DEVICE_LOGIN_URL = 'https://microsoft.com/devicelogin';

export async function enterCredentials(page: Page, screenshot: Screenshot, username: string, accountPwd: string): Promise<void> {
    await page.waitForSelector("#i0116");
    await screenshot.takeScreenshot(page, `loginPage`);
    await page.type("#i0116", username);
    await page.click("#idSIButton9");
    await page.waitForSelector("#idSIButton9"); 
    await screenshot.takeScreenshot(page, `pwdInputPage`);
    await page.type("#i0118", accountPwd);
    await screenshot.takeScreenshot(page, `pwdFilledOut`);
    await page.click("#idSIButton9");
    await takeScreenshotAfter(3000, screenshot, page, `pwdSubmitted`)
}

export async function clickSignIn(page: Page, screenshot: Screenshot): Promise<void> {
    await screenshot.takeScreenshot(page, "samplePageInit");
    await page.click("#SignIn");
    await screenshot.takeScreenshot(page, "signInClicked");
}

export async function enterCredentialsADFS(page: Page, screenshot: Screenshot, username: string, accountPwd: string): Promise<void> {
    await page.waitForSelector("#i0116");
    await screenshot.takeScreenshot(page, `loginPage`);
    await page.type("#i0116", username);
    await page.click("#idSIButton9");
    await page.waitForSelector("#userNameInput");
    await screenshot.takeScreenshot(page, `adfsUsernameInputPage`);
    await page.type("#passwordInput", accountPwd);
    await page.click("#submitButton");
}


export async function enterDeviceCode(page: Page, screenshot: Screenshot, code: string, deviceCodeUrl: string): Promise<void> {
    await page.goto(deviceCodeUrl);
    await page.waitForSelector("#otc");
    await screenshot.takeScreenshot(page, 'deviceCodePage');
    await page.type("#otc", code);
    await page.click("#idSIButton9");
}

export function extractDeviceCode(output: string): string | null {
    if ((/code (?<code>\w+)/).test(output)) {
        const matches = output.match(/code (?<code>\w+)/);
        return matches.groups.code;
    }

    return null;
}

export function takeScreenshotAfter(duration: number, screenshot: Screenshot, page: Page, label: string): Promise<void> {
    return new Promise(resolve => setTimeout(() => screenshot.takeScreenshot(page, label).then(() => resolve()), duration));
}