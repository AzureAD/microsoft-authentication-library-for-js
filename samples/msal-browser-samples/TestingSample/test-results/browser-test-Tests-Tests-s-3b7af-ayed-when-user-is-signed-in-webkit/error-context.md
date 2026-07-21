# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: browser-test.spec.ts >> Tests >> Tests sign-out button is displayed when user is signed-in
- Location: test\browser-test.spec.ts:118:9

# Error details

```
Error: TEST_USERNAME and TEST_PASSWORD environment variables must be set before running tests.
```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | import { PublicClientApplication } from "@azure/msal-node";
  3   | 
  4   | const msalConfig = {
  5   |     auth: {
  6   |         clientId: "Enter_Your_Client_Id_Here", // Add same clientId here as in app/authConfig.js
  7   |         authority:
  8   |             "https://login.microsoftonline.com/Enter_the_Tenant_Id_Here", // Add same tenanted authority here as in app/authConfig.js
  9   |     },
  10  |     cache: {
  11  |         cacheLocation: "sessionStorage",
  12  |     },
  13  | };
  14  | 
  15  | const scopes = ["User.Read"];
  16  | 
  17  | /**
  18  |  * Obtains tokens using msal-node's Resource Owner Password Credentials (ROPC)
  19  |  * flow. Returns a server-response-shaped object that can be passed directly
  20  |  * to loadExternalTokens.
  21  |  *
  22  |  * WARNING: The ROPC flow should only be used for testing purposes and is not
  23  |  * suitable for authenticating real users outside of a test environment.
  24  |  */
  25  | async function getServerTokenResponse(
  26  |     username: string,
  27  |     password: string
  28  | ): Promise<Record<string, unknown>> {
  29  |     const pca = new PublicClientApplication({ auth: msalConfig.auth });
  30  |     const result = await pca.acquireTokenByUsernamePassword({
  31  |         scopes,
  32  |         username,
  33  |         password,
  34  |     });
  35  |     if (!result) {
  36  |         throw new Error("Failed to acquire token via ROPC");
  37  |     }
  38  |     const now = Math.floor(Date.now() / 1000);
  39  |     // Default to 3600 seconds (1 hour) if expiresOn is not available
  40  |     const expiresIn = result.expiresOn
  41  |         ? Math.max(1, Math.floor(result.expiresOn.getTime() / 1000) - now)
  42  |         : 3600;
  43  |     return {
  44  |         token_type: result.tokenType || "Bearer",
  45  |         scope: result.scopes.join(" "),
  46  |         expires_in: expiresIn,
  47  |         access_token: result.accessToken,
  48  |         id_token: result.idToken,
  49  |     };
  50  | }
  51  | 
  52  | /**
  53  |  * Hydrates the browser's MSAL cache by calling loadExternalTokens inside the
  54  |  * browser context via page.evaluate. This ensures the correct browser-side
  55  |  * cache key schema is used, regardless of how the tokens were obtained.
  56  |  *
  57  |  * For alternative ways to populate storage with Playwright, visit:
  58  |  * https://playwright.dev/docs/auth
  59  |  */
  60  | async function loadTokensInBrowser(
  61  |     page: Page,
  62  |     serverResponse: Record<string, unknown>
  63  | ): Promise<void> {
  64  |     const silentRequest = {
  65  |         scopes,
  66  |         authority: msalConfig.auth.authority,
  67  |     };
  68  | 
  69  |     await page.evaluate(
  70  |         async ([config, request, response]) => {
  71  |             // msal is the global variable exposed by your application's MSAL setup.
  72  |             // loadExternalTokens writes tokens to the browser cache using the correct schema.
  73  |             // eslint-disable-next-line @typescript-eslint/no-explicit-any
  74  |             await (window as any).msal.loadExternalTokens(
  75  |                 config,
  76  |                 request,
  77  |                 response,
  78  |                 {} // LoadTokenOptions - see testing.md for available options
  79  |             );
  80  |         },
  81  |         [msalConfig, silentRequest, serverResponse] as [
  82  |             typeof msalConfig,
  83  |             typeof silentRequest,
  84  |             Record<string, unknown>
  85  |         ]
  86  |     );
  87  | }
  88  | 
  89  | function getCredentials(): [string, string] {
  90  |     // Implement a secure way to retrieve test credentials, e.g. from environment
  91  |     // variables or a secrets manager. Never hard-code credentials in test files.
  92  |     const username = process.env.TEST_USERNAME;
  93  |     const password = process.env.TEST_PASSWORD;
  94  |     if (!username || !password) {
> 95  |         throw new Error(
      |               ^ Error: TEST_USERNAME and TEST_PASSWORD environment variables must be set before running tests.
  96  |             "TEST_USERNAME and TEST_PASSWORD environment variables must be set before running tests."
  97  |         );
  98  |     }
  99  |     return [username, password];
  100 | }
  101 | 
  102 | let serverResponse: Record<string, unknown>;
  103 | 
  104 | test.beforeAll(async () => {
  105 |     const [username, password] = getCredentials();
  106 |     serverResponse = await getServerTokenResponse(username, password);
  107 | });
  108 | 
  109 | test.beforeEach(async ({ page }) => {
  110 |     await page.goto("http://localhost:30662/");
  111 |     // Hydrate the MSAL browser cache with the pre-acquired tokens, then reload
  112 |     // so the app picks them up and recognises the user as signed in.
  113 |     await loadTokensInBrowser(page, serverResponse);
  114 |     await page.reload();
  115 | });
  116 | 
  117 | test.describe("Tests", () => {
  118 |     test("Tests sign-out button is displayed when user is signed-in", async ({
  119 |         page,
  120 |     }) => {
  121 |         const signInButton = page.getByRole("button", { name: /Sign In/i });
  122 |         const signOutButton = page.getByRole("button", { name: /Sign Out/i });
  123 |         expect(await signInButton.count()).toBeLessThanOrEqual(0);
  124 |         expect(await signOutButton.count()).toBeGreaterThan(0);
  125 |     });
  126 | });
```