/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

function partitionManager(sessionId, redisClient) {
    return {
        getKey: async () => {
            return new Promise((resolve, reject) => {
                redisClient.get(`sess:${sessionId}`, (err, sessionData) => {
                    if (err) {
                        console.log(err);
                        return reject(err);
                    }

                    if (sessionData) {
                        try {
                            const parsedSessionData = JSON.parse(sessionData); // parse the session data
                            return resolve(parsedSessionData.account.homeAccountId);
                        } catch (err) {
                            console.log(err)
                            reject(err);
                        }
                    }

                    return null;
                });
            });
        },
        extractKey: async (accountEntity) => {
            return new Promise((resolve, reject) => {
                if (accountEntity.hasOwnProperty("homeAccountId")) {
                    resolve(accountEntity.homeAccountId); // the homeAccountId is the partition key
                } else {
                    reject(new Error("homeAccountId is not defined"));
                } 
            })
        }
    }
}

module.exports = partitionManager;