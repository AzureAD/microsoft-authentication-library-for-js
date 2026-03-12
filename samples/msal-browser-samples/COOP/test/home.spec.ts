import { chromium, Browser, Page, test, expect, Frame } from "@playwright/test";
import { ScreenShotElectron } from "e2e-test-utils";

const LOCAL_SCREENSHOT_FOLDER = `${__dirname}/screenshots`;

let browser: Browser;
let browserPage: Page;

test.beforeEach(async () => {
    browser = await chromium.launch({
        args: ["--allow-insecure-localhost"],
    });
    browserPage = await browser.newPage();
    await browserPage.goto("/");
});

test.afterEach(async () => {
    await browserPage.close();
});

test.afterAll(async () => {
    await browser.close();
});

test("Home page - Popup and Sso Silent buttons are loaded on home-page", async () => {
    const testName = "homePageLoad";
    console.log(`${LOCAL_SCREENSHOT_FOLDER}/${testName}`);
    const screenshot = new ScreenShotElectron(
        `${LOCAL_SCREENSHOT_FOLDER}/${testName}`
    );
    await screenshot.takeScreenshot(browserPage, "Page loaded");

    const popupButton = await browserPage.waitForSelector("#loginPopup");
    const ssoButton = await browserPage.waitForSelector("#sso");

    expect(popupButton).not.toBeNull();
    expect(ssoButton).not.toBeNull();
});

test("Popup Login Flow - Successful authentication and token acquisition", async () => {
    const testName = "popupLoginFlow";
    const screenshot = new ScreenShotElectron(
        `${LOCAL_SCREENSHOT_FOLDER}/${testName}`
    );

    await screenshot.takeScreenshot(browserPage, "App loaded");

    // Click the popup login button
    const loginButton = await browserPage.waitForSelector("#loginPopup");
    const newPopupWindowPromise = new Promise<Page | null>((resolve) =>
        browserPage.once("popup", resolve)
    );
    await loginButton.click();
    await screenshot.takeScreenshot(browserPage, "Login button clicked");
    await browserPage.waitForTimeout(1000);

    const popupPage = await newPopupWindowPromise;
    if (!popupPage) {
        throw new Error("Popup window was not opened");
    }
    await screenshot.takeScreenshot(popupPage, "Popup opened");

    await browserPage.waitForSelector("#successAuthCode", { timeout: 3000 });
    await browserPage.waitForSelector("#successMsg", { timeout: 3000 });

    await screenshot.takeScreenshot(
        browserPage,
        "Login successful - Welcome message displayed"
    );

    // Verify account info is displayed
    const successMessage = await browserPage.textContent("#successAuthCode");
    console.log("Welcome message:", successMessage);
    expect(successMessage).toContain("Authentication Successful");
    expect(successMessage).toContain("Test User");
});

test("ssoSilent Token Acquisition", async () => {
    const testName = "ssoSilentTokenAcquisition";
    const screenshot = new ScreenShotElectron(
        `${LOCAL_SCREENSHOT_FOLDER}/${testName}`
    );

    await screenshot.takeScreenshot(browserPage, "Initial page load");

    //add iframe listener
    const silentIframe = new Promise<Frame | null>((resolve) => {
        browserPage.once("frameattached", (frame) => {
            resolve(frame);
            console.log("Frame attached:", frame.url());
        });
    });

    // Click the SSO silent button
    const ssoButton = await browserPage.waitForSelector("#sso");
    await ssoButton.click();
    await screenshot.takeScreenshot(browserPage, "SSO button clicked");

    //wait for the iframe to be detected
    const frame = await silentIframe;

    if (!frame) {
        throw new Error("Silent iframe was not opened");
    }
    // Verify the iframe exists
    expect(frame).not.toBeNull();
    console.log("Silent iframe frame object:", frame.url());
    expect(frame.url()).toContain("/authorize");

    await browserPage.waitForSelector("#successAuthCode", { timeout: 3000 });
    await browserPage.waitForSelector("#successMsg", { timeout: 3000 });

    await screenshot.takeScreenshot(
        browserPage,
        "Silent token acquisition completed"
    );

    // Verify account info is displayed
    const successMessage = await browserPage.textContent("#successAuthCode");
    console.log("Welcome message:", successMessage);
    expect(successMessage).toContain("Authentication Successful");
    expect(successMessage).toContain("Test User");
});
