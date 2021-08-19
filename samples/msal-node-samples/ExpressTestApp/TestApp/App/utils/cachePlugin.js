module.exports = (persistence, session = {}) => {
    return {
        beforeCacheAccess: async (cacheContext) => {
            return new Promise(async (resolve, reject) => {
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

                    // getting it from account entity
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