/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Screenshot } from "../../../../e2eTestUtils/TestUtils";
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
    await page.waitForSelector("#idSIButton9");
    await page.click("#idSIButton9");
}

export async function clickSignIn(page: Page, screenshot: Screenshot): Promise<void> {
    await screenshot.takeScreenshot(page, "samplePageInit");
    await page.click("#SignIn");
    await screenshot.takeScreenshot(page, "signInClicked");
}

export async function enterCredentialsADFS(page: Page, screenshot: Screenshot, username: string, accountPwd: string): Promise<void> {
    await page.waitForSelector("#i0116");
    await screenshot.takeScreenshot(page, "loginPage");
    await page.type("#i0116", username);
    await page.click("#idSIButton9");
    await page.waitForSelector("#userNameInput");
    await screenshot.takeScreenshot(page, "adfsUsernameInputPage");
    await page.type("#passwordInput", accountPwd);
    await page.click("#submitButton");
}

// Constants

export const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
export const SAMPLE_HOME_URL = "http://localhost:3000";
export const SUCCESSFUL_GRAPH_CALL_ID = "graph-called-successfully";
export const SUCCESSFUL_GET_ALL_ACCOUNTS_ID = "accounts-retrieved-successfully";