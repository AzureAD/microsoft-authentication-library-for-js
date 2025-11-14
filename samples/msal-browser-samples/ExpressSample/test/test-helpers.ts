import * as puppeteer from "puppeteer";
import {
    Screenshot,
    enterCredentials,
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
        .setTimeout(2000)
        .wait();
    expect(selectedVersion).toContain(versionSearchText);
    await screenshot.takeScreenshot(page, `${version} version selected`);
}

export async function setPCAConfiguration(config: object, page: puppeteer.Page, screenshot: Screenshot) {
    await screenshot.takeScreenshot(page, "Filling in PCA config");
    await page.locator("textarea#msalConfig").fill(JSON.stringify(config));
    await screenshot.takeScreenshot(page, "Config filled");
    await page.locator("button#applyConfig").click();
}

export async function setRequestConfiguration(request: object, page: puppeteer.Page, screenshot: Screenshot) {
    // Set a longer timeout for the fill operation
    await screenshot.takeScreenshot(page, "Filling in request config");
    await page.locator("textarea#tokenRequest").fill(JSON.stringify(request));
    await screenshot.takeScreenshot(page, "Request filled");
    await page.locator("button#applyConfig").click();
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

/**
 * Sign in with a popup on the playground page
 * @param page 
 * @param screenshot 
 * @param username 
 * @param accountPwd 
 */
export async function signInPopup(
    page: puppeteer.Page, 
    screenshot: Screenshot, 
    username: string, 
    accountPwd: string
) {
    const newPopupWindowPromise = new Promise<puppeteer.Page|null>((resolve) =>
        page.once("popup", resolve)
    );
    await page.locator("button#btnAcquireTokenPopup").click();
    const popupPage = await newPopupWindowPromise;
    if (!popupPage) {
        throw new Error('Popup window was not opened');
    }
    const popupWindowClosed = new Promise<void>((resolve) =>
        popupPage.once("close", resolve)
    );
    await enterCredentials(popupPage, screenshot, username, accountPwd);
    await popupWindowClosed;
}

export const defaultTokenRequest = {
    scopes: ["User.Read"]
}

export const defaultPcaConfig = {
    auth: {
        clientId: "b5c2e510-4a17-4feb-b219-e55aa5b74144",
        authority: "https://login.microsoftonline.com/common",
        redirectUri: "/"
    },
    cache: {
        cacheLocation: "localStorage"
    }
}