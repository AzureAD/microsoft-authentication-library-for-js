/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Screenshot } from "../e2eTestUtils/TestUtils";
import { Page } from "puppeteer";
import fs from "fs";

// Constants
export const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
export const SAMPLE_HOME_URL = "http://localhost";
export const SUCCESSFUL_GRAPH_CALL_ID = "graph-called-successfully";
export const SUCCESSFUL_GET_ALL_ACCOUNTS_ID = "accounts-retrieved-successfully";

export async function enterCredentials(page: Page, screenshot: Screenshot, username: string, accountPwd: string): Promise<void> {
    await page.waitForSelector("#i0116");
    await screenshot.takeScreenshot(page, "loginPage");
    await page.type("#i0116", username);
    await screenshot.takeScreenshot(page, "loginPageUsernameFilled")
    await page.click("#idSIButton9");
    await page.waitForSelector("#idA_PWD_ForgotPassword");
    await page.waitForSelector("#idSIButton9");
    await screenshot.takeScreenshot(page, "pwdInputPage");
    await page.type("#i0118", accountPwd);
    await screenshot.takeScreenshot(page, "loginPagePasswordFilled")
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

export async function approveRemoteConnect(page: Page, screenshot: Screenshot): Promise<void> {
    try {
        await page.waitForSelector("#remoteConnectDescription");
        await screenshot.takeScreenshot(page, "remoteConnectPage");
        await Promise.all([
            page.click("#remoteConnectSubmit"),
            page.waitForNavigation({ waitUntil: "networkidle0"})
        ]);
    } catch (e) {
        return;
    }
}

export async function enterCredentialsWithConsent(page: Page, screenshot: Screenshot, username: string, accountPwd: string): Promise<void> {
    await this.enterCredentials(page, screenshot, username, accountPwd);
    await this.approveConsent(page, screenshot);
}

export async function enterCredentialsADFSWithConsent(page: Page, screenshot: Screenshot, username: string, accountPwd: string): Promise<void> {
    await this.enterCredentialsADFS(page, screenshot, username, accountPwd);
    await this.approveConsent(page, screenshot);
}

export async function approveConsent(page: Page, screenshot: Screenshot): Promise<void> {
    await page.waitForSelector("#idSIButton9");
    await page.click("#idSIButton9");
    await takeScreenshotAfter(2000, screenshot, page, 'consentApproved'); 
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
    await takeScreenshotAfter(2000, screenshot, page, `pwdSubmitted`);
}

export async function enterDeviceCode(page: Page, screenshot: Screenshot, code: string, deviceCodeUrl: string): Promise<void> {
    await page.goto(deviceCodeUrl);
    await page.waitForSelector("#otc");
    await screenshot.takeScreenshot(page, 'deviceCodePage');
    await page.type("#otc", code);
    await page.click("#idSIButton9");
}

export function takeScreenshotAfter(duration: number, screenshot: Screenshot, page: Page, label: string): Promise<void> {
    return new Promise(resolve => setTimeout(() => screenshot.takeScreenshot(page, label).then(() => resolve()), duration));
}

export async function validateCacheLocation(cacheLocation: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.readFile(cacheLocation, "utf-8", (err, data) => {
            if (err || data === "") {
                fs.writeFile(cacheLocation, "{}", (error) => {
                    if (error) {
                        console.log("Error writing to cache file: ", error);
                        reject();
                    } else {
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    });
}

export function checkTimeoutError(output: string): boolean {
    const timeoutErrorRegex = /user_timeout_reached/;
    return timeoutErrorRegex.test(output);
}