/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    LoggerOptions,
    IPerformanceClient,
    LogLevel,
    Logger,
    AuthenticationScheme,
} from "@azure/msal-common";
import { name, version } from "../../packageMetadata.js";
import {
    BrowserConfiguration,
    DEFAULT_NATIVE_BROKER_HANDSHAKE_TIMEOUT_MS,
} from "../../config/Configuration.js";
import { BrowserPerformanceClient } from "../../telemetry/BrowserPerformanceClient.js";
import { NativeMessageHandler } from "./NativeMessageHandler.js";
import { NativeConstants } from "../../utils/BrowserConstants.js";
import { PlatformDOMHandler } from "./PlatformDOMHandler.js";

export const PLATFORM_EXTENSION_PROVIDER = "NativeMessageHandler";
export const PLATFORM_DOM_PROVIDER = "PlatformDOMHandler";

export async function isPlatformBrokerAvailable(
    loggerOptions?: LoggerOptions,
    perfClient?: IPerformanceClient
): Promise<boolean> {
    const defaultLoggerOptions: LoggerOptions = {
        loggerCallback: (): void => {
            // Empty logger callback
        },
        piiLoggingEnabled: false,
        logLevel: LogLevel.Trace,
    };

    const logger = new Logger(
        loggerOptions || defaultLoggerOptions,
        name,
        version
    );

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

    // Check and initialize native extension provider if available
    try {
        const nativeExtensionProvider =
            await NativeMessageHandler.createProvider(
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

export class PlatformAuthProvider {
    /**
     * Returns boolean indicating whether or not the request should attempt to use native broker
     * @param logger
     * @param config
     * @param nativeExtensionProvider
     * @param authenticationScheme
     */
    static isBrokerAvailable(
        config: BrowserConfiguration,
        logger: Logger,
        platformAuthProvider?: NativeMessageHandler | PlatformDOMHandler,
        authenticationScheme?: AuthenticationScheme
    ): boolean {
        logger.trace("isPlatformBrokerAvailable called");
        if (!config.system.allowPlatformBroker) {
            logger.trace(
                "isPlatformBrokerAvailable: allowPlatformBroker is not enabled, returning false"
            );
            // Developer disabled WAM
            return false;
        }

        if (!platformAuthProvider) {
            logger.trace(
                "isPlatformBrokerAvailable: Platform extension provider is not initialized, returning false"
            );
            // Extension is not available
            return false;
        }

        if (authenticationScheme) {
            switch (authenticationScheme) {
                case AuthenticationScheme.BEARER:
                case AuthenticationScheme.POP:
                    logger.trace(
                        "isPlatformBrokerAvailable: authenticationScheme is supported, returning true"
                    );
                    return true;
                default:
                    logger.trace(
                        "isPlatformBrokerAvailable: authenticationScheme is not supported, returning false"
                    );
                    return false;
            }
        }

        return true;
    }
}
