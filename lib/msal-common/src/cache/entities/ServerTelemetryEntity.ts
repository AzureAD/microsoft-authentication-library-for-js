/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { SERVER_TELEM_CONSTANTS } from "../../utils/Constants";

export class ServerTelemetryEntity {
    public failedRequests: Array<string|number>;
    public errors: string[];
    public errorCount: number;
    public cacheHits: number;

    static initializeServerTelemetryEntity(): ServerTelemetryEntity {
        const serverTelemEntity = new ServerTelemetryEntity();
        serverTelemEntity.failedRequests = [];
        serverTelemEntity.errors = [];
        serverTelemEntity.errorCount = 0;
        serverTelemEntity.cacheHits = 0;

        return serverTelemEntity;
    }

    /**
     * validates if a given cache entry is "Telemetry", parses <key,value>
     * @param key
     * @param entity
     */
    static isServerTelemetryEntity(key: string, entity?: object): boolean {

        const validateKey: boolean = key.indexOf(SERVER_TELEM_CONSTANTS.CACHE_KEY) === 0;
        let validateEntity: boolean = true;

        if (entity) {
            validateEntity =
                entity.hasOwnProperty("failedRequests") &&
                entity.hasOwnProperty("errors") &&
                entity.hasOwnProperty("errorCount") &&
                entity.hasOwnProperty("cacheHits");
        }

        return validateKey && validateEntity;
    }
}
