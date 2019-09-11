/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { message_content } from "./MessageHelper";
import { Storage } from "../Storage";

/**
 * Handles Message cache operations
 * @hidden
 */
export class MessageCache {

    private storage: Storage = null;

    /**
     * initialize the class with Storage type
     * @param cacheStorage
     */
    constructor(cacheStorage: Storage) {
        this.storage = cacheStorage;
    }

    /**
     * Writes the message to the cache
     * @param key
     * @param data
     */
    write(key: message_content, data: string) {
        this.storage.setItem(key, data);
    }

    /**
     * retrieves the message from the cache
     * @param key
     */
    read(key: message_content) {
        return this.storage.getItem(key);
    }

    /**
     * erase the message from the cache
     * @param key
     */
    erase(key: message_content) {
        this.storage.removeItem(key);
    }

}
