/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Screenshot } from "../../../../e2eTestUtils/TestUtils";
import { Page } from "puppeteer";

// Constants
export const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
export const SAMPLE_HOME_URL = "http://localhost:3000";
export const SUCCESSFUL_GRAPH_CALL_ID = "graph-called-successfully";
export const SUCCESSFUL_GET_ALL_ACCOUNTS_ID = "accounts-retrieved-successfully";

export async function enterCredentials(page: Page, screenshot: Screenshot, username: string, accountPwd: string): Promise<void> {
    await page.waitForSelector("#i0116");
    await screenshot.takeScreenshot(page, "loginPage");
    await page.type("#i0116", username);
    await page.click("#idSIButton9");
    await page.waitForSelector("#idA_PWD_ForgotPassword");
    await screenshot.takeScreenshot(page, "pwdInputPage");
    await page.type("#i0118", accountPwd);
    // await page.click("#idSIButton9");
    // await takeScreenshotAfter(6000, screenshot, page, `pwdSubmitted`);
    await screenshot.takeScreenshot(page, "pwdTyped");
    const signInButton = 'input[type="submit"]';
    await page.waitForSelector(signInButton);
    await page.evaluate((signInButton) => document.querySelector(signInButton).click(), signInButton);
    await screenshot.takeScreenshot(page, "pwdSubmitted");
}

export async function clickSignIn(page: Page, screenshot: Screenshot): Promise<void> {
    await screenshot.takeScreenshot(page, "samplePageInit");
    await page.click("#SignIn");
    await screenshot.takeScreenshot(page, "signInClicked");
}

export async function enterCredentialsADFS(page: Page, screenshot: Screenshot, username: string, accountPwd: string): Promise<void> {
    await page.waitForSelector("#i0116");
    await screenshot.takeScreenshot(page, "loginPageADFS");
    await page.type("#i0116", username);
    await page.click("#idSIButton9");
    await page.waitForSelector("#userNameInput");
    await screenshot.takeScreenshot(page, "adfsUsernameInputPage");
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

export function extractDeviceCodeParameters(output: string): { deviceCode: string, deviceLoginUrl: string } | null {
    const deviceLoginUrlRegex = /(?<url>(https?|chrome):\/\/[^\s$.?#].[^\s]*)/;
    const deviceCodeRegex = /code (?<code>\w+)/

    if (deviceCodeRegex.test(output) && deviceLoginUrlRegex.test(output)) {
        const deviceCode = output.match(deviceCodeRegex).groups.code;
        const deviceLoginUrl = output.match(deviceLoginUrlRegex).groups.url;

        return {
            deviceCode,
            deviceLoginUrl,
        };
    }

    return null;
}

export function takeScreenshotAfter(duration: number, screenshot: Screenshot, page: Page, label: string): Promise<void> {
    return new Promise(resolve => setTimeout(() => screenshot.takeScreenshot(page, label).then(() => resolve()), duration));
}