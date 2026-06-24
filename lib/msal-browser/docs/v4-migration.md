# Migrating from MSAL v4 to MSAL v5

If you are new to MSAL, you should start [here](initialization.md).

If you are coming from MSAL v2, you should check [this guide](v2-migration.md) first to migrate to MSAL v3. If you are coming from MSAL v3, you should check [this guide](v3-migration.md) first to migrate to MSAL v4 and then follow next steps.

If you are coming from MSAL v4, you can follow this guide to update your code to use MSAL v5.

## API Breaking Changes

### SignedHttpRequest.removeKeys return type has changed

The `removeKeys` function on the `SignedHttpRequest` class now returns `Promise<void>` instead of `Promise<boolean>`. A successful resolution of the promise is now equivalent to what was previously a return value of `true`. If a failure occurs it will now be thrown as an error instead of returning `false`

```javascript
// BEFORE
const shr = new SignedHttpRequest(shrParameters, shrOptions);
const result = await shr.removeKeys(thumbprint);
if (result) {
    // do something on success
} else {
    // do something on failure
}

// AFTER
const shr = new SignedHttpRequest(shrParameters, shrOptions);
await shr
    .removeKeys(thumbprint)
    .then(() => {
        // do something on success
    })
    .catch((e) => {
        // do something on failure
        console.log(e);
    });
```

### TokenCache and loadExternalTokens

