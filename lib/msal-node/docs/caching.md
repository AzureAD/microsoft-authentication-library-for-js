# Token caching in MSAL Node

When MSAL Node acquires a token, it caches it in memory for future usage. MSAL Node manages the token lifetime and refreshing for you. APIs like `acquireTokenSilent()` retrieves access tokens from the cache for a given account:

> :information_source: MSAL does not expose refresh tokens for security reasons. See [FAQ: How do I get the Refresh Token](./faq.md#how-do-i-get-the-refresh-token) for more.

### Using secrets securely

Secrets should never be hardcoded. The dotenv npm package can be used to store secrets in a .env file (located in project's root directory) that should be included in .gitignore to prevent accidental uploads of the secrets.

```javascript
const msal = require("@azure/msal-node");
require("dotenv").config(); // process.env now has the values defined in a .env file

// Create msal application object
const cca = new msal.ConfidentialClientApplication({
    auth: {
        clientId: "Enter_the_Application_Id_Here", // e.g. "b1b60dca-c49d-496e-9851-xxxxxxxxxxxx" (guid)
        authority:
            "https://login.microsoftonline.com/Enter_the_Tenant_Info_Here", // e.g. "common" or your tenantId (guid)
        clientSecret: process.env.clientSecret, // obtained during app registration
    },
});

/**
 * acquireToken* APIs return an account object containing the "homeAccountId"
 * you should keep a record of this in your app and use it later on when calling acquireTokenSilent
 * For more, see: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/accounts.md
 */
const someUserHomeAccountId = "Enter_User_Home_Account_Id";

const msalTokenCache = cca.getTokenCache();
const account = await msalTokenCache.getAccountByHomeId(someUserHomeAccountId);

const silentTokenRequest = {
    account: account,
    scopes: ["User.Read"],
};

cca.acquireTokenSilent(silentTokenRequest)
    .then((response) => {
        // do something with response
    })
    .catch((error) => {
        // catch and handle errors
    });
```

In production, MSAL's in-memory token cache does not scale. Use the [distributed token caching](#performance-and-security) pattern to persist the cache in your choice of storage environment (Redis, MongoDB, SQL databases, and so on).

## In-memory cache

MSAL maintains an in-memory cache. The in-memory cache is representative of the application cache state. The lifetime of in-memory cache is the same as the MSAL application object. If the process using MSAL restarts, the cache is erased when the process lifecycle finishes. If the in-memory cache is empty and there is no persistent cache to restore the cache from, users will have to re-authenticate. When this happens, if the user still has an active session with Azure AD, they might re-authenticate without any prompts, however this still degrades the user experience. Service-to-service scenarios (i.e. client credentials flow, on-behalf-of flow) also suffer because getting a token from Azure AD involves HTTP requests, and is much slower than getting a token from cache.

### Bounded credential cache

MSAL Node bounds in-memory access token, refresh token, and ID token credentials by both entry count and logical weight. The default limits are 10,000 credentials and 20 MiB of logical weight. Both limits apply simultaneously: the logical-weight limit constrains typical token data and generated indexes, while the entry limit separately guards against many small credential objects. Configure them with `cache.maxTokenCacheEntries` and `cache.maxTokenCacheSizeInBytes`; both must use the finite positive ranges described in [configuration](./configuration.md#cache-config-options), and neither limit can be disabled.

The least recently used credential is evicted when admitting or updating a credential would exceed either limit. A credential returned by a structurally successful cache selection becomes most recently used before later authentication validation, even if that validation rejects it because of expiry, resource, or token-binding-key requirements. Cache misses, filter failures, and ambiguous duplicate selections do not promote a credential. A credential whose individual logical weight exceeds the configured byte limit is not retained. Replacing an existing credential with an oversized value removes the old value without evicting unrelated credentials.

Logical weight is deterministic cache accounting, not a measurement or guarantee of process heap or RSS. For each credential it includes:

-   the UTF-8 byte length of the serialized persisted cache key and credential value;
-   the UTF-8 byte lengths of the tuple and normalized scope strings actually stored for that credential (access-token scopes are represented in both the standard and OBO indexes); and
-   one logical byte for each generated index posting.

The entry-count limit provides a separate guard for object overhead not represented by this formula. Account, application metadata, authority metadata, telemetry, throttling, and unrecognized records are not credential entries and are not evicted when credential capacity is reached. The persisted cache schema, keys, and value shapes are unchanged.

Each `ConfidentialClientApplication` owns its in-memory limits. Managed Identity preserves its process-wide shared cache: the first `ManagedIdentityApplication` instance owns an immutable process-wide policy, and later instances must omit limits or specify matching values. Explicit conflicts fail without resizing or replacing the shared cache.

When a cache plugin loads more credentials than the configured limits, MSAL deterministically trims the in-memory state and reports `cacheHasChanged` during the corresponding `afterCacheAccess` callback. Plugins that follow the standard `cacheHasChanged` contract persist the trimmed state, preventing evicted credentials from being restored by the next plugin load.

These limits are safeguards, not a scaling target. Server-side applications should still partition and persist cache data as described in [performance and security](#performance-and-security).

> :warning: We recommend **persisting** the cache with **encryption** for all production applications both for security and desired cache longevity. If you choose not to persist the cache, the [TokenCache](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_node.tokencache.html) interface is still available to access the cached entities.

In MSAL Node v7, `TokenCache.getKVStore()` returns a defensive snapshot for
inspection. Mutating that object does not update MSAL's in-memory cache. Cache
persistence and replacement must use the supported `serialize()` and
`deserialize()` APIs through a cache plugin.

## Persistent cache

MSAL Node fires events when the in-memory cache is accessed and apps can choose whether to persist the cache (see: [TokenCacheContext](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_common.tokencachecontext.html)) (e.g. to a file, a SQL database and etc.). This constitutes two actions:

1. Load the cache from persistence to MSAL's memory before accessing the cache
2. If the in-memory cache has changed since last access, save the cache back to persistence

For persisting the cache, MSAL accepts a custom cache plugin in [configuration](./configuration.md). This plugin should implement the [ICachePlugin](https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_common.ICachePlugin.html) interface:

```typescript
interface ICachePlugin {
    beforeCacheAccess: (tokenCacheContext: TokenCacheContext) => Promise<void>;
    afterCacheAccess: (tokenCacheContext: TokenCacheContext) => Promise<void>;
}
```

A basic implementation of `ICachePlugin` interface might look as follows (see also [performance and security](#performance-and-security) if you are building a server-side app):

```typescript
class MyCachePlugin implements ICachePlugin {
    private client: ICacheClient;

    constructor(client: ICacheClient) {
        this.client = client; // client object to access the persistent cache
    }

    public async beforeCacheAccess(
        cacheContext: TokenCacheContext
    ): Promise<void> {
        const cacheData = await this.client.get(); // get the cache from persistence
        cacheContext.tokenCache.deserialize(cacheData); // deserialize it to in-memory cache
    }

    public async afterCacheAccess(
        cacheContext: TokenCacheContext
    ): Promise<void> {
        if (cacheContext.cacheHasChanged) {
            await this.client.set(cacheContext.tokenCache.serialize()); // deserialize in-memory cache to persistence
        }
    }
}
```

Confidential client applications should persist the cache via a separate service, since a single, _per-server_ cache instance isn't suitable for a cloud environment with many servers and app instances.

> :warning: We strongly recommend encrypting the token cache when persisting it on disk.

## Performance and security

On confidential client apps that handle users (web apps that sign in users and call web APIs, and web APIs calling downstream web APIs), there can be many users active concurrently for a given application. Our recommendation is to serialize one cache blob (see [CacheRecord](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/src/cache/entities/CacheRecord.ts)) per user. This would help with scaling the cache across a distributed system. Use a key for partitioning the cache (_i.e._ **partition key**), such as:

-   For web apps: `<userObjectId>.<tenantId>` (i.e. `homeAccountId`)
-   For multi-tenant daemon apps using client credentials grant: `<clientId>.<tenantId>`
-   For web APIs calling other web APIs using OBO: hash of the incoming access token (i.e. `oboAssertion`) -the token which will subsequently be exchanged for an OBO token

> :warning: Please make sure to see [performance](./performance.md) for more information on how to monitor usage and avoid poor performance.

### Web apps

Since web apps are user-facing and often rely on sessions to keep track of each user, the appropriate partition key for caching is often stored within the session data, and needs to be retrieved before the cache lookup can take place. To help with this, MSAL Node provides the [DistributedCachePlugin](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_node.distributedcacheplugin.html) class, which implements the [ICachePlugin](https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_common.ICachePlugin.html). An instance of `DistributedCachePlugin` requires:

-   a **client interface** ([ICacheClient](https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_node.ICacheClient.html)), which implements `get` and `set` operations on the persistence server (Redis, MySQL etc.).
-   a **partition manager** ([IPartitionManager](https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_node.IPartitionManager.html)), for reading from and writing to cache with respect to a given **session ID**.

Please refer to the [Web app using DistributedCachePlugin](../../../samples/msal-node-samples/auth-code-distributed-cache/README.md) for a sample implementation.

## More information

See the samples below for more about how to handle caching in MSAL Node apps:

-   [(CCA) Web app using DistributedCachePlugin](../../../samples/msal-node-samples/auth-code-distributed-cache/README.md)
-   [(CCA) Web API using a custom distributed cache plugin](../../../samples/msal-node-samples/auth-code-distributed-cache/README.md)
-   [(CCA) Daemon app using a custom distributed cache plugin](../../../samples/msal-node-samples/auth-code-distributed-cache/README.md)
