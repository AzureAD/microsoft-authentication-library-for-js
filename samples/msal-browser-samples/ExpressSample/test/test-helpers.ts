import * as puppeteer from "puppeteer";
import {
    Screenshot,
    enterCredentials,
    BrowserCacheUtils,
} from "e2e-test-utils";

/**
 * Checks that tokens can be retrieved from the cache
 * @param page
 * @param screenshot
 */
export async function verifyCacheWasUsed(page: puppeteer.Page, screenshot: Screenshot) {
    // Track network requests to verify cached tokens are used
    const networkRequests: puppeteer.HTTPRequest[] = [];
    page.on('request', (request) => {
        // Track all requests to authentication endpoints
        if (request.url().includes('login.microsoftonline.com') ||
            request.url().includes('/token') ||
            request.url().includes('/authorize')) {
            networkRequests.push(request);
        }
    });

    if (!page.url().endsWith("profile")) {
        await page.locator("a#viewProfileButton").click();
        await screenshot.takeScreenshot(page, "Profile button clicked");
    }

    // Verify the Raw Authentication Data section is populated
    const authDataText = await page.locator("pre#auth-json").filter((value) => !!value.textContent && value.textContent !== 'Loading...').map(value => value.textContent).wait();
    await screenshot.takeScreenshot(page, "Authentication data displayed");
    const authData = JSON.parse(authDataText || "");
    expect(authData).toHaveProperty('fromCache');
    expect(authData.fromCache).toBe(true); // Should be from cache after upgrade

    // Verify no authentication network requests were made (indicating cached tokens were used)
    expect(networkRequests.length).toBe(0);
}

/**
 * Navigates to the Playground page and waits for the request editor to load.
 */
export async function openPlayground(
    page: puppeteer.Page,
    screenshot: Screenshot
) {
    await page.locator('a[href="/playground"]').click();
    await page.locator("textarea#tokenRequest").waitHandle();
    await screenshot.takeScreenshot(page, "Playground loaded");
}

/**
 * Applies the current Playground config and waits for initialization.
 */
export async function applyPlaygroundConfig(
    page: puppeteer.Page,
    screenshot: Screenshot
) {
    await page.locator("button#applyConfig").click();
    await page.waitForFunction(() => {
        const responseContent = document.getElementById("responseContent");
        const text = responseContent?.textContent || "";

        return (
            text.includes("MSAL instance created and initialized") ||
            text.includes("Redirect response received")
        );
    });
    await screenshot.takeScreenshot(page, "Playground configuration applied");
}

/**
 * Waits for an acquireTokenSilent response to be rendered and returns the parsed JSON.
 */
export async function waitForAcquireTokenSilentResponse(
    page: puppeteer.Page,
    screenshot: Screenshot
) {
    await page.waitForFunction(() => {
        const responseContent = document.getElementById("responseContent");
        const text = responseContent?.textContent || "";

        return (
            text.includes('"api": "acquireTokenSilent"') &&
            text.includes('"result"') &&
            !text.includes('"status": "Executing..."')
        );
    });

    const responseText = await page.evaluate(() => {
        const responseContent = document.getElementById("responseContent");
        return responseContent?.textContent || "";
    });
    await screenshot.takeScreenshot(page, "acquireTokenSilent response rendered");

    return JSON.parse(responseText);
}

/**
 * Force refresh tokens after an upgrade and verify the cache does not contain more or less token entries than before.
 * @param page
 * @param screenshot
 * @param browserCache
 */
export async function forceRefreshAndVerifyTokenCountsDoNotChange(
    page: puppeteer.Page,
    screenshot: Screenshot,
    browserCache: BrowserCacheUtils
) {
    const tokenKeysBefore = await browserCache.getTokens();

    await openPlayground(page, screenshot);
    await applyPlaygroundConfig(page, screenshot);

    await page.evaluate(() => {
        const requestElement = document.getElementById(
            "tokenRequest"
        ) as HTMLTextAreaElement | null;

        if (!requestElement) {
            throw new Error("Token request textarea not found");
        }

        const request = requestElement.value
            ? JSON.parse(requestElement.value)
            : {};
        request.forceRefresh = true;
        requestElement.value = JSON.stringify(request, null, 2);
    });
    await screenshot.takeScreenshot(page, "Force refresh configured");

    await page.locator("button#btnAcquireTokenSilent").click();
    await waitForAcquireTokenSilentResponse(page, screenshot);

    const tokenKeysAfter = await browserCache.getTokens();

    expect(tokenKeysAfter.idTokens.length).toEqual(
        tokenKeysBefore.idTokens.length
    );
    expect(tokenKeysAfter.accessTokens.length).toEqual(
        tokenKeysBefore.accessTokens.length
    );
    expect(tokenKeysAfter.refreshTokens.length).toEqual(
        tokenKeysBefore.refreshTokens.length
    );
}

/**
 * Helper to switch to a different version
 * @param version
 * @param page
 * @param screenshot
 */
export async function switchToVersion(version: string, page: puppeteer.Page, screenshot: Screenshot) {
    let versionSearchText = version;
    switch (version) {
        case "local":
            versionSearchText = "Local Build";
            break;
        case "latest":
            versionSearchText = "Latest (v";
            break;
        case "latest-v4":
            versionSearchText = "Latest v4.x";
            break;
        case "latest-v3":
            versionSearchText = "Latest v3.x";
            break;
        default:
            versionSearchText = `MSAL v${version}`;
    }

    const currentVersion = await page.locator(`span#currentVersionText`).map(value => value.textContent || "").wait();
    if (currentVersion.startsWith(versionSearchText)) {
        await screenshot.takeScreenshot(page, `${version} version selected`);
        return;
    }

    await page.locator("button#versionButton").click();

    if (["local", "latest", "latest-v4", "latest-v3"].includes(version)) {
        await page.locator(`div#${version}`).click();
    } else {
        await page.locator('div#custom').click();
        await page.locator("input#customVersionInput").fill(version);
        await screenshot.takeScreenshot(page, "Custom version entered");
        await page.locator("button#customVersionSubmit").click();
    }


    const selectedVersion = await page.locator(`span#currentVersionText`)
        .filter((value) => {return !!value.textContent && !value.textContent.startsWith("Switching")})
        .map(value => value.textContent || "")
        .setTimeout(15000)
        .wait();
    expect(selectedVersion).toContain(versionSearchText);
    await screenshot.takeScreenshot(page, `${version} version selected`);
}

/**
 * Sign a user in
 * @param page
 * @param screenshot
 * @param username
 * @param accountPwd
 * @param ssoExpected Whether SSO is expected (if true credentials won't be entered)
 */
export async function signIn(
    page: puppeteer.Page,
    screenshot: Screenshot,
    username: string,
    accountPwd: string,
    ssoExpected: boolean = false
) {
    await page.locator("button#signInButton").click();
    await screenshot.takeScreenshot(page, "Sign in button clicked");
    await page.locator("a#signInRedirect").click();
    await screenshot.takeScreenshot(page, "Sign in redirect clicked");
    // Unless sso is expected enter credentials on the sign-in screen
    !ssoExpected && await enterCredentials(page, screenshot, username, accountPwd);
    await page.locator("a#viewProfileButton").waitHandle();
    await screenshot.takeScreenshot(page, "Logged In");
}
