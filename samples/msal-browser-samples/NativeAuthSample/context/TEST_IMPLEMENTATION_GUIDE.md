# Native Auth Test Implementation Guide

This guide provides step-by-step instructions for creating new test cases in the Native Auth Sample test suite. Follow these patterns to ensure consistency, maintainability, and reliability across all test implementations.

## 🎯 Quick Reference: Common Actions → Functions to Use

| **Action** | **Function to Use** | **Example** |
|------------|-------------------|-------------|
| **Type in a field** | `UIInteractionUtils.typeIntoElement()` | `await UIInteractionUtils.typeIntoElement(page, "#email", value, "Email field")` |
| **Type in OTP field** | `UIInteractionUtils.typeIntoElement()` with `clearFirst: true` | `await UIInteractionUtils.typeIntoElement(page, "#otp", code, "OTP field", true)` |
| **Click a button** | `UIInteractionUtils.waitAndClick()` | `await UIInteractionUtils.waitAndClick(page, "#submitBtn", "Submit button", STANDARD_TIMEOUT)` |
| **Wait for element** | `page.waitForSelector()` with `STANDARD_TIMEOUT` | `await page.waitForSelector("#card", { visible: true, timeout: STANDARD_TIMEOUT })` |
| **Wait for authentication** | `BrowserStateUtils.waitForAuthenticationComplete()` | `await BrowserStateUtils.waitForAuthenticationComplete(page, AUTH_TIMEOUT)` |
| **Verify successful auth** | `TokenVerificationUtils.verifySuccessfulAuthentication()` | `await TokenVerificationUtils.verifySuccessfulAuthentication(BrowserCache)` |
| **Verify not signed in** | `BrowserStateUtils.verifyNotSignedIn()` | `await BrowserStateUtils.verifyNotSignedIn(page)` |
| **Create new email account** | `MailTmClient.createAuthenticatedAccount()` | `const { client, address } = await MailTmClient.createAuthenticatedAccount(password)` |
| **Use existing email** | `MailTmClient.connectToExistingAccount()` | `const client = await MailTmClient.connectToExistingAccount(email, password)` |
| **Read OTP from email** | `emailClient.readOtpCode()` | `const otpCode = await emailClient.readOtpCode()` |
| **Verify error message** | `page.$eval()` with `expect().toContain()` | `const errorMessage = await page.$eval("#errorMessage", (el) => el.textContent); expect(errorMessage).toContain("expected text")` |
| **Take screenshot** | `screenshot.takeScreenshot()` | `await screenshot.takeScreenshot(page, "stepDescription")` |

## 📋 Required Imports and Setup

### Standard Test File Imports
```typescript
import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    getBrowser,
    pcaInitializedPoller,
    BrowserCacheUtils,
    getHomeUrl,
} from "e2e-test-utils";
import { ChildProcess } from "child_process";
import path = require("path");
import { startCorsProxy, stopCorsProxy } from "./utils/proxyUtils";
import { MailTmClient } from "./utils/emailProviderUtils";
import {
    testConfig,
    getTenantInfo,
    getProxyPort,
    nativeAuthConfig,
    negativeTestData,
} from "./utils/configUtils";
import {
    TokenVerificationUtils,
    BrowserStateUtils,
    UIInteractionUtils,
} from "./utils/testUtils";
```

### Standard Constants Setup
```typescript
// Use configuration instead of hardcoded values
const SCREENSHOT_BASE_FOLDER_NAME = path.join(
    __dirname,
    testConfig.screenshots.baseFolderName,
    "/your-test-folder-name"  // Replace with your test category
);
const STANDARD_TIMEOUT = testConfig.timeouts.standard;
const AUTH_TIMEOUT = testConfig.timeouts.auth;
let sampleHomeUrl = "";
```

## 🏗️ Complete Test File Template

