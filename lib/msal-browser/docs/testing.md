# Testing

## The loadExternalTokens() API

The `loadExternalTokens()` API allows the loading of id, access and refresh tokens to the MSAL cache, which can then be fetched using `acquireTokenSilent()`.

**Note: This is an advanced feature that is intended for testing purposes in the browser environment only. We do not recommend using this in a production app. For E2E testing recommendations and a working sample, please refer to our [TestingSample](../../../samples/msal-browser-samples/TestingSample) instead.**

The `loadExternalTokens()` API is a public API facilitating apps to custom load tokens to msal js cache.

```js
await loadExternalTokens(
    config,
    silentRequest,
    serverResponse,
    loadTokenOptions,
);
```

`loadExternalTokens()` takes in a request of type `SilentRequest`, a response of type `ExternalTokenResponse`, and options of type `LoadTokenOptions`.

See the type definitions for each, which can be imported from `@azure/msal-browser`:

-   [`SilentRequest`](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_browser.SilentRequest.html)
-   [`ExternalTokenResponse`](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_browser.ExternalTokenResponse.html)
-   [`LoadTokenOptions`](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_browser.LoadTokenOptions.html)

## E2E Testing with loadExternalTokens

Because `loadExternalTokens()` requires a browser environment (it stores tokens in `sessionStorage` or `localStorage` using the correct browser-side cache key schema), it must be called **inside the browser** rather than in your test runner process.

The recommended approach is to:

1. Obtain a raw token server response **outside** the browser (e.g. via a direct ROPC HTTP request to the token endpoint, using hardcoded test tokens, or by calling your own auth service).
2. Pass the response into the browser and call `loadExternalTokens()` there, using whatever mechanism your test framework provides.
3. Reload the page so the application reads the freshly-populated cache and recognises the user as signed in.

### Playwright

