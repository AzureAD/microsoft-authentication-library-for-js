/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import "jest";
import puppeteer from "puppeteer";
import { Screenshot, createFolder, setupCredentials } from "../../../../../e2eTestUtils/TestUtils";
import { NodeCacheTestUtils } from "../../../../../e2eTestUtils/NodeCacheTestUtils";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AppTypes, AzureEnvironments } from "../../../../../e2eTestUtils/Constants";
import { 
    clickSignIn,
    enterCredentials,
    SCREENSHOT_BASE_FOLDER_NAME,
    SAMPLE_HOME_URL,
    SUCCESSFUL_GRAPH_CALL_ID, 
    SUCCESSFUL_GET_ALL_ACCOUNTS_ID } from "../testUtils";

let username: string;
let accountPwd: string;

const TEST_CACHE_LOCATION = `${__dirname}/data/testCache.json`;

describe("Silent Flow AAD PPE Tests", () => {
    jest.retryTimes(1);

    let browser: puppeteer.Browser;
    beforeAll(async () => {
        const labApiParms: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.PPE,
            appType: AppTypes.CLOUD
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParms);
        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        
        browser = await puppeteer.launch({
            headless: true,
            ignoreDefaultArgs: ["--no-sandbox", "-disable-setuid-sandbox"]
        });
    });

    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;

    afterAll(async () => {
        await browser.close();
    });

    beforeEach(async () => {
        context = await browser.createIncognitoBrowserContext();
        page = await context.newPage();
        page.setDefaultNavigationTimeout(0);
        await page.goto(SAMPLE_HOME_URL);
    });

    afterEach(async () => {
        await page.close();
        await context.close();
        NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
    });

    it("Performs acquire token silent", async () => {
        const testName = "AADAcquireTokenSilent";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
        await clickSignIn(page, screenshot);
        await enterCredentials(page, screenshot, username, accountPwd);
        await page.waitForSelector("#acquireTokenSilent");
        await screenshot.takeScreenshot(page, "ATS");
        await page.click("#acquireTokenSilent");
        await page.waitForSelector("#graph-called-successfully");
        await screenshot.takeScreenshot(page, "acquireTokenSilentGotTokens");
        const htmlBody = await page.evaluate(() => document.body.innerHTML);
        expect(htmlBody).toContain(SUCCESSFUL_GRAPH_CALL_ID);
    });

    it("Refreshes an expired access token", async () => {
        const testName = "AADRefreshExpiredToken";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
        await clickSignIn(page, screenshot);
        await enterCredentials(page, screenshot, username, accountPwd);
        await page.waitForSelector("#acquireTokenSilent");
        const originalAccessToken = NodeCacheTestUtils.getAccessTokens(TEST_CACHE_LOCATION)[0].token;
        NodeCacheTestUtils.expireAccessTokens(TEST_CACHE_LOCATION);
        const expiredAccessToken = NodeCacheTestUtils.getAccessTokens(TEST_CACHE_LOCATION)[0].token;
        await page.click("#acquireTokenSilent");
        await page.waitForSelector(`#${SUCCESSFUL_GRAPH_CALL_ID}`);
        const refreshedAccessToken = NodeCacheTestUtils.getAccessTokens(TEST_CACHE_LOCATION)[0].token;
        await screenshot.takeScreenshot(page, "acquireTokenSilentGotTokens");
        const htmlBody = await page.evaluate(() => document.body.innerHTML);
        expect(htmlBody).toContain(SUCCESSFUL_GRAPH_CALL_ID);
        expect(Number(originalAccessToken.expiresOn)).toBeGreaterThan(0);
        expect(Number(expiredAccessToken.expiresOn)).toBe(0);
        expect(Number(refreshedAccessToken.expiresOn)).toBeGreaterThan(0);
        expect(refreshedAccessToken.secret).not.toEqual(originalAccessToken.secret);
    });

    it("Gets all accounts", async () => {
        const testName = "AADGetAllAccounts";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
        await clickSignIn(page, screenshot);
        await enterCredentials(page, screenshot, username, accountPwd);
        await page.waitForSelector("#getAllAccounts");
        await page.click("#getAllAccounts");
        await page.waitForSelector(`#${SUCCESSFUL_GET_ALL_ACCOUNTS_ID}`);
        await screenshot.takeScreenshot(page, "gotAllAccounts");
        const accounts  = await page.evaluate(() => JSON.parse(document.getElementById("nav-tabContent").children[0].innerHTML));
        const htmlBody = await page.evaluate(() => document.body.innerHTML);
        expect(htmlBody).toContain(SUCCESSFUL_GET_ALL_ACCOUNTS_ID);
        expect(htmlBody).not.toContain("No accounts found in the cache.");
        expect(htmlBody).not.toContain("Failed to get accounts from cache.");
        expect(accounts.length).toBe(1);
    });

    it("Returns empty account array", async () => {
        const testName = "AADNoCachedAccounts";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
        await page.goto(`${SAMPLE_HOME_URL}/allAccounts`);
        await page.waitForSelector("#getAllAccounts");
        await page.click("#getAllAccounts");
        await screenshot.takeScreenshot(page, "gotAllAccounts");
        const accounts  = await page.evaluate(() => JSON.parse(document.getElementById("nav-tabContent").children[0].innerHTML));
        const htmlBody = await page.evaluate(() => document.body.innerHTML);
        expect(htmlBody).toContain("No accounts found in the cache.");
        expect(htmlBody).not.toContain("Failed to get accounts from cache.");
        expect(accounts.length).toBe(0);
    });
});