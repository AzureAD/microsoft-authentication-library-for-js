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

| Cache Location   | Cleared on                                             | Shared between windows/tabs | Redirect flow supported |
|------------------|--------------------------------------------------------|-----------------------------|-------------------------|
| `sessionStorage` | window/tab close                                       | No                          | Yes                     |
| `localStorage`   | browser close (unless user selected keep me signed in) | Yes                         | Yes                     |
| `memoryStorage`  | page refresh/navigation                                | No                          | No                      |

> :bulb: While the authentication state may be lost in session and memory storage due to window/tab close or page refresh/navigation, respectively, users will still have an active session with the IdP as long as the session cookie is not expired and might be able to re-authenticate without any prompts.

The choice between different storage locations reflects a trade-off between better user experience vs. increased security. As the table above indicates, local storage results in the best user experience possible, while memory storage provides the best security since no sensitive information will be stored in browser storage. See the section on [security](#security) and [cached artifacts](#cached-artifacts) below for more.

### LocalStorage Notes

Starting in v4, if you are using the `localStorage` cache location, auth artifacts will be encrypted unless the user selects "Keep me signed in" during sign in. The encryption algorithm used is [AES-GCM](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#aes-gcm) using [HKDF](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey#hkdf) to derive the key. The base key is stored in a session cookie titled `msal.cache.encryption`.

This cookie will be automatically removed when the browser instance (not tab) is closed, thus making it impossible to decrypt any auth artifacts after the session has ended. These expired auth artifacts will be removed the next time MSAL is initialized and the user may need to reauthenticate. The `localStorage` location still provides cross-tab cache persistence for all users but will only persist across browser sessions for users who selected "Keep me signed in" (KMSI).

> [!NOTE]
> Safari ITP may evict script-writable storage (including `localStorage`) after around 7 days without direct user navigation, which can remove cached auth artifacts and require reauthentication. If Safari reliability is a priority, consider `sessionStorage` and ensure your app gracefully falls back to interactive auth when silent token acquisition fails. See [Browser-specific guidance](./browser-specific-guidance.md).

> [!Important] The purpose of this encryption is to reduce the persistence of auth artifacts, **not** to provide additional security. If a bad actor gains access to browser storage they would also have access to the key or have the ability to request tokens on your behalf without the need for cache at all. It is your responsibility to ensure your application is not vulnerable to XSS attacks [see below](#security)

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

> :bulb: Temporary cache entries will always be stored in session storage or in memory. MSAL will fallback to memory storage if sessionStorage is not available.

> :bulb: The authorization code is only stored in memory and will be discarded after redeeming it for tokens.

## Cache persistence during MSAL.js upgrades and rollbacks

Occasionally MSAL.js needs to make changes to the shape of the cached artifacts to support new requirements, features or bug fixes. As often as possible these changes will be made in a backwards compatible way so as to ensure that when an application upgrades to a new version or rolls back to an older one the cache present in a user's browser can still be used. However, this is not always possible and you may end up in a state where multiple copies of the cache exist concurrently, one used by the current version of MSAL.js running and another that was written by the version used prior to the upgrade. This is done to allow applications to gracefully rollback, if needed. In the vast majority of upgrades, MSAL.js will migrate any existing cache into the new format for a seamless upgrade experience. In rare cases, such as the upgrade from v3 to v4, this may not be possible due to security or privacy requirements and this will always result in a major version bump. 

When a breaking cache change is made the older cache will be kept for 5 days, by default, to allow for a rollback if needed. The length of time old cache is kept can be configured using the `cacheRetentionDays` cache configuration on `PublicClientApplication`. If the cache has not been actively used within that time it will be cleared the next time MSAL.js is initialized. Additionally, if you do not anticipate needing to rollback you may set this value to `0` to indicate that old cache should always be removed immediately upon upgrading to a new version of MSAL.js. Conversely, if you have a longer rollout window for upgrades you may choose to set this to a longer value.

> [!NOTE]
> Access and Refresh tokens will be removed once they have expired, even if the configured `cacheRetentionDays` has not yet been reached.
> Valid access tokens may also be removed at any time if browser storage reaches its storage quota. When storage quotas are reached access tokens will be removed on a First In First Out basis, starting with entries written by a previous version of MSAL.js and then moving on to entries written by the current version of MSAL.js.

```javascript
const config = {
    auth: {
        clientId: "<your-client-id>"
    },
    cache: {
        cacheLocation: "localStorage",
        cacheRetentionDays: 0 // Set this to the number of days you want old cache to be preserved in the event a rollback is needed (Default 5 days)
    }
}

const pca = new PublicClientApplication(config);
await pca.initialize();
```

## Remarks

- We do not recommend apps having business logic dependent on direct use of entities in the cache. Instead, use the appropriate MSAL API when you need to acquire tokens or retrieve accounts.
- Keys used to encrypt proof of possession (PoP) tokens are stored using a combination of [IndexedDB API](https://developer.mozilla.org/docs/Web/API/IndexedDB_API) and memory storage. For more information, please refer to [access-token-proof-of-possession](./access-token-proof-of-possession.md#pop-key-management).

## More information

- [Acquire and cache tokens using the Microsoft Authentication Library](https://docs.microsoft.com/azure/active-directory/develop/msal-acquire-cache-tokens)
