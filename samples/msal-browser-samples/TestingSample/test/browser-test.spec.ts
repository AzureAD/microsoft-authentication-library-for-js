import { test, expect, type Page } from "@playwright/test";
import { PublicClientApplication, CacheKVStore } from "@azure/msal-node";

const config = {
    auth: {
        clientId: "Enter_Your_Client_Id_Here", // Add same ClientId here as in app/authConfig.js
        authority:
            "https://login.microsoftonline.com/Enter_the_Tenant_Id_Here", // Add same tenanted authority here as in app/authConfig.js
    },
};

let tokenCache: CacheKVStore;

/**
 * This function populates the session storage with the users' authentication data; 
 * for alternative ways to populate the session and local storage with Playwright, 
 * visit: https://playwright.dev/docs/auth
 */
async function setSessionStorage(page: Page, tokens: CacheKVStore) {
    const cacheKeys = Object.keys(tokens);
    for (let key of cacheKeys) {
        const value = JSON.stringify(tokenCache[key]);
        await page.context().addInitScript(
            (arr: string[]) => {
                window.sessionStorage.setItem(arr[0], arr[1]);
            },
            [key, value]
        );
    }
    await page.reload();
}

test.beforeAll(async () => {
    const pca = new PublicClientApplication(config);
    const [username, password] = getCredentials(); // Implement an API to get your credentials
    const usernamePasswordRequest = {
        scopes: ["user.read"],
        username: username,
        password: password,
    };

    await pca.acquireTokenByUsernamePassword(usernamePasswordRequest);
    tokenCache = pca.getTokenCache().getKVStore();
});

test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:30662/");
});

test.describe("Tests", () => {
    test("Tests sign-out button is displayed when user is signed-in", async ({
        page,
    }) => {
        let signInButton = page.getByRole("button", { name: /Sign In/i });
        let signOutButton = page.getByRole("button", { name: /Sign Out/i });
        expect(await signInButton.count()).toBeGreaterThan(0);
        expect(await signOutButton.count()).toBeLessThanOrEqual(0);
        await setSessionStorage(page, tokenCache);
        expect(await signInButton.count()).toBeLessThanOrEqual(0);
        expect(await signOutButton.count()).toBeGreaterThan(0);
    });
});