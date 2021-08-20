/**
* A custom cache plugin for persisting the msal's token cache, using a persistence solution like Redis or MongoDB
* This effectively implements the ICachePlugin interface from msal. For more information, visit:
* https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_common.icacheplugin.html
*/

module.exports = (persistence, session = {}) => {
    return {
        beforeCacheAccess: async (cacheContext) => {
            return new Promise(async (resolve, reject) => {
                
                // express session ids start with the string "sess:"
                persistence.get("sess:" + session.id, (err, sessionData) => {
                    if (err) {
                        console.log(err);
                        reject();
                    }

                    if (sessionData) {
                        persistence.get(JSON.parse(sessionData).account.homeAccountId, (err, cacheData) => {
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

                    persistence.set(homeAccountId, cacheContext.tokenCache.serialize(), (err, data) => {
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