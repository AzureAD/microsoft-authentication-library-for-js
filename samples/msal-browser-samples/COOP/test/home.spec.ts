import { chromium, Browser, Page, test, expect } from "@playwright/test";
import {
    NodeCacheTestUtils,
    ScreenShotElectron,
    validateCacheLocation,
} from "e2e-test-utils";

const TEST_CACHE_LOCATION = `${__dirname}/../data/cache.json`;
const LOCAL_SCREENSHOT_FOLDER = `${__dirname}/screenshots`;

let browser: Browser;
let browserPage: Page;

// test.beforeAll(async () => {
//     await validateCacheLocation(TEST_CACHE_LOCATION);
// });

test.beforeEach(async () => {
    browser = await chromium.launch({
        args: ["--allow-insecure-localhost"],
    });
    browserPage = await browser.newPage();
    await browserPage.goto("/");
});

test.afterEach(async () => {
    await browserPage.close();
    //await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
});

test.afterAll(async () => {
    await browser.close();
});

// test("Home page - Popup and Sso Silent buttons are loaded on home-page", async () => {
//     const testName = "homePageLoad";
//     console.log(`${LOCAL_SCREENSHOT_FOLDER}/${testName}`);
//     const screenshot = new ScreenShotElectron(
//         `${LOCAL_SCREENSHOT_FOLDER}/${testName}`
//     );
//     await screenshot.takeScreenshot(browserPage, "Page loaded");

//     const popupButton = await browserPage.waitForSelector("#loginPopup");
//     const ssoButton = await browserPage.waitForSelector("#sso");

//     expect(popupButton).not.toBeNull();
//     expect(ssoButton).not.toBeNull();
// });