Use [`page.evaluate`](https://playwright.dev/docs/api/class-page#page-evaluate) to execute code in the browser context. The `msal` global is available because your application already loads the `@azure/msal-browser` UMD bundle.

```ts
import { test, expect, type Page } from "@playwright/test";

const msalConfig = {
    auth: {
        clientId: "your-client-id",
        authority: "https://login.microsoftonline.com/your-tenant-id",
    },
    cache: { cacheLocation: "sessionStorage" },
};

const scopes = ["User.Read"];

/**
 * Obtain a raw token server response via a direct ROPC POST request.
 * This runs in Node.js (test runner) and does NOT require a browser.
 *
 * The returned object is the raw JSON body of the /token response, which
 * can be passed directly to loadExternalTokens.
 */
async function getServerTokenResponse(
    username: string,
    password: string
): Promise<Record<string, unknown>> {
    const tenantId = msalConfig.auth.authority.split("/").pop();
    const body = new URLSearchParams({
        grant_type: "password",
        client_id: msalConfig.auth.clientId,
        scope: scopes.join(" "),
        username,
        password,
    });
    const res = await fetch(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() }
    );
    return res.json() as Promise<Record<string, unknown>>;
}

async function loadTokensInBrowser(
    page: Page,
    serverResponse: Record<string, unknown>
): Promise<void> {
    await page.evaluate(
        async ([config, request, response]) => {
            // msal is the global exposed by the @azure/msal-browser UMD bundle
            // The fourth argument is LoadTokenOptions (empty object uses defaults)
            await (window as any).msal.loadExternalTokens(config, request, response, {});
        },
        [msalConfig, { scopes, authority: msalConfig.auth.authority }, serverResponse]
    );
}

let serverResponse: Record<string, unknown>;

test.beforeAll(async () => {
    serverResponse = await getServerTokenResponse(
        process.env.TEST_USERNAME!,
        process.env.TEST_PASSWORD!
    );
});

test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await loadTokensInBrowser(page, serverResponse);
    await page.reload();
});
```

### Puppeteer

Use [`page.evaluate`](https://pptr.dev/api/puppeteer.page.evaluate) in the same way as Playwright. The pattern is identical.

```ts
import puppeteer, { type Page } from "puppeteer";

const msalConfig = {
    auth: {
        clientId: "your-client-id",
        authority: "https://login.microsoftonline.com/your-tenant-id",
    },
    cache: { cacheLocation: "sessionStorage" },
};

const scopes = ["User.Read"];

// Obtain serverResponse using the same ROPC helper shown in the Playwright
// section above, then:

async function loadTokensInBrowser(
    page: Page,
    serverResponse: Record<string, unknown>
): Promise<void> {
    const config = msalConfig;
    const request = { scopes, authority: msalConfig.auth.authority };

    await page.evaluate(
        async (config, request, response) => {
            // msal is the global exposed by the @azure/msal-browser UMD bundle
            // The fourth argument is LoadTokenOptions (empty object uses defaults)
            await (window as any).msal.loadExternalTokens(config, request, response, {});
        },
        config,
        request,
        serverResponse
    );
}
```

### Cypress

In Cypress, use [`cy.window()`](https://docs.cypress.io/api/commands/window) to access the browser's `window` object and call `loadExternalTokens` directly. Token acquisition and cache hydration can be placed in a [custom command](https://docs.cypress.io/api/cypress-api/custom-commands) or in a `before`/`beforeEach` hook.

```ts
// cypress/support/commands.ts
import type { SilentRequest, ExternalTokenResponse } from "@azure/msal-browser";

declare global {
    namespace Cypress {
        interface Chainable {
            loadMsalTokens(
                config: object,
                request: SilentRequest,
                response: ExternalTokenResponse
            ): Chainable<void>;
        }
    }
}

Cypress.Commands.add("loadMsalTokens", (config, request, response) => {
    cy.window().then(async (win) => {
        // msal is the global exposed by the @azure/msal-browser UMD bundle
        // The fourth argument is LoadTokenOptions (empty object uses defaults)
        await (win as any).msal.loadExternalTokens(config, request, response, {});
    });
});

// cypress/e2e/app.cy.ts
const msalConfig = {
    auth: {
        clientId: "your-client-id",
        authority: "https://login.microsoftonline.com/your-tenant-id",
    },
    cache: { cacheLocation: "sessionStorage" },
};

beforeEach(() => {
    cy.visit("http://localhost:3000/");

    // Obtain a server response (see ROPC helper in the Playwright section),
    // or use pre-obtained / hardcoded test tokens.
    // NOTE: The values below are illustrative placeholders only. Replace them
    // with tokens obtained via the ROPC helper or another token acquisition
    // method before running real tests.
    const serverResponse: ExternalTokenResponse = {
        token_type: "Bearer",
        scope: "User.Read",
        expires_in: 3600,
        access_token: "test-access-token",
        id_token: "test-id-token",
        client_info: "test-client-info",
    };

    cy.loadMsalTokens(
        msalConfig,
        { scopes: ["User.Read"], authority: msalConfig.auth.authority },
        serverResponse
    );

    cy.reload();
});
```

## Loading tokens

You can provide any combination of id, access and refresh tokens for caching but at a minimum the `loadExternalTokens` API requires one of the following sets of input parameters to identify token associations and cache appropriately:

-   A `SilentRequest` object with [account information](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_browser.AccountInfo.html), OR
-   A `SilentRequest` object with the authority AND a `LoadTokenOptions` object with `clientInfo`, OR
-   A `SilentRequest` object with the authority AND a server response object with `client_info`
-   A `SilentRequest` object with the authority AND a server response object with `id_token`

The examples below show loading tokens individually, however, you may provide any 1, 2 or all 3 in a single request.

### Loading id tokens

In addition to the parameters listed [above](#loading-tokens) provide the following to load an id token:

1. A server response with the id_token field

An account will also be set in the cache based on the information provided above.

See the code examples below:

```ts
const config: Configuration = {
    auth: { clientId: "your-client-id" },
};

const silentRequest: SilentRequest = {
    account: {
        homeAccountId: "your-home-account-id",
        environment: "login.microsoftonline.com",
        tenantId: "your-tenant-id",
        username: "test@contoso.com",
        localAccountId: "your-local-account-id",
    },
};

const serverResponse: ExternalTokenResponse = {
    id_token: "id-token-here",
};

const loadTokenOptions: LoadTokenOptions = {};

const pca = new PublicClientApplication(config);
await loadExternalTokens(
    config,
    silentRequest,
    serverResponse,
    loadTokenOptions
);

// OR

const config: Configuration = {
    auth: { clientId: "your-client-id" },
};

const silentRequest: SilentRequest = {
    scopes: [],
    authority: "https://login.microsoftonline.com/your-tenant-id",
};

const serverResponse: ExternalTokenResponse = {
    id_token: "id-token-here",
};

const loadTokenOptions: LoadTokenOptions = {
    clientInfo: "client-info-here",
};

const pca = new PublicClientApplication(config);
await loadExternalTokens(
    config,
    silentRequest,
    serverResponse,
    loadTokenOptions
);

// OR

const config: Configuration = {
    auth: { clientId: "your-client-id" },
};

const silentRequest: SilentRequest = {
    scopes: [],
    authority: "https://login.microsoftonline.com/your-tenant-id",
};

const serverResponse: ExternalTokenResponse = {
    id_token: "id-token-here",
    client_info: "client-info-here",
};

const loadTokenOptions: LoadTokenOptions = {};

const pca = new PublicClientApplication(config);
await loadExternalTokens(
    config,
    silentRequest,
    serverResponse,
    loadTokenOptions
);
```

### Loading access tokens

In addition to the parameters listed [above](#loading-tokens) provide the following to load an access token:

1. A server response with an `access_token`, `expires_in`, `token_type`, and `scope`

See the code examples below:

```ts
const config: Configuration = {
    auth: { clientId: "your-client-id" },
};

const silentRequest: SilentRequest = {
    scopes: ["User.Read", "email"],
    account: {
        homeAccountId: "your-home-account-id",
        environment: "login.microsoftonline.com",
        tenantId: "your-tenant-id",
        username: "test@contoso.com",
        localAccountId: "your-local-account-id",
    },
};

const serverResponse: ExternalTokenResponse = {
    token_type: AuthenticationScheme.BEARER, // "Bearer"
    scope: "User.Read email",
    expires_in: 3599,
    access_token: "access-token-here",
};

const loadTokenOptions: LoadTokenOptions = {
    extendedExpiresOn: 6599,
};

const pca = new PublicClientApplication(config);
await loadExternalTokens(
    config,
    silentRequest,
    serverResponse,
    loadTokenOptions
);
```

### Loading refresh tokens

In addition to the parameters listed [above](#loading-tokens) provide the following to load a refresh token:

1. A server response with a `refresh_token` and optionally `refresh_token_expires_in`

See the code examples below:

```ts
const config: Configuration = {
    auth: { clientId: "your-client-id" },
};

const silentRequest: SilentRequest = {
    scopes: [],
    account: {
        homeAccountId: "your-home-account-id",
        environment: "login.microsoftonline.com",
        tenantId: "your-tenant-id",
        username: "test@contoso.com",
        localAccountId: "your-local-account-id",
    },
};

const serverResponse: ExternalTokenResponse = {
    refresh_token: "refresh-token-here",
    refresh_token_expires_in: "86399",
};

const loadTokenOptions: LoadTokenOptions = {};

const pca = new PublicClientApplication(config);

await loadExternalTokens(
    config,
    silentRequest,
    serverResponse,
    loadTokenOptions
);
```
