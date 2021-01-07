import { Screenshot } from "../../../../../e2eTestUtils/TestUtils";
import { Page } from "puppeteer";

export async function enterCredentials(page: Page, screenshot: Screenshot, username: string, accountPwd: string): Promise<void> {
    await page.waitForNavigation({ waitUntil: "networkidle0"});
    await page.waitForSelector("#i0116");
    await screenshot.takeScreenshot(page, "loginPage");
    await page.type("#i0116", username);
    await page.click("#idSIButton9");
    await page.waitForSelector("#idA_PWD_ForgotPassword");
    await screenshot.takeScreenshot(page, "pwdInputPage");
    await page.type("#i0118", accountPwd);
    await page.click("#idSIButton9");
    try {
        await page.waitForSelector('#KmsiCheckboxField', {timeout: 1000});
        await screenshot.takeScreenshot(page, "kmsiPage");
        await Promise.all([
            page.click("#idSIButton9"),
            page.waitForNavigation({ waitUntil: "networkidle0"})
        ]);
    } catch (e) {
        return;
    }
}

export async function b2cAadPpeEnterCredentials(page: Page, screenshot: Screenshot, username: string, accountPwd: string): Promise<void> {
    await page.waitForSelector("#MSIDLAB4_AzureAD");
    await screenshot.takeScreenshot(page, "b2cSignInPage");
    // Select Lab Provider
    await page.click("#MSIDLAB4_AzureAD");
    // Enter credentials
    await enterCredentials(page, screenshot, username, accountPwd);
}

export async function b2cLocalAccountEnterCredentials(page: Page, screenshot: Screenshot, username: string, accountPwd: string) {
    await page.waitForSelector("#logonIdentifier");
    await screenshot.takeScreenshot(page, "b2cSignInPage");
    await page.type("#logonIdentifier", username);
    await page.type("#password", accountPwd);
    await page.click("#next");
}

export async function clickLoginRedirect(screenshot: Screenshot, page: Page): Promise<void> {
    // Home Page
    await screenshot.takeScreenshot(page, "samplePageInit");
    // Click Sign In
    await page.click("#SignIn");
    await screenshot.takeScreenshot(page, "signInClicked");
    // Click Sign In With Redirect
    await page.click("#loginRedirect");
}

export async function clickLoginPopup(screenshot: Screenshot, page: Page): Promise<[Page, Promise<void>]> {
    // Home Page
    await screenshot.takeScreenshot(page, "samplePageInit");
    // Click Sign In
    await page.click("#SignIn");
    await screenshot.takeScreenshot(page, "signInClicked");
    // Click Sign In With Popup
    const newPopupWindowPromise = new Promise<Page>(resolve => page.once("popup", resolve));
    await page.click("#loginPopup");
    const popupPage = await newPopupWindowPromise;
    const popupWindowClosed = new Promise<void>(resolve => popupPage.once("close", resolve));

    return [popupPage, popupWindowClosed];
}

export async function waitForReturnToApp(screenshot: Screenshot, page: Page, popupPage?: Page, popupWindowClosed?: Promise<void>): Promise<void> {
    if (popupPage && popupWindowClosed) {
        // Wait until popup window closes and see that we are logged in
        await popupWindowClosed;
        await page.waitFor(500);
    }

    // Wait for token acquisition
    await page.waitForSelector("#scopes-acquired");
    await screenshot.takeScreenshot(page, "samplePageLoggedIn");
}