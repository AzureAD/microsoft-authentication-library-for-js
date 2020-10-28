import { Screenshot } from "../../../../../e2eTestUtils/TestUtils";
import { Page } from "puppeteer";

export async function enterCredentials(page: Page, screenshot: Screenshot, username: string, accountPwd: string): Promise<void> {
    await page.waitForNavigation({ waitUntil: "networkidle0"});
    await page.waitForSelector("#i0116");
    await screenshot.takeScreenshot(page, `loginPage`);
    await page.type("#i0116", username);
    await page.click("#idSIButton9");
    await page.waitForSelector("#idA_PWD_ForgotPassword");
    await screenshot.takeScreenshot(page, `pwdInputPage`);
    await page.type("#i0118", accountPwd);
    await page.click("#idSIButton9");
    await page.waitForNavigation({ waitUntil: "networkidle0"});
}

export async function clickSignIn(page: Page, screenshot: Screenshot): Promise<void> {
    await screenshot.takeScreenshot(page, "samplePageInit");
    await page.click("#SignIn");
    await screenshot.takeScreenshot(page, "signInClicked");
}