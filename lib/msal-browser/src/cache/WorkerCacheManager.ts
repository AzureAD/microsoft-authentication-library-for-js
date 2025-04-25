/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICrypto, IPerformanceClient, Logger, StaticAuthorityOptions } from "@azure/msal-common";
import { CacheOptions } from "../config/Configuration.js";
import { BrowserCacheManager } from "./BrowserCacheManager.js";
import { EventHandler } from "../event/EventHandler.js";

export class WorkerCacheManager extends BrowserCacheManager {
        constructor(
            clientId: string,
            cacheConfig: Required<CacheOptions>,
            cryptoImpl: ICrypto,
            logger: Logger,
            performanceClient: IPerformanceClient,
            eventHandler: EventHandler,
            staticAuthorityOptions?: StaticAuthorityOptions
        ) {
            super(clientId, cacheConfig, cryptoImpl, logger, performanceClient, eventHandler, staticAuthorityOptions);
        }
}
