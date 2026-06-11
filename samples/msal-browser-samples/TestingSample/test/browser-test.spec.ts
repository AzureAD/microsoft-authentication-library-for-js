import { test, expect, type Page } from "@playwright/test";
import { PublicClientApplication } from "@azure/msal-node";

const msalConfig = {
    auth: {
        clientId: "Enter_Your_Client_Id_Here", // Add same clientId here as in app/authConfig.js
        authority:
            "https://login.microsoftonline.com/Enter_the_Tenant_Id_Here", // Add same tenanted authority here as in app/authConfig.js
    },
    cache: {
        cacheLocation: "sessionStorage",
    },
};

const scopes = ["User.Read"];

/**
 * Obtains tokens using msal-node's Resource Owner Password Credentials (ROPC)
 * flow. Returns a server-response-shaped object that can be passed directly
 * to loadExternalTokens.
 *
 * WARNING: The ROPC flow should only be used for testing purposes and is not
 * suitable for authenticating real users outside of a test environment.
 */
async function getServerTokenResponse(
    username: string,
    password: string
): Promise<Record<string, unknown>> {
    const pca = new PublicClientApplication({ auth: msalConfig.auth });
    const result = await pca.acquireTokenByUsernamePassword({
        scopes,
        username,
        password,
    });
    if (!result) {
        throw new Error("Failed to acquire token via ROPC");
    }
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = result.expiresOn
        ? Math.floor(result.expiresOn.getTime() / 1000) - now
        : 3600;
    return {
        token_type: result.tokenType || "Bearer",
        scope: result.scopes.join(" "),
        expires_in: expiresIn,
        access_token: result.accessToken,
        id_token: result.idToken,
    };
}

/**
 * Hydrates the browser's MSAL cache by calling loadExternalTokens inside the
 * browser context via page.evaluate. This ensures the correct browser-side
 * cache key schema is used, regardless of how the tokens were obtained.
 *
 * For alternative ways to populate storage with Playwright, visit:
 * https://playwright.dev/docs/auth
 */
async function loadTokensInBrowser(
    page: Page,
    serverResponse: Record<string, unknown>
): Promise<void> {
    const silentRequest = {
        scopes,
        authority: msalConfig.auth.authority,
    };

    await page.evaluate(
        async ([config, request, response]) => {
            // msal is the global variable exposed by your application's MSAL setup.
            // loadExternalTokens writes tokens to the browser cache using the correct schema.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (window as any).msal.loadExternalTokens(
                config,
                request,
                response,
                {} // LoadTokenOptions - see testing.md for available options
            );
        },
        [msalConfig, silentRequest, serverResponse] as [
            typeof msalConfig,
            typeof silentRequest,
            Record<string, unknown>
        ]
    );
}

function getCredentials(): [string, string] {
    // Implement a secure way to retrieve test credentials, e.g. from environment
    // variables or a secrets manager. Never hard-code credentials in test files.
    const username = process.env.TEST_USERNAME;
    const password = process.env.TEST_PASSWORD;
    if (!username || !password) {
        throw new Error(
            "TEST_USERNAME and TEST_PASSWORD environment variables must be set before running tests."
        );
    }
    return [username, password];
}

let serverResponse: Record<string, unknown>;

test.beforeAll(async () => {
    const [username, password] = getCredentials();
    serverResponse = await getServerTokenResponse(username, password);
});

test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:30662/");
    // Hydrate the MSAL browser cache with the pre-acquired tokens, then reload
    // so the app picks them up and recognises the user as signed in.
    await loadTokensInBrowser(page, serverResponse);
    await page.reload();
});

test.describe("Tests", () => {
    test("Tests sign-out button is displayed when user is signed-in", async ({
        page,
    }) => {
        const signInButton = page.getByRole("button", { name: /Sign In/i });
        const signOutButton = page.getByRole("button", { name: /Sign Out/i });
        expect(await signInButton.count()).toBeLessThanOrEqual(0);
        expect(await signOutButton.count()).toBeGreaterThan(0);
    });
});