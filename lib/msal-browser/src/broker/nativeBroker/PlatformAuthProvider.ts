/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    LoggerOptions,
    IPerformanceClient,
    Logger,
    Constants,
    StubPerformanceClient,
    createClientConfigurationError,
    ClientConfigurationErrorCodes,
} from "@azure/msal-common/browser";
import { name, version } from "../../packageMetadata.js";
import {
    BrowserConfiguration,
    DEFAULT_NATIVE_BROKER_HANDSHAKE_TIMEOUT_MS,
} from "../../config/Configuration.js";
import { PlatformAuthExtensionHandler } from "./PlatformAuthExtensionHandler.js";
import { IPlatformAuthHandler } from "./IPlatformAuthHandler.js";
import { PlatformAuthDOMHandler } from "./PlatformAuthDOMHandler.js";
import { createNewGuid } from "../../crypto/BrowserCrypto.js";

/**
 * Checks if the platform broker is available in the current environment.
 * @param domConfig - Whether to enable platform broker DOM API support (required)
 * @param loggerOptions - Optional logger options
 * @param perfClient - Optional performance client
 * @param correlationId - Optional correlation ID
 * @returns Promise<boolean> indicating if platform broker is available
 */
export async function isPlatformBrokerAvailable(
    domConfig: boolean,
    loggerOptions?: LoggerOptions,
    perfClient?: IPerformanceClient,
    correlationId?: string
): Promise<boolean> {
    const logger = new Logger(loggerOptions || {}, name, version);

    const performanceClient = perfClient || new StubPerformanceClient();

    if (typeof window === "undefined") {
        logger.trace(
            "Non-browser environment detected, returning false",
            correlationId || createNewGuid()
        );
        return false;
    }

    return !!(await getPlatformAuthProvider(
        logger,
        performanceClient,
        correlationId || createNewGuid(),
        undefined,
        domConfig
    ));
}

export async function getPlatformAuthProvider(
    logger: Logger,
    performanceClient: IPerformanceClient,
    correlationId: string,
    nativeBrokerHandshakeTimeout?: number,
    enablePlatformBrokerDOMSupport?: boolean
): Promise<IPlatformAuthHandler | undefined> {
    logger.trace("getPlatformAuthProvider called", correlationId);

    logger.trace(
        `Has client allowed platform auth via DOM API: '${enablePlatformBrokerDOMSupport}'`,
        correlationId
    );

    let platformAuthProvider: IPlatformAuthHandler | undefined;
    try {
        if (enablePlatformBrokerDOMSupport) {
            // Check if DOM platform API is supported first
            platformAuthProvider = await PlatformAuthDOMHandler.createProvider(
                logger,
                performanceClient,
                correlationId
            );
        }
        if (!platformAuthProvider) {
            logger.trace(
                "Platform auth via DOM API not available, checking for extension",
                correlationId
            );
            /*
             * If DOM APIs are not available, check if browser extension is available.
             * Platform authentication via DOM APIs is preferred over extension APIs.
             */
            platformAuthProvider =
                await PlatformAuthExtensionHandler.createProvider(
                    logger,
                    nativeBrokerHandshakeTimeout ||
                        DEFAULT_NATIVE_BROKER_HANDSHAKE_TIMEOUT_MS,
                    performanceClient,
                    correlationId
                );
        }
    } catch (e) {
        logger.trace("Platform auth not available", e as string);
    }
    return platformAuthProvider;
}

/**
 * Returns boolean indicating whether or not the request should attempt to use platform broker
 * @param logger
 * @param config
 * @param correlationId
 * @param platformAuthProvider
 * @param authenticationScheme
 */
export function isPlatformAuthAllowed(
    config: BrowserConfiguration,
    logger: Logger,
    correlationId: string,
    platformAuthProvider?: IPlatformAuthHandler,
    authenticationScheme?: Constants.AuthenticationScheme
): boolean {
    logger.trace("isPlatformAuthAllowed called", correlationId);

    // throw an error if allowPlatformBroker is not enabled and allowPlatformBrokerWithDOM is enabled
    if (
        !config.system.allowPlatformBroker &&
        config.experimental.allowPlatformBrokerWithDOM
    ) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidPlatformBrokerConfiguration
        );
    }

    if (!config.system.allowPlatformBroker) {
        logger.trace(
            "isPlatformAuthAllowed: allowPlatformBroker is not enabled, returning false",
            correlationId
        );
        // Developer disabled WAM
        return false;
    }

    if (!platformAuthProvider) {
        logger.trace(
            "isPlatformAuthAllowed: Platform auth provider is not initialized, returning false",
            correlationId
        );
        // Platform broker auth providers are not available
        return false;
    }

    if (authenticationScheme) {
        switch (authenticationScheme) {
            case Constants.AuthenticationScheme.BEARER:
            case Constants.AuthenticationScheme.POP:
                logger.trace(
                    "isPlatformAuthAllowed: authenticationScheme is supported, returning true",
                    correlationId
                );
                return true;
            default:
                logger.trace(
                    "isPlatformAuthAllowed: authenticationScheme is not supported, returning false",
                    correlationId
                );
                return false;
        }
    }
    return true;
}
