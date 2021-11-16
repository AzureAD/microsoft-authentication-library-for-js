/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IRedisClient } from "./IRedisClient";
import { IPersistenceManager } from "../IPersistenceManager";

export class RedisPersistenceManager implements IPersistenceManager {
    private client: IRedisClient;

    constructor(client: IRedisClient) {
        this.client = client;
    }
    
    async get(key: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, data) => {
                if (err) {
                    return reject(err);
                }
                    
                return resolve(data);
            });
        });
    }
    
    async set(key: string, value: any): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.set(key, value, (err, data) => {
                if (err) {
                    return reject(err);
                }
    
                return resolve(data);
            });
        });
    }
}
