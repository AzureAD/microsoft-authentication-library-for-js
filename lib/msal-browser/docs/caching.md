# Caching

When MSAL acquires a token, it caches it for future usage. MSAL manages token lifetimes and refreshing for you. APIs like `acquireTokenSilent()` retrieves tokens from the cache for a given account.

```javascript
const msal = require('@azure/msal-browser');

// Create the msal application object
const pca = new msal.PublicClientApplication({
    auth: {
        clientId: "Enter_the_Application_Id_Here", // e.g. "b1b60dca-c49d-496e-9851-xxxxxxxxxxxx" (guid)
        authority: "https://login.microsoftonline.com/Enter_the_Tenant_Info_Here", // e.g. "common" or your tenantId (guid),
        redirectUri: "/"
    },
    cache: {
       cacheLocation: "sessionStorage"
    }
});

/**
* login* and acquireToken* APIs return an account object containing "homeAccountId"
* you should keep a record of this in your app and use it later on when calling acquireTokenSilent
* For more, see: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/accounts.md
*/
const someUserHomeAccountId = "Enter_User_Home_Account_Id";

const account = await pca.getAccountByHomeId(someUserHomeAccountId);

const silentTokenRequest = {
    account: account,
    scopes: ["user.read"],
};

pca.acquireTokenSilent(silentTokenRequest)
    .then((response) => {
        // do something with response
    }).catch((error) => {
        // catch and handle errors
    });
```

## Cache storage

By default, MSAL stores the various authentication artifacts it obtains from the IdP in browser storage using the [Web Storage API](https://developer.mozilla.org/docs/Web/API/Web_Storage_API) supported by all modern browsers. Accordingly, MSAL offers two methods of storage:

- `sessionStorage` (default):
- `localStorage`

`sessionStorage` is more secure, but `localStorage` allows application or application instances on the same domain to share cache. This enables single sign-on between tabs and user sessions.

Additionally, you can opt-out of browser storage by setting the `cacheLocation` to `memoryStorage` in msal configuration. This means that your application will lose authentication state upon page refresh (however, since users will still have an active session with the IdP, they would be able to re-authenticate without any prompts).

We encourage you to explore the options and make the best decision for your application.

### Cookie storage

MSAL Browser can be configured to use cookies for storing the authentication state, in addition to browser or memory storage. This is useful for apps that need to support older browsers such as Internet Explorer. Please refer to [configuration](./configuration.md#cache-config-options) for more.

### Security

We consider session/local storage secure as long as your application does not have cross-site scripting (XSS) and related vulnurabilities. Please refer to the [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) for securing your applications against XSS. If you are still concerned, we recommend using the `memoryStorage` option instead.

## Cached artifacts

To faciliate efficient token acquisition while also maintaining a good UX, MSAL caches various artifacts resulting from its API calls. At a glance, these are:

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

## Remarks

- MSAL Browser's cache schema is compatible with other MSALs. However, there is no cache sharing support at the moment. 
- We do not recommend apps having business logic dependent on direct use of entities in the cache. Instead, use the appropriate MSAL API when you need to acquire tokens or retrieve accounts.
- Keys used to encrypt proof of possession (PoP) tokens are stored using the [IndexedDB API](https://developer.mozilla.org/docs/Web/API/IndexedDB_API). For more information, please refer to [access-token-proof-of-possession](./access-token-proof-of-possession.md#pop-key-management).

## More information

- [Acquire and cache tokens using the Microsoft Authentication Library](https://docs.microsoft.com/azure/active-directory/develop/msal-acquire-cache-tokens)