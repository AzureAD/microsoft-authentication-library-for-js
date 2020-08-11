/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type ServerTelemetryCacheValue = {
    failedRequests: Array<string|number>;
    errors: string[];
    errorCount: number;
    cacheHits: number;
};