```typescript
describe("Your Test Suite Name", () => {
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let browser: puppeteer.Browser;
    let corsProcess: ChildProcess;
    
    // Add your test-specific variables here
    let testEmail: string = "";
    let testPassword: string = "";

    beforeAll(async () => {
        // Start the CORS proxy server using configuration values
        const tenantInfo = getTenantInfo();
        corsProcess = await startCorsProxy(
            tenantInfo.name,
            tenantInfo.id,
            getProxyPort()
        );

        if (testConfig.screenshots.enabled) {
            createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        }
        browser = await getBrowser();
        sampleHomeUrl = getHomeUrl();

        // Set up test data from configuration
        testEmail = nativeAuthConfig.yourConfigEmail;
        testPassword = nativeAuthConfig.yourConfigPassword;
    });

    afterAll(async () => {
        await context?.close();
        await browser?.close();
        // Stop the CORS proxy server using the utility function
        stopCorsProxy(corsProcess);
    });

    beforeEach(async () => {
        context = await browser.createBrowserContext();
        page = await context.newPage();

        BrowserCache = new BrowserCacheUtils(page, "sessionStorage");
    });

    afterEach(async () => {
        // Clear storage after each test using shared utility
        await BrowserStateUtils.cleanupBrowserState(page);
        await page.close();
    });

    describe("Your Test Category", () => {
        beforeEach(async () => {
            // Navigate to your test configuration
            await page.goto(sampleHomeUrl + `?useYourConfig=true`);

            // Wait for the application to initialize
            await pcaInitializedPoller(page, AUTH_TIMEOUT);

            // Verify initial state
            await BrowserStateUtils.verifyNotSignedIn(page);

            // Navigate to your test form
            await UIInteractionUtils.waitAndClick(page, "#showYourFormBtn", "Show your form button", STANDARD_TIMEOUT);

            // Verify form is visible
            await page.waitForSelector("#yourFormCard", { visible: true, timeout: STANDARD_TIMEOUT });
        });

        it(
            "Your test description here",
            async () => {
                // Your test implementation here
            },
            AUTH_TIMEOUT  // Always use AUTH_TIMEOUT for test timeout
        );
    });
});
```

## 🔧 Step-by-Step Implementation Instructions

### 1. **Fill a Form Field**
```typescript
// For regular text fields
await UIInteractionUtils.typeIntoElement(page, "#fieldId", fieldValue, "Field description");

// For password fields
await UIInteractionUtils.typeIntoElement(page, "#passwordField", password, "Password field");

// For OTP fields (with automatic clearing)
await UIInteractionUtils.typeIntoElement(page, "#otpField", otpCode, "OTP verification field", true);
```

### 2. **Click Buttons or Links**
```typescript
// Standard button click
await UIInteractionUtils.waitAndClick(page, "#buttonId", "Button description", STANDARD_TIMEOUT);

// Navigation button click
await UIInteractionUtils.waitAndClick(page, "#navButton", "Navigation button", STANDARD_TIMEOUT);
```

### 3. **Wait for UI Elements**
```typescript
// Wait for a card/section to appear
await page.waitForSelector("#cardId", { 
    visible: true, 
    timeout: STANDARD_TIMEOUT 
});

// Wait for multiple elements to be ready
await page.waitForSelector("#element1", { visible: true, timeout: STANDARD_TIMEOUT });
await page.waitForSelector("#element2", { visible: true, timeout: STANDARD_TIMEOUT });
```

### 4. **Handle Email Operations**

#### For New Email Accounts:
```typescript
// Create authenticated email account
const { client: emailClient, address: testEmail } = 
    await MailTmClient.createAuthenticatedAccount(emailProviderPassword);

// Use the email in your test
await UIInteractionUtils.typeIntoElement(page, "#emailField", testEmail, "Email field");
```

#### For Existing Email Accounts:
```typescript
// Connect to existing email account
const emailClient = await MailTmClient.connectToExistingAccount(
    existingEmail, 
    emailPassword
);

// CRITICAL: Mark checkpoint before triggering OTP (for existing accounts)
// This prevents reading old emails from previous tests
emailClient.markCheckpoint();
```

#### Reading OTP Codes:
```typescript
// Read OTP from email
const otpCode = await emailClient.readOtpCode();

// Enter OTP in form
await UIInteractionUtils.typeIntoElement(page, "#otpField", otpCode, "OTP field", true);
```

### 5. **Authentication Verification**

#### For Successful Authentication:
```typescript
// Wait for authentication to complete
await BrowserStateUtils.waitForAuthenticationComplete(page, AUTH_TIMEOUT);

// Verify tokens and authentication state
await TokenVerificationUtils.verifySuccessfulAuthentication(BrowserCache);
```

#### For Failed Authentication:
```typescript
// Verify user is still not signed in
await BrowserStateUtils.verifyNotSignedIn(page);

// Verify no tokens in cache
await TokenVerificationUtils.verifyNoTokensInCache(BrowserCache);
```

