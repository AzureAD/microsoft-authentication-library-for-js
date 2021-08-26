# Token caching in MSAL Node

When MSAL Node acquires a token, it caches it in memory for future usage. MSAL Node manages the token lifetime and refreshing for you.

```javascript
const express = require("express");
const msal = require('@azure/msal-node');

const SERVER_PORT = process.env.PORT || 3000;
const REDIRECT_URI = "http://localhost:3000/redirect";

// Before running the sample, you will need to replace the values in the config, 
// including the clientSecret
const config = {
    auth: {
        clientId: "Enter_the_Application_Id_Here",
        authority: "Enter_the_Cloud_Instance_Id_HereEnter_the_Tenant_Info_Here",
        clientSecret: "Enter_the_Client_Secret_Here"
    },
    cache: {
        myCachePlugin
    }
};

// Create msal application object
const cca = new msal.ConfidentialClientApplication(config);

// Create Express App and Routes
const app = express();

app.get('/getMyWebApi', (req, res) => {
    callWebApi(accessToken, (response) => {
        response
    });
});

app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`))
```

In-memory token cache is not suitable for production. In production, you should serialize and persist the token cache. Depending on the type of application, you have several alternatives:

* Desktop apps, Headless apps (public client): Use [MSAL Node Extensions](../../../extensions/msal-node-extensions/README.md), which provide persistence solutions on Windows, Linux and Mac OS
* Web apps, web APIs, daemon apps (confidential client): Use the [distributed token caching](#performance-and-security) pattern to persist the cache on your choice of storage environment (Redis, MongoDB, SQL databases etc.)

## Token schema

MSAL Node's token schema is compatible with other MSALs. By default, all authentication artifacts by all users and apps are grouped in a single cache blob, grouped by the type of the authentication artifact:

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
2. If the cache in memory has changed, serialize the cache

For that, MSAL accepts a custom cache plugin in configuration. This should implement [ICachePlugin](https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_common.icacheplugin.html):

```typescript
interface ICachePlugin {
    beforeCacheAccess: (tokenCacheContext: TokenCacheContext) => Promise<void>;
    afterCacheAccess: (tokenCacheContext: TokenCacheContext) => Promise<void>;
}
```

If you are developing for a public client app (such as desktop, headless etc.), [MSAL Node Extensions](../../../extensions/msal-node-extensions/README.md) handles this for you.

## Performance and security

On confidential client applications that handle users (web apps that sign in users and call web APIs, and web APIs calling downstream web APIs), there can be many users and the users are processed in parallel. For security and performance reasons, our recommendation is to serialize one cache blob per user. Use a cache key for partitioning the cache, such as:

* For web apps: **homeAccountId** (if using ADFS, **localAccountId** instead)
* For daemon apps using client credentials grant: **tenantId**
* For web APIs using OBO: **oboAssertion**

[ICachePlugin](https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_common.icacheplugin.html):

```javascript
module.exports = (persistenceHelper, sessionId) => {
    return {
        beforeCacheAccess: async (cacheContext) => {
            return new Promise(async (resolve, reject) => {
                // get cache from persistence store given given key
                // load the cache into msal's memory
            });
        },
        afterCacheAccess: async (cacheContext) => {
            return new Promise((resolve, reject) => {
    
                // if in-memory cache has changed
                    // write cache to disk using a key such as homeAccountId
            });
        }
    };
};
```

## More information

See the sample: [Express MVC web app with distributed token cache](../../../samples/msal-node-samples/ExpressTestApp/README.md)

Read more on token caching:

* [Token cache serialization](https://github.com/AzureAD/microsoft-authentication-library-for-dotnet/wiki/token-cache-serialization)
* [App scenarios and authentication flows](https://docs.microsoft.com/azure/active-directory/develop/authentication-flows-app-scenarios)
