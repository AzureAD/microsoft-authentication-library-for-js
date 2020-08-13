/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */	

export class ServerTelemetryEntity {
    failedRequests: Array<string|number>;
    errors: string[];
    errorCount: number;
    cacheHits: number;

    static isServerTelemetryEntity(entity: object): boolean {
        return (
            entity.hasOwnProperty("failedRequests") &&
            entity.hasOwnProperty("errors") &&
            entity.hasOwnProperty("errorCount") &&
            entity.hasOwnProperty("cacheHits")
        );
    }
}