### 6. **Error Handling**
```typescript
// Wait for error banner to appear
await page.waitForSelector("#errorBanner", {
    visible: true,
    timeout: STANDARD_TIMEOUT,
});

// Verify error message content
const errorMessage = await page.$eval("#errorMessage", (el) => el.textContent);
expect(errorMessage).toContain("Expected error text");

// Dismiss error if needed
await UIInteractionUtils.waitAndClick(page, "#dismissErrorBtn", "Dismiss error button", STANDARD_TIMEOUT);
```

### 7. **Screenshot Integration**
```typescript
const testName = "yourTestName";
const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

// Take screenshots at key points
await screenshot.takeScreenshot(page, "stepDescription");
```

## 📚 Complete Test Examples

### Example 1: Simple Sign-Up Test
```typescript
it("User completes sign-up successfully", async () => {
    const testName = "signUpSuccess";
    const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

    // Step 1: Create new email account
    const { client: emailClient, address: signUpEmail } = 
        await MailTmClient.createAuthenticatedAccount(emailProviderPwd);

    // Step 2: Fill form fields
    await UIInteractionUtils.typeIntoElement(page, "#firstName", "John", "First name field");
    await UIInteractionUtils.typeIntoElement(page, "#lastName", "Doe", "Last name field");
    await UIInteractionUtils.typeIntoElement(page, "#email", signUpEmail, "Email field");

    // Step 3: Submit form
    await UIInteractionUtils.waitAndClick(page, "#signUpBtn", "Sign up button", STANDARD_TIMEOUT);
    await screenshot.takeScreenshot(page, "formSubmitted");

    // Step 4: Handle OTP verification
    await page.waitForSelector("#otpCard", { visible: true, timeout: STANDARD_TIMEOUT });
    const otpCode = await emailClient.readOtpCode();
    await UIInteractionUtils.typeIntoElement(page, "#otpField", otpCode, "OTP field", true);
    await UIInteractionUtils.waitAndClick(page, "#submitOtpBtn", "Submit OTP button", STANDARD_TIMEOUT);

    // Step 5: Verify success
    await BrowserStateUtils.waitForAuthenticationComplete(page, AUTH_TIMEOUT);
    await TokenVerificationUtils.verifySuccessfulAuthentication(BrowserCache);
    await screenshot.takeScreenshot(page, "success");
}, AUTH_TIMEOUT);
```

### Example 2: Negative Test with Error Handling
```typescript
it("User receives error with invalid email", async () => {
    const testName = "invalidEmailError";
    const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

    // Step 1: Enter invalid email
    await UIInteractionUtils.typeIntoElement(page, "#email", "invalid-email", "Email field");
    await UIInteractionUtils.waitAndClick(page, "#submitBtn", "Submit button", STANDARD_TIMEOUT);
    await screenshot.takeScreenshot(page, "invalidEmailSubmitted");

    // Step 2: Verify error appears
    await page.waitForSelector("#errorBanner", {
        visible: true,
        timeout: STANDARD_TIMEOUT,
    });
    await screenshot.takeScreenshot(page, "errorDisplayed");

    // Step 3: Verify error content
    const errorMessage = await page.$eval("#errorMessage", (el) => el.textContent);
    expect(errorMessage).toContain("invalid email");

    // Step 4: Verify authentication state
    await BrowserStateUtils.verifyNotSignedIn(page);
    await TokenVerificationUtils.verifyNoTokensInCache(BrowserCache);
}, AUTH_TIMEOUT);
```

