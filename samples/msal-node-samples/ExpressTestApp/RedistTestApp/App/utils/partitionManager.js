/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

function partitionManager(redisClient, sessionId) {
    this.sessionId = sessionId;
    this.redisClient = redisClient;

    return {
        setSessionId: (sessionId) => { 
            this.sessionId = sessionId
        },
        getKey: async () => {
            const sessionData = await this.redisClient.get(`sess:${this.sessionId}`);
            const parsedSessionData = JSON.parse(sessionData); // parse the session data

            return parsedSessionData.account.homeAccountId;
        },
        extractKey: async (accountEntity) => {
            if (accountEntity.hasOwnProperty("homeAccountId")) {
                return accountEntity.homeAccountId; // the homeAccountId is the partition key
            } else {
                throw new Error("homeAccountId is not defined");
            } 
        }
    }
}

module.exports = partitionManager;