# Token caching in MSAL Node

When MSAL Node acquires a token, it caches it in memory for future usage. MSAL Node manages the token lifetime and refreshing for you. APIs like `acquireTokenSilent()` retrieves the access tokens from the cache for a given account:

```javascript
const msal = require('@azure/msal-node');

// Create msal application object
const cca = new msal.ConfidentialClientApplication({
    auth: {
        clientId: "Enter_the_Application_Id_Here",
        authority: "https://login.microsoftonline.com/Enter_the_Tenant_Info_Here",
        clientSecret: "Enter_the_Client_Secret_Here"
    }
});

/** 
* login* and acquireToken* APIs return an account object containing "homeAccountId"
* you should keep a record of this in your app and use it later on when calling acquireTokenSilent
* For more, see: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/accounts.md
*/
const someUserHomeAccountId = "Enter_User_Home_Account_Id";

const msalTokenCache = cca.getTokenCache();
const account = await msalTokenCache.getAccountByHomeId(someUserHomeAccountId)

const silentTokenRequest = {
    account: account,
    scopes: ["user.read"],
};

cca.acquireTokenSilent(silentTokenRequest).then((response) => {
    // do something with response
}).catch((error) => {
    // catch and handle errors
});
```

MSAL's in-memory token cache is not suitable for production. In production, you should serialize and persist the token cache. Depending on the type of application, you have several alternatives:

* Desktop apps, headless apps (public client): Use [MSAL Node Extensions](../../../extensions/msal-node-extensions/README.md), which provide persistence solutions on Windows, Linux and Mac OS
* Web apps, web APIs, daemon apps (confidential client): Use the [distributed token caching](#performance-and-security) pattern to persist the cache in your choice of storage environment (Redis, MongoDB, SQL databases etc. -keep in mind that you can use these in tandem *e.g.* a Redis cache as a first layer of persistence, and a SQL database as a second, more stable persistence layer)

## Token cache schema

MSAL Node's cache schema is compatible with other MSALs. By default, MSAL's cache is not partitioned: all authentication artifacts by all users are located in a single cache blob, grouped by the type of the authentication artifact (see also: [cache.json](../cache.json)).

```json
{
    "Account": {},
    "IdToken": {},
    "AccessToken": {},
    "RefreshToken": {},
    "AppMetadata": {}
}
```

## Persistence

MSAL Node fires events are when the cache is accessed, apps can choose whether to serialize or deserialize the cache. This often constitutes two actions:

1. Deserialize the cache from disk to MSAL's memory before accessing the cache
2. If the cache in memory has changed, serialize the cache back

For that, MSAL accepts a custom cache plugin in [configuration](./configuration.md). This should implement [ICachePlugin](https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_common.icacheplugin.html):

```typescript
interface ICachePlugin {
    beforeCacheAccess: (tokenCacheContext: TokenCacheContext) => Promise<void>;
    afterCacheAccess: (tokenCacheContext: TokenCacheContext) => Promise<void>;
}
```

* If you are developing a public client app (such as desktop, headless etc.), [MSAL Node Extensions](../../../extensions/msal-node-extensions/README.md) handles this for you.
* If you are developing a confidential client app, you should persist the cache as a separate service, since a single, per-server cache instance isn't suitable for a cloud environment with many servers and app instances.

## Performance and security

On public client apps, [MSAL Node Extensions](../../../extensions/msal-node-extensions/README.md) ensure performance and security for you.

On confidential client applications that handle users (web apps that sign in users and call web APIs, and web APIs calling downstream web APIs), there can be many users and the users are processed in parallel. Our recommendation is to serialize one cache blob per user. Use a key for partitioning the cache (*partition key*), such as:

* For web apps: **homeAccountId** (if on ADFS, use **localAccountId** instead)
* For daemon apps using client credentials grant: **tenantId**
<!-- * For web APIs using OBO: *TBD* -->

For instance, when developing a web app that serve users, implement [ICachePlugin](https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_common.icacheplugin.html) in a class where user's `homeAccountId` is retrieved from the session store:

```typescript
class DistributedCachePlugin implements ICachePlugin {

    // singleton
    private static instance: CachePlugin;

    private persistenceManager: any; // your implementation of a persistence client
    private sessionId: string;

    private constructor(persistenceManager?: any, sessionId?: string) {}

    static getInstance(persistenceManager?: any, sessionId?: string): CachePlugin {}

    async beforeCacheAccess(cacheContext): Promise<void> {
        // get cache from persistence store given given key
        // load the cache into msal's memory
    }
    async afterCacheAccess(cacheContext): Promise<void> {
        // if in-memory cache has changed
            // write cache to disk using a key such as homeAccountId
    }
}
```

## More information

* [(Sample) Public client app using MSAL Node Extensions](../../../extensions/samples/msal-node-extensions/index.js)
* [(Sample) Confidential client Express MVC web app with distributed token cache](../../../samples/msal-node-samples/ExpressTestApp/README.md)
* [(Docs) Token cache serialization](https://github.com/AzureAD/microsoft-authentication-library-for-dotnet/wiki/token-cache-serialization)
* [(Docs) App scenarios and authentication flows](https://docs.microsoft.com/azure/active-directory/develop/authentication-flows-app-scenarios)
