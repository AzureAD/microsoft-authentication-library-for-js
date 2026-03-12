/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ICrypto,
    IPerformanceClient,
    Logger,
} from "@azure/msal-common/browser";
import { EventHandler } from "../../../src/event/EventHandler.js";
import { CryptoOps } from "../../../src/crypto/CryptoOps.js";
import { BrowserCacheManager } from "../../../src/cache/BrowserCacheManager.js";
import {
    buildConfiguration,
    CacheOptions,
} from "../../../src/config/Configuration.js";
import { BrowserPerformanceClient } from "../../../src/telemetry/BrowserPerformanceClient.js";
import { NavigationClient } from "../../../src/navigation/NavigationClient.js";
import { INavigationClient } from "../../../src/navigation/INavigationClient.js";
import { TEST_CONFIG } from "../../utils/StringConstants.js";

export function getDefaultLogger(): Logger {
    return new Logger({}, "test", "1.0.0");
}

export function getDefaultPerformanceClient(
    clientId: string = "client-id"
): IPerformanceClient {
    return new BrowserPerformanceClient({
        auth: {
            clientId: clientId,
        },
    });
}

export function getDefaultEventHandler(): EventHandler {
    return new EventHandler();
}

export function getDefaultCrypto(
    clientId: string = "client-id",
    logger: Logger = getDefaultLogger(),
    performanceClient: IPerformanceClient = getDefaultPerformanceClient(
        clientId
    )
): ICrypto {
    return new CryptoOps(logger, performanceClient);
}

export function getDefaultNavigationClient(): INavigationClient {
    return new NavigationClient();
}

export function getDefaultBrowserCacheManager(
    clientId: string = "client-id",
    logger: Logger = getDefaultLogger(),
    performanceClient: IPerformanceClient = getDefaultPerformanceClient(
        clientId
    ),
    eventHandler: EventHandler = getDefaultEventHandler(),
    crypto: ICrypto = getDefaultCrypto(clientId, logger, performanceClient),
    cacheOption?: Required<CacheOptions>
): BrowserCacheManager {
    if (!cacheOption) {
        const config = buildConfiguration(
            { auth: { clientId: clientId } },
            true
        );
        cacheOption = config.cache;
    }

    return new BrowserCacheManager(
        clientId,
        cacheOption,
        crypto,
        logger,
        performanceClient,
        eventHandler
    );
}
