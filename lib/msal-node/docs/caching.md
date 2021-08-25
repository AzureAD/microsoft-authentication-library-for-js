# Token caching in MSAL Node

When MSAL Node acquires a token, it caches it in-memory for future usage. MSAL Node manages the token lifetime and refreshing for you. However, MSAL's in-memory token cache is not suitable production. You as a developer are responsible for persisting the token cache. If you are developing a:

* Desktop app (public client): Use [MSAL Node Extensions]() to perform cross-platform token cache serialization and persistence.
* Headless app (public client): Use [MSAL Node Extensions]() to perform cross-platform token cache serialization and persistence.
* Daemon app (confidential client): 
* Web app (confidential client): Use distributed token caching 
* Web API (confidential client):

## Persistence

MSAL Node's token schema is compatible with other MSALs. It looks like the following:

```json
{
    "Account": {},
    "IdToken": {},
    "AccessToken": {},
    "RefreshToken": {},
    "AppMetadata": {}
}
```

Events are fired when the cache is accessed, apps can choose whether to serialize or deserialize the cache. This often constitutes two actions:

1. Deserialize the cache from disk to MSAL's memory before accessing the cache
2. If cache in-memory has changed, serialize the cache to disk

For that MSAL accepts a custom cache plugin in configuration. This should implement [ICachePlugin]():

```typescript
interface ICachePlugin {
    beforeCacheAccess: (tokenCacheContext: TokenCacheContext) => Promise<void>;
    afterCacheAccess: (tokenCacheContext: TokenCacheContext) => Promise<void>;
}
```

For an implementation, [see]()

## Performance and security

On confidential client applications that handle users (web apps that sign in users and call web APIs, and web APIs calling downstream web APIs), there can be many users and the users are processed in parallel. For security and performance reasons, our recommendation is to serialize one cache per user. Serialization events compute a cache key based on the identity of the processed user and serialize/deserialize a token cache for that user.

1. First time user signs-in via auth code flow, token cache is populated
2. Dev serializes token cache and puts in storage, say a key value store like Redis. Will need a way to get JSON blob later for this end user, perhaps by keeping the key they used to store the token cache in a cookie, or maybe storing in the session, which the web framework will handle for them.
3. User comes back a later time, making a request to a different machine where the in-memory cache is not present. The request has the cache key in a cookie or in the user’s session. Dev uses key to query storage, and loads the token cache, and deserializes into MSAL Node confidential client app.  
4. Dev can now use acquire token silent to refresh tokens.

```javascript
module.exports = (persistenceClient, sessionId = {}) => {
    return {
        beforeCacheAccess: async (cacheContext) => {
            return new Promise(async (resolve, reject) => {
                
                // express session ids start with the string "sess:"
                persistenceClient.get("sess:" + sessionId, (err, sessionData) => {
                    if (err) {
                        console.log(err);
                        reject();
                    }

                    if (sessionData) {
                        persistenceClient.get(JSON.parse(sessionData).account.homeAccountId, (err, cacheData) => {
                            if (err) {
                                console.log(err);
                                reject();
                            }
                            cacheContext.tokenCache.deserialize(cacheData);
                            resolve();
                        });
                    } else {
                        resolve();
                        return;
                    }
                });
            });
        },
        afterCacheAccess: async (cacheContext) => {
            return new Promise((resolve, reject) => {

                if (cacheContext.cacheHasChanged) {
                    const kvStore = cacheContext.tokenCache.getKVStore();

                    // getting homeAccountId from account entity in kvStore
                    const homeAccountId = Object.values(kvStore)[1]["homeAccountId"];

                    persistenceClient.set(homeAccountId, cacheContext.tokenCache.serialize(), (err, data) => {
                        if (err) {
                            console.log(err);
                            reject();
                        }
                        resolve();
                    });
                } else {
                    resolve();
                    return;
                }
            });
        }
    };
};
```

## More information

See the sample: [Express MVC web app with distributed token cache]()

Read more on token caching:

- []()
- []()