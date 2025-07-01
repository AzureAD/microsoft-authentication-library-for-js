/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountEntity, AccountInfo } from "@azure/msal-common";
import { IPartitionManager } from "@azure/msal-node";

import RedisClientWrapper from "./RedisClientWrapper";

const SESSION_KEY_PREFIX = "sess:";
const EMPTY_STRING = "";

interface SessionCacheData {
    account: AccountInfo;
    [key: string]: any;
}

class PartitionManager implements IPartitionManager {
    sessionId: string;
    redisClient: RedisClientWrapper;

    constructor(redisClient: RedisClientWrapper, sessionId: string) {
        this.sessionId = sessionId;
        this.redisClient = redisClient;
    }

    async getKey(): Promise<string> {
        try {
            /**
             * express-session keys are prefixed with "sess:"" by default.
             * You can configure this via the session middleware configurations.
             */
            const sessionData = await this.redisClient.get(
                `${SESSION_KEY_PREFIX}${this.sessionId}`
            );
            const session = JSON.parse(sessionData) as SessionCacheData;
            return session.account?.homeAccountId || EMPTY_STRING;
        } catch (error) {
            console.error(error);
        }

        return EMPTY_STRING;
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
