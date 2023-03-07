/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountEntity } from "@azure/msal-common";
import { IPartitionManager } from "@azure/msal-node";
import { RedisClientType } from "redis";

class PartitionManager implements IPartitionManager {
    sessionId: string;
    redisClient: RedisClientType;

    constructor(redisClient: RedisClientType, sessionId: string) {
        this.sessionId = sessionId;
        this.redisClient = redisClient;
    }

    async getKey(): Promise<string> {
        /**
         * express-session keys are prefixed with "sess:"" by default.
         * You can configure this via the session middleware configurations.
         */
        const sessionData = await this.redisClient.get(`sess:${this.sessionId}`);

        try {
            const parsedSessionData = JSON.parse(sessionData); // parse the session data
            return parsedSessionData.account?.homeAccountId || "";
        } catch (error) {
            console.log(error);
        }

        return "";
    }

    async extractKey(accountEntity: AccountEntity): Promise<string> {
        if (accountEntity.hasOwnProperty("homeAccountId")) {
            return accountEntity.homeAccountId; // the homeAccountId is the partition key
        } else {
            throw new Error("homeAccountId is not found");
        }
    }
}

export default PartitionManager;