MSAL JS API for [loadExternalTokens](../testing.md#the-loadexternaltokens-api) is modified. The changes include:

-   `TokenCache` object and `getTokenCache()` have been removed
-   The `loadExternalTokens()` API is now a separate export and requires `Configuration` as a parameter

```js
// BEFORE

const pca = new PublicClientApplication(config);
await pca
    .getTokenCache()
    .loadExternalTokens(silentRequest, serverResponse, loadTokenOptions);

//AFTER

await loadExternalTokens(
    config,
    silentRequest,
    serverResponse,
    loadTokenOptions
);
```

### `handleRedirectPromise` API signature has changed

Previously, `PublicClientApplication.handleRedirectPromise` took in an optional hash parameter. A new options type called `HandleRedirectPromiseOptions` has been introduced. As of MSAL Browser v5, an optional object with type `HandleRedirectPromiseOptions` is the only parameter `handleRedirectPromise()` accepts.

```javascript
// BEFORE
const hash = window.location.hash; // Arbitrary example value
pca.handleRedirectPromise(hash);

// AFTER
pca.handleRedirectPromise({
    hash: window.location.hash, // Option nested inside a `HandleRedirectPromiseOptions` object
    navigateToLoginRequestUrl: true, // Additional option
});
```

### Removal of some functions in `PublicClientApplication`

The following functions in `PublicClientApplication` have been removed:

1. `enableAccountStorageEvents()` and `disableAccountStorageEvents()`: account storage events are now always enabled. These function calls are no longer necessary.
1. `getAccountByHomeId()`, `getAccountByLocalId()`, and `getAccountByUsername()`: use `getAccount()` instead.

    ```typescript
    // BEFORE
    const account1 = accountManager.getAccountByHomeId(yourHomeAccountId);
    const account2 = accountManager.getAccountByLocalId(yourLocalAccountId);
    const account3 = accountManager.getAccountByUsername(yourUsername);

    // AFTER
    const account1 = accountManager.getAccount({
        homeAccountId: yourHomeAccountId,
    });
    const account2 = accountManager.getAccount({
        localAccountId: yourLocalAccountId,
    });
    const account3 = accountManager.getAccount({ username: yourUsername });
    ```

1. `logout()`: use `logoutRedirect()` or `logoutPopup()` instead.

### Removal of `startPerformanceMeasurement()`

`startPerformanceMeasurement()` has been removed. Please use `startMeasurement()` instead.

### Removal of `PublicClientNext`

The `PublicClientNext` class and its static method `createPublicClientApplication()` have been removed in MSAL v5. You should use one of the following alternatives depending on your application's requirements:

- **`PublicClientApplication`**: Use this for standard single-app scenarios. This is the default and most common usage.
- **`createNestablePublicClientApplication`**: Use this if you need to support nested apps (NAA). This function will automatically fall back to a standard PublicClientApplication if the nested app bridge is unavailable or the Hub is not configured to support nested app authentication. See [Nested App Configuration](./initialization.md#nested-app-configuration) for more details.
- **`createStandardPublicClientApplication`**: Use this to instantiate and initialize a standard (non-NAA) PublicClientApplication instance.

#### Migration Example

```typescript
// BEFORE (using PublicClientNext)
import { PublicClientNext } from "@azure/msal-browser";

const pca = PublicClientNext.createPublicClientApplication(config);
```

```typescript
// AFTER (standard usage)
import { PublicClientApplication } from "@azure/msal-browser";

const pca = new PublicClientApplication(config);
await pca.initialize();
```

```typescript
// AFTER (nested app support)
import { createNestablePublicClientApplication } from "@azure/msal-browser";

const pca = await createNestablePublicClientApplication(config);
```

```typescript
// AFTER (standard)
import { createStandardPublicClientApplication } from "@azure/msal-browser";

const pca = await createStandardPublicClientApplication(config);
```

For most applications, replacing `PublicClientNext.createPublicClientApplication(config)` with `new PublicClientApplication(config)` will be sufficient. If you previously used the `supportsNestedAppAuth` configuration option, migrate to `createNestablePublicClientApplication(config)` instead.

### Removal of PublicClientApplication.createPublicClientApplication static function

The `createPublicClientApplication` static function on `PublicClientApplication` has been removed and replaced with a separately exported `createStandardPublicClientApplication`.

#### Migration Example

```typescript
// BEFORE
import { PublicClientApplication } from "@azure/msal-browser";

const pca = await PublicClientApplication.createPublicClientApplication(config);
```

```typescript
// AFTER
import { createStandardPublicClientApplication } from "@azure/msal-browser";

const pca = await createStandardPublicClientApplication(config);
```

## Configuration changes

### BrowserAuthOptions changes

1. The `skipAuthorityMetadataCache` parameter has been removed from BrowserAuthOptions in Configuration.
1. The `protocolMode` parameter has been moved to SystemOptions instead of BrowserAuthOptions in Configuration.
1. The `supportsNestedAppAuth` parameter has been removed. Use the `createNestablePublicClientApplication` API for Nested Apps instead. Read more about Nested Apps [here](./initialization.md#nested-app-configuration).
1. The `navigateTologinRequestUrl` parameter has been removed from BrowserAuthOptions in Configuration and can instead now be provided inside an options object as a parameter on the call to `handleRedirectPromise`:

    ```typescript
    pca.handleRedirectPromise({ navigateToLoginRequestUrl: false });
    ```

1. The `encodeExtraQueryParams` parameter has been removed. All extra query params will be encoded.
1. The `supportsNestedAppAuth` parameter has been removed. Use `createNestablePublicClientApplication()` instead.

    ```typescript
        // BEFORE
        const pca = new PublicClientApplication({
            auth: {
                clientId: "your-client-id",
                authority: "https://login.microsoftonline.com/common"
                supportsNestedAppAuth: true
            },
        });

        // AFTER
        const pca = await createNestablePublicClientApplication({
            auth: {
                clientId: "your-client-id",
                authority: "https://login.microsoftonline.com/common"
            }
        });
    ```

1. The `OIDCOptions` parameter now takes in a `ResponseMode` instead of a `ServerResponseType`. Please use `ResponseMode.QUERY` in place of `ServerResponseType.QUERY` and `ResponseMode.FRAGMENT` instead of `ServerResponseType.FRAGMENT`.

### CacheOptions changes

The following parameters were deprecated in MSAL Browser v4 and have been removed from `CacheOptions` in v5

1. `temporaryCacheLocation`
1. `claimsBasedCachingEnabled` - Access tokens are no longer being stored based on requested claims.
1. `storeAuthStateInCookie`
1. `secureCookies` - All cookies are now only ever securely sent over HTTPS.
1. `cacheMigrationEnabled`

### SystemOptions

1. The `protocolMode` parameter has been moved to `SystemOptions` from `BrowserAuthOptions` in Configuration. There are no changes to its options or functionality.
1. The `navigateFrameWait` parameter has been removed. This was previously needed by older browsers which are no longer supported by MSAL.js.
1. The `iframeHashTimeout` and `windowHashTimeout` parameters have been replaced with `iframeBridgeTimeout` and `popupBridgeTimeout` respectively. These timeouts now control how long to wait for a response from the redirect bridge via BroadcastChannel API.

#### `asyncPopups`

The `asyncPopups` parameter has been renamed to `navigatePopups` in `SystemOptions` and the options reversed. This sets whether popups are opened and navigated to later. When set to true, blank popups are opened and navigates to login domain. When set to false, popups are opened directly to the login domain. This can be set to false for scenarios where `about:blank` is not supported, e.g. desktop apps or progressive web apps.

**Note that by default, `navigatePopups` is now set to true**. If you were using `asyncPopups` before, you will now have to change it to `navigatePopups` and reverse your configuration.

See the [Configuration doc](./configuration.md#system-config-options) for more details.

## Changes on request

### Removal of `onRedirectNavigate` parameter

The `onRedirectNavigate` parameter will *only be supported* from `Configuration` object going forward and is removed from `RedirectRequest` and `EndSessionRequest` objects. Please ensure to set it in msal config if you need to use it.

### Consolidation of extra request parameters

The following request parameters have been removed:

-   `authorizePostBodyParams`
-   `tokenBodyParameters`
-   `tokenQueryParameters`

In order to simplify extra request parameters, generic extra parameters should go in the new `extraParameters` request option. When `extraParameters` are set in a request, they will be sent on all token service calls in either the URL query string or the request body, depending on the `httpMethod` configured (default is `GET`) in the request. **To submit extra parameters that MUST go in the URL query string, `extraQueryParameters` is still available.**

> Note: If you're unsure whether the extra parameter should go in the `extraQueryStringParameters` or the `extraParameters`, it should most likely go in `extraParameters`.


#### v4 (previous) request example:

```javascript
// Example of a GET request with extra parameters
const authRequest = {
    scopes: ["SAMPLE_SCOPE"],
    extraQueryParamters: {
        "dc": "DC_VALUE" // This was sent on the query string on GET /authorize
    },
    tokenBodyParameters: {
        "extra_parameters_assertion": "ASSERTION_VALUE" // This was sent on the POST body to /token
    },
    tokenQueryParamters: {
        "slice": "SLICE_VALUE" // This was sent on the query string on POST /token
    }
}

// Example of a POST request with extra parameters
const authRequest = {
    scopes: ["SAMPLE_SCOPE"],
    httpMethod: "POST", // default is "GET" -> Determines method for "/authorize" call. Calls to "/token" are always POST
    extraQueryParamters: {
        "dc": "DC_VALUE" // This was sent on the query string on POST /authorize
    },
    authorizePostBodyParameters: {
        "extra_parameters_assertion": "ASSERTION_VALUE", // This was sent on the body on POST /authorize
    }
    tokenBodyParameters: {
        "extra_parameters_assertion": "ASSERTION_VALUE" // This was sent on the POST body to /token
    },
    tokenQueryParamters: {
        "slice": "SLICE_VALUE" // This was sent on the query string on POST /token
    }
}
```

#### v5 Request Example

```javascript
// Example of a GET request with extra parameters
const authRequest = {
    scopes: ["SAMPLE_SCOPE"],
    extraQueryParamters: {
        // Will be sent in query string to /authorize and /token
        "dc": "DC_VALUE",
        "slice": "SLICE_VALUE"
    },
    extraParameters: {
        "extra_parameters_assertion": "ASSERTION_VALUE", // Will be sent in query string to /authorize and in body to /token
    },
};

// Example of a POST request with extra parameters
const authRequest = {
    scopes: ["SAMPLE_SCOPE"],
    httpMethod: "POST", // default is "GET" -> Determines method for "/authorize" call. Calls to "/token" are always POST
    extraQueryParamters: {
        // Will be sent in query string to /authorize and /token
        "dc": "DC_VALUE",
        "slice": "SLICE_VALUE"
    },
    extraParameters: {
        extra_parameter_assertion: "assertion_value", // Will be sent in post body to /authorize and /token
    },
};
```

> Note: In cases where MSAL determines `extraParameters` must be encoded into the URL string, `extraParameters` will be merged with `extraQueryParams` in a way that will cause same-named parameters to be overwritten. In these cases, the value for the parameter in `extraParameters` will take precedence over the value in the `extraQueryParams`.

### Cross-Origin-Opener-Policy (COOP) Support

MSAL Browser v5 introduces built-in support for Cross-Origin-Opener-Policy (COOP), which enhances security by isolating browsing contexts. When the authentication service (Microsoft Entra ID or Azure AD B2C) returns COOP headers, traditional popup and silent iframe authentication flows are restricted. MSAL v5 provides a redirect bridge mechanism to handle authentication in COOP-enabled environments.

**Note:** Microsoft Entra ID (formerly Azure AD) has COOP enabled by default. For Azure AD B2C, COOP availability depends on your backend configuration and the authentication endpoints being used.

#### What Changed

When COOP headers are present on the authentication service response (e.g., `Cross-Origin-Opener-Policy: same-origin`), traditional popup and silent iframe authentication flows will fail because the authentication window cannot communicate back to the main application window. MSAL v5 solves this by introducing a redirect bridge pattern.

**All authentication flows** (`acquireTokenSilent()`, `ssoSilent()`, `loginPopup()`, `loginRedirect()`, and `logoutPopup()`) now use the redirect bridge. The redirect bridge handles the authentication response differently based on the flow:

- **Popup and silent flows**: The redirect bridge broadcasts the authentication response to the main application window using the BroadcastChannel API
- **Redirect flow**: The redirect bridge caches the authentication response in `sessionStorage` and navigates back to your application's page that initiated the redirect. On the destination page, `handleRedirectPromise` picks up the cached response automatically. This avoids appending auth parameters to the URL, which would otherwise cause issues for single-page applications that use hash-based routing (e.g., `/#/dashboard`). If `sessionStorage` is unavailable (quota exceeded, restricted storage), the bridge still navigates to your application but `handleRedirectPromise` will return `null` and your app should handle re-authentication.
- **`logoutPopup()`**: The redirect bridge broadcasts the logout completion back to the main window and closes the popup. For this to work, `postLogoutRedirectUri` must point to a page that implements the redirect bridge. The simplest approach is to set `postLogoutRedirectUri` to the same value as `redirectUri`. See the [Redirect Bridge — Logout section](./redirect-bridge.md#logout-and-the-redirect-bridge) for details.
- **`logoutRedirect()`**: The redirect bridge is optional. If present on the `postLogoutRedirectUri` page, it will navigate the user back to the origin page. Otherwise, the user stays on the `postLogoutRedirectUri` page after logout.

#### How It Works

1. **Main application**: Your application initiates authentication using `loginPopup()`, `ssoSilent()`, or `loginRedirect()`
2. **Redirect**: MSAL opens a popup/iframe/window to an authority page
3. **Authentication flow**: The authority page completes the OAuth flow and receives the auth response
4. **Response handling**: The redirect page uses the new `broadcastResponseToMainFrame()` function which:
    - For **popup/silent flows**: Broadcasts the response to the main window via BroadcastChannel API
    - For **redirect flows**: Caches the response in `sessionStorage` and navigates to the page where `acquireTokenRedirect` was initiated, where `handleRedirectPromise` retrieves the cached response
5. **Token acquisition**: The main application receives the response and completes token acquisition

#### Migration Steps

##### 1. Set up the redirect bridge page

Create a page that calls `broadcastResponseToMainFrame()` from `@azure/msal-browser/redirect-bridge`. This page must **NOT** be served with COOP headers.

The setup varies by build system — see the **[Redirect Bridge — Framework-Specific Setup](./redirect-bridge.md)** guide:

| Framework                                                                | Approach |
|--------------------------------------------------------------------------|---|
| [Angular](./redirect-bridge.md#angular)                             | Route component + optional `angular.json` assets |
| [Vite](./redirect-bridge.md#vite)                                   | Multi-page `rollupOptions.input` |
| [Webpack](./redirect-bridge.md#webpack)                             | Separate entry + `HtmlWebpackPlugin` |
| [Next.js](./redirect-bridge.md#nextjs)                              | Page component excluded from `MsalProvider` |
| [CRA (Create React App)](./redirect-bridge.md#create-react-app-cra) | Static `public/redirect.html` page |
| [Express.js](./redirect-bridge.md#expressjs--nodejs-backend)        | Server-side COOP header exclusion |

**See also:** [Redirect URI considerations](./login-user.md#redirecturi-considerations) | [Popup interaction_in_progress errors](./login-user.md#handling-popup-interaction_in_progress-errors) | [MDN: COOP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy)

> [!WARNING]
> If the redirect bridge is **not** configured correctly (for example, your
> `redirectUri` does not point to a page that runs `broadcastResponseToMainFrame()`),
> popup and iframe-based authentication flows (`ssoSilent`, `acquireTokenPopup`,
> `loginPopup`, and `acquireTokenSilent` when it falls back to a hidden iframe)
> will fail. Redirect-based flows (`acquireTokenRedirect` / `loginRedirect`) will
> still complete, but will not benefit from the redirect bridge isolation and
> optimizations until the bridge is correctly configured.

> [!CAUTION]
> **Do NOT load the redirect bridge page from a CDN** (e.g., jsdelivr, unpkg,
> cdnjs). The bridge receives the raw authentication response — including
> authorization codes and tokens — and loading it from a third-party CDN
> creates a supply-chain and token-theft risk. Always bundle the redirect
> bridge with your application and serve it **from the same origin** as your
> application. The bridge page should also be served with
> `Cache-Control: no-store` to prevent intermediaries from caching the
> authentication response. See the [Redirect Bridge guide](./redirect-bridge.md) for
> details.

##### 2. Update your MSAL configuration

Point `redirectUri` to a new redirect bridge page:

```javascript
const msalConfig = {
    auth: {
        clientId: "{your-client-id}",
        authority: "https://login.microsoftonline.com/common",
        redirectUri: "https://{your-app-home-page}/redirect",
    },
};
```

> [!IMPORTANT]
> You **MUST** also update the redirect URI in your
> [Entra ID app registration](https://learn.microsoft.com/azure/active-directory/develop/quickstart-register-app#add-a-redirect-uri).
> The URI must match **exactly** — including path, protocol, and port.
> Failure to do so will result in `redirect_uri_mismatch` errors.

## Behavioral Breaking Changes

### Event types and InteractionStatus changes

We have consolidated event types and InteractionStatus to reflect what happened rather than what API it happened in.

1. `SSO_SILENT` and `ACQUIRE_TOKEN_BY_CODE` events have been replaced with `ACQUIRE_TOKEN` events (`START`/`SUCCESS`/`FAILURE` variants)
1. `ACCOUNT_ADDED` and `ACCOUNT_REMOVED` have been replaced with `LOGIN_SUCCESS` and `LOGOUT_SUCCESS`, respectively.
1. `LOGIN_START` and `LOGIN_FAILURE` have been replaced with `ACQUIRE_TOKEN_START` and `ACQUIRE_TOKEN_FAILURE`, respectively.
1. The payload for `LOGIN_SUCCESS` is now an `AccountInfo` object.
1. Any successful login now emits both a `LOGIN_SUCCESS` and `ACQUIRE_TOKEN_SUCCESS` event.

#### `LOGIN_SUCCESS` payload type migration

If your event callback currently casts `LOGIN_SUCCESS` payloads to `AuthenticationResult`, update it to use `AccountInfo` for `LOGIN_SUCCESS` and reserve `AuthenticationResult` for `ACQUIRE_TOKEN_SUCCESS`.

```typescript
// BEFORE (v4-style assumption)
import {
    EventType,
    AuthenticationResult,
} from "@azure/msal-browser";

pca.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS) {
        const result = event.payload as AuthenticationResult;
        setAccount(result.account); // Will silently fail in v5 where payload is AccountInfo, not AuthenticationResult
    }
});
```

```typescript
// AFTER (v5-safe handling)
import {
    EventType,
    AuthenticationResult,
    AccountInfo,
} from "@azure/msal-browser";

pca.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS) {
        const account = event.payload as AccountInfo;
        setAccount(account);
    }

    if (event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
        const result = event.payload as AuthenticationResult;
        setAccessToken(result.accessToken);
    }
});
```

### Error message format changes

To reduce bundle size, error messages have been moved out of the bundle. When an error is thrown, the `message` property now returns a generic link to the error documentation instead of a descriptive error message:

```javascript
// BEFORE (v4)
error.message = "Token request cannot be made without authorization code or refresh token.";

// AFTER (v5)
error.message = "See https://aka.ms/msal.js.errors#request_cannot_be_made for details";
```

The `errorCode` property remains unchanged and can still be used to identify the specific error. For detailed error descriptions, refer to the [errors documentation](https://aka.ms/msal.js.errors).

**Impact**: If your application relies on parsing or displaying the `error.message` property, you may need to update your error handling code to use the `errorCode` instead or direct users to the documentation link.

#### Updating Error Handling Code

**If you display errors to users**, map `errorCode` to user-friendly messages instead of showing `error.message` directly:

```javascript
// BEFORE (v4)
showError(error.message);

// AFTER (v5) — use errorCode for user-facing messages
const userMessages = {
    request_cannot_be_made: "Please sign in again to continue.",
    interaction_required: "Additional verification is needed.",
    consent_required: "Administrator approval is required for this action.",
    login_required: "Your session has expired. Please sign in again.",
    // Add mappings for error codes your application encounters
};
showError(userMessages[error.errorCode] || "An authentication error occurred.");
```

**If you parse errors for conditional logic**, switch from string matching on `message` to comparing `errorCode` (this was already the recommended approach in v4):

```javascript
// BEFORE (v4) — fragile, relied on message text
if (error.message.includes("interaction_required")) {
    await msalInstance.acquireTokenPopup(request);
}

// AFTER (v5) — use errorCode (stable across versions)
if (error.errorCode === "interaction_required") {
    await msalInstance.acquireTokenPopup(request);
}
```

**If you log errors for diagnostics**, include both `errorCode` and `message` (the message now contains a direct link to the relevant documentation):

```javascript
// AFTER (v5) — log errorCode for programmatic use, message for the docs link
logger.error(`MSAL Error [${error.errorCode}]: ${error.message}`);
// Output: MSAL Error [request_cannot_be_made]: See https://aka.ms/msal.js.errors#request_cannot_be_made for details
```

> **Tip:** The `errorCode` values are the same between v4 and v5 — only the `message` format has changed. If your existing code already branches on `errorCode`, no changes are needed.

### Console logging changes

To reduce bundle size, console log messages are now hashed. Instead of seeing full log messages in the browser console, you will see a hash value:

```javascript
// BEFORE (v4)
[Wed, 15 Jan 2025 10:30:45 GMT] : abc-123 : @azure/msal-browser@4.27.0 : Info - Returning token from cache

// AFTER (v5)
[Wed, 15 Jan 2025 10:30:45 GMT] : abc-123 : @azure/msal-browser@5.0.0 : Info - 7f3a9b2c
```

Debugging in the browser console will require an additional step to decode logs.
To decode hashed logs back to readable messages, use the [decode script](../scripts/decode-logs.cjs).
For more information on using the decode script, see the [script documentation](../scripts/README.md).
