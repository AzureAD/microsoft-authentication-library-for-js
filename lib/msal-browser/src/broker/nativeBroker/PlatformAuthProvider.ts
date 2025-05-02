/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    LoggerOptions,
    IPerformanceClient,
    Logger,
    AuthenticationScheme,
} from "@azure/msal-common/browser";
import { name, version } from "../../packageMetadata.js";
import {
    BrowserConfiguration,
    DEFAULT_NATIVE_BROKER_HANDSHAKE_TIMEOUT_MS,
} from "../../config/Configuration.js";
import { BrowserPerformanceClient } from "../../telemetry/BrowserPerformanceClient.js";
import { PlatformAuthExtensionHandler } from "./PlatformAuthExtensionHandler.js";
import { NativeConstants } from "../../utils/BrowserConstants.js";
import { IPlatformAuthHandler } from "./IPlatformAuthHandler.js";

/**
 * Checks if the platform broker is available in the current environment.
 * @param loggerOptions
 * @param perfClient
 * @returns
 */
export async function isPlatformBrokerAvailable(
    loggerOptions?: LoggerOptions,
    perfClient?: IPerformanceClient
): Promise<boolean> {
    const logger = new Logger(loggerOptions || {}, name, version);

    logger.trace("isPlatformBrokerAvailable called");

    const defaultPerformanceClientConfig = {
        auth: {
            clientId: "",
        },
    };

    const performanceClient =
        perfClient ||
        new BrowserPerformanceClient(defaultPerformanceClientConfig);

    if (!window) {
        logger.trace("Non DOM environment detected, returning false");
        return false;
    }

    // Check if DOM platform API is supported

    // @ts-ignore
    if (window.navigator?.platformAuthentication) {
        const supportedContracts =
            // @ts-ignore
            await window.navigator.platformAuthentication.getSupportedContracts(
                NativeConstants.MICROSOFT_ENTRA_BROKERID
            );
        if (supportedContracts.includes("get-token-and-sign-out")) {
            logger.trace("Platform auth available in DOM");
            return true;
        }
    }

    /*
     * If DOM APIs are not available, check if browser extension is available.
     * Platform authentication via DOM APIs is preferred over extension APIs.
     */
    try {
        const nativeExtensionProvider =
            await PlatformAuthExtensionHandler.createProvider(
                logger,
                DEFAULT_NATIVE_BROKER_HANDSHAKE_TIMEOUT_MS,
                performanceClient
            );
        if (nativeExtensionProvider) {
            logger.trace(
                "Platform auth available via extension, returning true"
            );
            return true;
        } else {
            logger.trace("Platform auth not available, returning false");
            return false;
        }
    } catch (e) {
        logger.trace(e as string);
        return false;
    }
}

/**
 * Returns boolean indicating whether or not the request should attempt to use native broker
 * @param logger
 * @param config
 * @param platformAuthProvider
 * @param authenticationScheme
 */
export function isBrokerAvailable(
    config: BrowserConfiguration,
    logger: Logger,
    platformAuthProvider?: IPlatformAuthHandler,
    authenticationScheme?: AuthenticationScheme
): boolean {
    logger.trace("isBrokerAvailable called");
    if (!config.system.allowPlatformBroker) {
        logger.trace(
            "isBrokerAvailable: allowPlatformBroker is not enabled, returning false"
        );
        // Developer disabled WAM
        return false;
    }

    if (!platformAuthProvider) {
        logger.trace(
            "isBrokerAvailable: Platform auth provider is not initialized, returning false"
        );
        // Platform broker auth providers are not available
        return false;
    }

    if (authenticationScheme) {
        switch (authenticationScheme) {
            case AuthenticationScheme.BEARER:
            case AuthenticationScheme.POP:
                logger.trace(
                    "isBrokerAvailable: authenticationScheme is supported, returning true"
                );
                return true;
            default:
                logger.trace(
                    "isBrokerAvailable: authenticationScheme is not supported, returning false"
                );
                return false;
        }
    }

    return true;
}