### Example 3: Multi-Step Flow with Retry Logic
```typescript
it("User retries after initial failure", async () => {
    const testName = "retryFlow";
    const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

    // Step 1: Setup email account
    const { client: emailClient, address: testEmail } = 
        await MailTmClient.createAuthenticatedAccount(emailProviderPwd);

    // Step 2: Initial attempt with wrong OTP
    await UIInteractionUtils.typeIntoElement(page, "#email", testEmail, "Email field");
    await UIInteractionUtils.waitAndClick(page, "#submitBtn", "Submit button", STANDARD_TIMEOUT);
    await page.waitForSelector("#otpCard", { visible: true, timeout: STANDARD_TIMEOUT });
    
    // Enter wrong OTP
    await UIInteractionUtils.typeIntoElement(page, "#otpField", "123456", "OTP field", true);
    await UIInteractionUtils.waitAndClick(page, "#submitOtpBtn", "Submit OTP button", STANDARD_TIMEOUT);
    await screenshot.takeScreenshot(page, "wrongOtpSubmitted");

    // Step 3: Handle error
    await page.waitForSelector("#errorBanner", { visible: true, timeout: STANDARD_TIMEOUT });
    await UIInteractionUtils.waitAndClick(page, "#dismissErrorBtn", "Dismiss error", STANDARD_TIMEOUT);
    await screenshot.takeScreenshot(page, "errorDismissed");

    // Step 4: Retry with correct OTP
    await UIInteractionUtils.waitAndClick(page, "#resendOtpBtn", "Resend OTP", STANDARD_TIMEOUT);
    const correctOtp = await emailClient.readOtpCode();
    await UIInteractionUtils.typeIntoElement(page, "#otpField", correctOtp, "OTP field", true);
    await UIInteractionUtils.waitAndClick(page, "#submitOtpBtn", "Submit OTP button", STANDARD_TIMEOUT);

    // Step 5: Verify success
    await BrowserStateUtils.waitForAuthenticationComplete(page, AUTH_TIMEOUT);
    await TokenVerificationUtils.verifySuccessfulAuthentication(BrowserCache);
    await screenshot.takeScreenshot(page, "retrySuccess");
}, AUTH_TIMEOUT);
```

## 🚨 Critical Rules and Standards

### ✅ Always Use These Patterns:
1. **Test Timeout:** Every `it()` function must use `AUTH_TIMEOUT` as the timeout parameter
2. **Element Timeouts:** All `page.waitForSelector()` calls must use `STANDARD_TIMEOUT`
3. **Form Inputs:** Always use `UIInteractionUtils.typeIntoElement()` with descriptive labels
4. **Button Clicks:** Always use `UIInteractionUtils.waitAndClick()` with descriptive labels
5. **OTP Fields:** Always use `clearFirst: true` parameter for OTP input fields
6. **Authentication Verification:** Always use shared utilities for token and state verification
7. **Email Operations:** Always use factory methods for email account creation

### ❌ Never Do These:
1. **Hardcoded Timeouts:** Never use arbitrary timeout values like `30000` or `45000`
2. **Manual Clicks:** Never use `page.click()` or `page.evaluate()` for clicking
3. **Manual Form Input:** Never use raw `page.type()` without utilities
4. **Manual Authentication Waits:** Never implement custom authentication verification
5. **Manual Email Setup:** Never manually create and login to email accounts

## 🎯 Function Reference Quick Guide

### UIInteractionUtils Functions:
```typescript
// Type into any field
await UIInteractionUtils.typeIntoElement(page, selector, value, description, clearFirst?);

// Click any element with waiting
await UIInteractionUtils.waitAndClick(page, selector, description, timeout);

// Click element safely (alternative)
await UIInteractionUtils.clickElementSafely(page, selector, description);
```

### BrowserStateUtils Functions:
```typescript
// Wait for authentication to complete
await BrowserStateUtils.waitForAuthenticationComplete(page, timeout);

// Verify user is not signed in
await BrowserStateUtils.verifyNotSignedIn(page);

// Clean up browser state
await BrowserStateUtils.cleanupBrowserState(page);
```

### TokenVerificationUtils Functions:
```typescript
// Verify successful authentication
await TokenVerificationUtils.verifySuccessfulAuthentication(BrowserCache);

// Verify no tokens exist
await TokenVerificationUtils.verifyNoTokensInCache(BrowserCache);
```

### MailTmClient Functions:
```typescript
// Create new authenticated account
const { client, address } = await MailTmClient.createAuthenticatedAccount(password);

// Connect to existing account
const client = await MailTmClient.connectToExistingAccount(email, password);

// Mark checkpoint (for existing accounts before triggering OTP)
client.markCheckpoint();

// Read OTP from email
const otpCode = await client.readOtpCode();
```

## 📋 Pre-Implementation Checklist

Before starting a new test, ensure you have:

- [ ] Chosen the appropriate test file or created a new one following the naming pattern
- [ ] Added all required imports
- [ ] Set up proper test suite structure with beforeAll/afterAll/beforeEach/afterEach
- [ ] Configured screenshot folders and constants
- [ ] Planned your test flow and identified required utility functions
- [ ] Determined if you need new or existing email accounts
- [ ] Identified all form fields and their selectors
- [ ] Planned error scenarios and verification steps

This guide ensures that every new test follows established patterns, uses the correct functions, and maintains consistency across the entire test suite.
