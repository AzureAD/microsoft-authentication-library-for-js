/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SERVER_TELEM_CONSTANTS } from "../../utils/Constants";

export class ServerTelemetryEntity {
    failedRequests: Array<string | number>;
    errors: string[];
    cacheHits: number;

    constructor() {
        this.failedRequests = [];
        this.errors = [];
        this.cacheHits = 0;
    }

    /**
     * validates if a given cache entry is "Telemetry", parses <key,value>
     * @param key
     * @param entity
     */
    static isServerTelemetryEntity(key: string, entity?: object): boolean {
        const validateKey: boolean =
            key.indexOf(SERVER_TELEM_CONSTANTS.CACHE_KEY) === 0;
        let validateEntity: boolean = true;

        if (entity) {
            validateEntity =
                entity.hasOwnProperty("failedRequests") &&
                entity.hasOwnProperty("errors") &&
                entity.hasOwnProperty("cacheHits");
        }

        return validateKey && validateEntity;
    }
}