test("Popup Login Flow - Successful authentication and token acquisition", async () => {
    const testName = "popupLoginFlow";
    const screenshot = new ScreenShotElectron(
        `${LOCAL_SCREENSHOT_FOLDER}/${testName}`
    );

    await screenshot.takeScreenshot(browserPage, "App loaded");

    // Click the popup login button
    const loginButton = await browserPage.waitForSelector("#loginPopup");
    await loginButton.click();
    await screenshot.takeScreenshot(browserPage, "Login button clicked");

    const newPopupWindowPromise = new Promise<Page | null>((resolve) =>
        browserPage.once("popup", resolve)
    );

    console.log("opening popup");

    const popupPage = await newPopupWindowPromise;
    console.log("popupPage", popupPage);
    if (!popupPage) {
        throw new Error("Popup window was not opened");
    }
    await screenshot.takeScreenshot(popupPage, "Popup opened");
    console.log("added delay to observe popup, screenshot taken");
    // Add 2 second delay to observe popup behavior
    await popupPage.waitForTimeout(2000);

    const popupWindowClosed = popupPage.waitForEvent("close");
    console.log("waiting for popup to close");
    // Wait for popup to close (indicates successful authentication)
    await popupWindowClosed; // Wait for return to app and verify login success

    expect(popupPage.isClosed()).toBeTruthy();
    await browserPage.waitForSelector("#successAuthCode", { timeout: 5000 });

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

// test("Popup Token Acquisition - Get access token via popup", async () => {
//     const testName = "popupTokenAcquisition";
//     const screenshot = new ScreenShotElectron(
//         `${LOCAL_SCREENSHOT_FOLDER}/${testName}`
//     );

//     await screenshot.takeScreenshot(browserPage, "Initial page load");

//     // First login via popup
//     const loginButton = await browserPage.waitForSelector("#loginPopup");
//     await loginButton.click();

//     // Handle authentication (simplified version)
//     await browserPage.waitForTimeout(2000);
//     const usernameInput = await browserPage.waitForSelector(
//         'input[name="loginfmt"]',
//         { timeout: 10000 }
//     );
//     await usernameInput.fill(username);
//     const nextButton = await browserPage.waitForSelector(
//         'input[type="submit"]'
//     );
//     await nextButton.click();

//     const passwordInput = await browserPage.waitForSelector(
//         'input[name="passwd"]',
//         { timeout: 10000 }
//     );
//     await passwordInput.fill(accountPwd);
//     const signInButton = await browserPage.waitForSelector(
//         'input[type="submit"]'
//     );
//     await signInButton.click();

//     try {
//         const staySignedInButton = await browserPage.waitForSelector(
//             'input[value="Yes"]',
//             { timeout: 5000 }
//         );
//         await staySignedInButton.click();
//     } catch (e) {
//         // Stay signed in prompt not found
//     }

//     // Wait for login to complete
//     await browserPage.waitForSelector("#WelcomeMessage", { timeout: 15000 });
//     await screenshot.takeScreenshot(browserPage, "Login completed");

//     // Now test token acquisition
//     const tokenButton = await browserPage.waitForSelector("#getToken", {
//         timeout: 5000,
//     });
//     await tokenButton.click();
//     await screenshot.takeScreenshot(browserPage, "Get token button clicked");

//     // Wait for token to be acquired and displayed
//     await browserPage.waitForSelector("#token-result", { timeout: 10000 });
//     const tokenResult = await browserPage.textContent("#token-result");
//     await screenshot.takeScreenshot(
//         browserPage,
//         "Token acquired and displayed"
//     );

//     // Verify token is present and valid format
//     expect(tokenResult).toBeTruthy();
//     expect(tokenResult).toContain("access_token");
// });

// test("Silent Token Acquisition - Get token silently after popup login", async () => {
//     const testName = "silentTokenAcquisition";
//     const screenshot = new ScreenShotElectron(
//         `${LOCAL_SCREENSHOT_FOLDER}/${testName}`
//     );

//     await screenshot.takeScreenshot(browserPage, "Initial page load");

//     // First login via popup (setup)
//     const loginButton = await browserPage.waitForSelector("#loginPopup");
//     await loginButton.click();

//     // Handle authentication
//     await browserPage.waitForTimeout(2000);
//     const usernameInput = await browserPage.waitForSelector(
//         'input[name="loginfmt"]',
//         { timeout: 10000 }
//     );
//     await usernameInput.fill(username);
//     const nextButton = await browserPage.waitForSelector(
//         'input[type="submit"]'
//     );
//     await nextButton.click();

//     const passwordInput = await browserPage.waitForSelector(
//         'input[name="passwd"]',
//         { timeout: 10000 }
//     );
//     await passwordInput.fill(accountPwd);
//     const signInButton = await browserPage.waitForSelector(
//         'input[type="submit"]'
//     );
//     await signInButton.click();

//     try {
//         const staySignedInButton = await browserPage.waitForSelector(
//             'input[value="Yes"]',
//             { timeout: 5000 }
//         );
//         await staySignedInButton.click();
//     } catch (e) {
//         // Stay signed in prompt not found
//     }

//     // Wait for login to complete
//     await browserPage.waitForSelector("#WelcomeMessage", { timeout: 15000 });
//     await screenshot.takeScreenshot(browserPage, "Initial login completed");

//     // Test silent token acquisition
//     const silentButton = await browserPage.waitForSelector("#sso");
//     await silentButton.click();
//     await screenshot.takeScreenshot(browserPage, "Silent token button clicked");

//     // Wait for silent token acquisition result
//     await browserPage.waitForTimeout(3000);
//     await screenshot.takeScreenshot(
//         browserPage,
//         "Silent token acquisition completed"
//     );

//     // Verify no additional authentication prompts appeared
//     const welcomeMessage = await browserPage.textContent("#WelcomeMessage");
//     expect(welcomeMessage).toContain("Welcome");
// });

// test("COOP Header Validation - Verify Cross-Origin-Opener-Policy is set", async () => {
//     const testName = "coopHeaderValidation";
//     const screenshot = new ScreenShotElectron(
//         `${LOCAL_SCREENSHOT_FOLDER}/${testName}`
//     );

//     await screenshot.takeScreenshot(browserPage, "Initial page load");

//     // Check for COOP header in the response
//     const response = await browserPage.goto("/", { waitUntil: "networkidle" });
//     const coopHeader = response?.headers()["cross-origin-opener-policy"];

//     await screenshot.takeScreenshot(
//         browserPage,
//         "Page loaded with COOP header check"
//     );

//     // Verify COOP header is present and has expected value
//     expect(coopHeader).toBeTruthy();
//     expect(coopHeader).toContain("same-origin");

//     console.log("COOP Header value:", coopHeader);
// });
