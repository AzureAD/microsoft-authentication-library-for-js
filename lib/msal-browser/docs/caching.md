# Caching

When MSAL acquires a token, it caches it for future usage. MSAL manages token lifetimes and refreshing for you. The following MSAL APIs will perform one or more cache lookups to acquire tokens or retrieve accounts:

- `acquireTokenSilent()`
- `ssoSilent()`
- `getAccounts()`
- `getActiveAccount()`
- `getAccountByHomeId()`
- `getAccountByLocalId()`

## Cache storage

You can configure the cache storage location via the configuration object that is used to instantiate MSAL:

```typescript
import { PublicClientApplication, BrowserCacheLocation } from "@azure/msal-browser";

const pca = new PublicClientApplication({
    auth: {
        clientId: "Enter_the_Application_Id_Here", // e.g. "b1b60dca-c49d-496e-9851-xxxxxxxxxxxx" (guid)
        authority: "https://login.microsoftonline.com/Enter_the_Tenant_Info_Here", // e.g. "common" or your tenantId (guid),
        redirectUri: "/"
    },
    cache: {
       cacheLocation: BrowserCacheLocation.SessionStorage // "sessionStorage"
    }
});
```

By default, MSAL stores the various authentication artifacts it obtains from the IdP in browser storage using the [Web Storage API](https://developer.mozilla.org/docs/Web/API/Web_Storage_API) supported by all modern browsers. Accordingly, MSAL offers two methods of storage: `sessionStorage` (default) and `localStorage`. In addition, MSAL provides `memoryStorage` option which allows you to opt-out of storing the cache in browser storage.

| Cache Location   | Cleared on              | Shared between windows/tabs | Redirect flow supported |
|------------------|-------------------------|-----------------------------|-------------------------|
| `sessionStorage` | window/tab close        | No                          | Yes                     |
| `localStorage`   | user logout             | Yes                         | Yes                     |
| `memoryStorage`  | page refresh/navigation | No                          | No                      |

> :bulb: While the authentication state may be lost in session and memory storage due to window/tab close or page refresh/navigation, respectively, users will still have an active session with the IdP as long as the session cookie is not expired and might be able to re-authenticate without any prompts.

### Cookie storage

MSAL Browser can be configured to use cookies for storing the authentication state. Note that when this option is choosed, tokens themselves are still stored in browser or memory storage. This is useful for apps that need to support older browsers such as Internet Explorer. Please refer to [configuration](./configuration.md#cache-config-options) for more.

### Security

We consider session/local storage secure as long as your application does not have cross-site scripting (XSS) and related vulnurabilities. Please refer to the [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) for securing your applications against XSS. If you are still concerned, we recommend using the `memoryStorage` option instead.

## Cached artifacts

To faciliate efficient token acquisition while maintaining a good UX, MSAL caches various artifacts resulting from its API calls. At a glance, these are:

- Persistent artifacts 
    - access tokens
    - id tokens
    - refresh tokens
    - accounts
- Temporary artifacts
    - request metadata (e.g. state, nonce, authority)
    - errors
    - interaction status
- Telemetry
    - previous failed request 
    - performance data

> :bulb: Temporary cache entries will always be stored in session storage or in memory. MSAL will fallback to memory storage if local/session storage is not available.

> :bulb: The authorization code is only stored in memory and will be discarded after redeeming it for tokens.

## Remarks

- MSAL Browser's cache schema is compatible with other MSALs. However, there is no cache sharing support at the moment. 
- We do not recommend apps having business logic dependent on direct use of entities in the cache. Instead, use the appropriate MSAL API when you need to acquire tokens or retrieve accounts.
- Keys used to encrypt proof of possession (PoP) tokens are stored using the [IndexedDB API](https://developer.mozilla.org/docs/Web/API/IndexedDB_API) and memory storage. For more information, please refer to [access-token-proof-of-possession](./access-token-proof-of-possession.md#pop-key-management).

## More information

- [Acquire and cache tokens using the Microsoft Authentication Library](https://docs.microsoft.com/azure/active-directory/develop/msal-acquire-cache-tokens)