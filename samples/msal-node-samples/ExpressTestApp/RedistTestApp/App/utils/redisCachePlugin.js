/**
* A custom cache plugin for persisting the msal's token cache, using a persistence solution like Redis or MongoDB
* This effectively implements the ICachePlugin interface from msal. For more information, visit:
* https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_common.icacheplugin.html
*/
const RedisPersistenceManager = require("./redisPersistenceManager");

module.exports = (redisClient, getPartitionKey, retrievePartitionKey) => {
    const persistenceManager = RedisPersistenceManager(redisClient);

    return {
        beforeCacheAccess: async (cacheContext) => {
            return new Promise(async (resolve, reject) => {
                const partitionKey = await getPartitionKey(persistenceManager);

                persistenceManager.get(partitionKey, (err, cacheData) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                
                    cacheContext.tokenCache.deserialize(cacheData);
                    resolve();
                });
            });
        },
        afterCacheAccess: async (cacheContext) => {
            return new Promise((resolve, reject) => {

                if (cacheContext.cacheHasChanged) {
                    try {
                        const kvStore = cacheContext.tokenCache.getKVStore();

                        if (Object.keys(kvStore).length > 0) {
                            const accountEntity = Object.values(kvStore)[1]; // the second entity is the account
                            const partitionKey = await retrievePartitionKey(accountEntity);
                        
                            persistenceManager.set(partitionKey, cacheContext.tokenCache.serialize(), (err, data) => {
                                if (err) {
                                    console.log(err);
                                    reject(err);
                                }
                                resolve();
                            });
                        }
                    } catch (e) {
                        console.log(e);
                        reject(e);
                    }
                } else {
                    resolve();
                    return;
                }
            });
        }
    };
};