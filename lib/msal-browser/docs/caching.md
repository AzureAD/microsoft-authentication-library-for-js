# Caching in MSAL

When MSAL acquires a token, it caches it for future usage. MSAL manages token lifetimes and refreshing for you. The `acquireTokenSilent()` API retrieves access tokens from the cache for a given account and renews them if needed.

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

By default, MSAL stores the various authentication artifacts it obtains from the IdP in browser storage using the [Web Storage API](https://developer.mozilla.org/docs/Web/API/Web_Storage_API) supported by all modern browsers. Accordingly, MSAL offers two methods of persistent storage: `sessionStorage` (default) and `localStorage`. In addition, MSAL provides `memoryStorage` option which allows you to opt-out of storing the cache in browser storage.

| Cache Location   | Cleared on              | Shared between windows/tabs | Redirect flow supported |
|------------------|-------------------------|-----------------------------|-------------------------|
| `sessionStorage` | window/tab close        | No                          | Yes                     |
| `localStorage`   | browser close           | Yes                         | Yes                     |
| `memoryStorage`  | page refresh/navigation | No                          | No                      |

> :bulb: While the authentication state may be lost in session and memory storage due to window/tab close or page refresh/navigation, respectively, users will still have an active session with the IdP as long as the session cookie is not expired and might be able to re-authenticate without any prompts.

The choice between different storage locations reflects a trade-off between better user experience vs. increased security. As the table above indicates, local storage results in the best user experience possible, while memory storage provides the best security since no sensitive information will be stored in browser storage. See the section on [security](#security) and [cached artifacts](#cached-artifacts) below for more.

### LocalStorage Notes

Starting in v4, if you are using the `localStorage` cache location, auth artifacts will be encrypted with [AES-GCM](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#aes-gcm) using [HKDF](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey#hkdf) to derive the key. The base key is stored in a session cookie titled `msal.cache.encryption`.

This cookie will be automatically removed when the browser instance (not tab) is closed, thus making it impossible to decrypt any auth artifacts after the session has ended. These expired auth artifacts will be removed the next time MSAL is initialized and the user may need to reauthenticate. The `localStorage` location still provides cross-tab cache persistence but will no longer persist across browser sessions.  

> [!Important] The purpose of this encryption is to reduce the persistence of auth artifacts, **not** to provide additional security. If a bad actor gains access to browser storage they would also have access to the key or have the ability to request tokens on your behalf without the need for cache at all. It is your responsibility to ensure your application is not vulnerable to XSS attacks [see below](#security)

### Cookie storage

Additionally, MSAL Browser can be configured to use cookies for storing temporary authentication artifacts. This option allows you to support browsers that may clear local/session storage during redirect-based login flows (e.g. Firefox in private mode). Note that when this option is chosen, tokens themselves are still stored in browser or memory storage. Please refer to [configuration](./configuration.md#cache-config-options) for more.

### Security

We consider session/local storage secure as long as your application does not have cross-site scripting (XSS) and related vulnurabilities. Please refer to the [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) for securing your applications against XSS. If you are still concerned, we recommend using the `memoryStorage` option instead.

## Cached artifacts

To faciliate efficient token acquisition while maintaining a good UX, MSAL caches various artifacts resulting from its API calls. Below is a summary of entities in MSAL cache:

- **Durable artifacts** (lasting after the request -see also: [token lifetimes](token-lifetimes.md))
    - access tokens
    - id tokens
    - refresh tokens
    - accounts
- **Ephemeral artifacts** (limited to request lifetime)
    - request metadata (e.g. state, nonce, authority)
    - errors
    - interaction status
- **Telemetry**
    - previous failed request 
    - performance data

> :bulb: Temporary cache entries will always be stored in session storage or in memory unless overridden by the user with the `temporaryCacheLocation` cache option. MSAL will fallback to memory storage if local/session storage is not available. Please read the warning below for more information.

> :bulb: The authorization code is only stored in memory and will be discarded after redeeming it for tokens.

## Warning :warning:
Overriding `temporaryCacheLocation` should be done with caution. Specifically when choosing `localStorage`. Interaction in more than one tab/window will not be supported and you may receive `interaction_in_progress` errors unexpectedly. This is an escape hatch, not a fully supported feature.

When using MSAL.js with the default configuration in a scenario where the user is redirected after successful authentication in a new window or tab, the OAuth 2.0 Authorization Code with PKCE flow will be interrupted. In this case, the original window or tab where the authentication state (code verifier and challenge) are stored, will be lost, and the authentication flow will fail.

To handle this scenario, you can configure MSAL to use `localStorage` as the cache location by overriding the `temporaryCacheLocation` configuration property. This allows the code verifier and challenge to be stored in the browser's `localStorage,` which is persistent across multiple tabs and windows.

## Remarks

- We do not recommend apps having business logic dependent on direct use of entities in the cache. Instead, use the appropriate MSAL API when you need to acquire tokens or retrieve accounts.
- Keys used to encrypt proof of possession (PoP) tokens are stored using a combination of [IndexedDB API](https://developer.mozilla.org/docs/Web/API/IndexedDB_API) and memory storage. For more information, please refer to [access-token-proof-of-possession](./access-token-proof-of-possession.md#pop-key-management).

## More information

- [Acquire and cache tokens using the Microsoft Authentication Library](https://docs.microsoft.com/azure/active-directory/develop/msal-acquire-cache-tokens)