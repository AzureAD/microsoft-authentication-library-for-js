import {
    Logger,
    IPerformanceClient,
    Constants,
    ClientConfigurationErrorCodes,
} from "@azure/msal-common/browser";
import * as PlatformAuthProvider from "../../src/broker/nativeBroker/PlatformAuthProvider.js";
import { getDefaultPerformanceClient } from "../utils/TelemetryUtils.js";
import { PlatformAuthDOMHandler } from "../../src/broker/nativeBroker/PlatformAuthDOMHandler.js";
import {
    BrowserConfiguration,
    buildConfiguration,
    Configuration,
} from "../../src/config/Configuration.js";
import { PlatformAuthExtensionHandler } from "../../src/broker/nativeBroker/PlatformAuthExtensionHandler.js";
import { TEST_CONFIG } from "../utils/StringConstants.js";
import { PlatformAuthConstants } from "../../src/utils/BrowserConstants.js";
import * as BrowserPerformanceEvents from "../../src/telemetry/BrowserPerformanceEvents.js";
import { PerformanceEvent } from "@azure/msal-common/browser";

describe("PlatformAuthProvider tests", () => {
    function stubExtensionProvider() {
        return jest
            .spyOn(PlatformAuthExtensionHandler, "createProvider")
            .mockImplementation(async () => {
                return new PlatformAuthExtensionHandler(
                    logger,
                    2000,
                    performanceClient,
                    "test-extensionId"
                );
            });
    }

    function stubDOMProvider() {
        return jest
            .spyOn(PlatformAuthDOMHandler, "createProvider")
            .mockImplementation(async () => {
                return new PlatformAuthDOMHandler(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                );
            });
    }

    let performanceClient: IPerformanceClient;
    let logger: Logger;
    beforeEach(() => {
        performanceClient = getDefaultPerformanceClient();
        logger = new Logger({}, "test", "1.0.0");
    });
    afterEach(() => {
        window.sessionStorage.clear();
        jest.restoreAllMocks();
    });

    describe("isPlatformBrokerAvailable tests", () => {
        it("should return false if application is not in browser environment", async () => {
            const { window } = global;
            //@ts-ignore
            delete global.window;
            const result = await PlatformAuthProvider.isPlatformBrokerAvailable(
                true,
                {},
                performanceClient,
                "test-correlation-id"
            );
            expect(result).toBe(false);
            global.window = window; // Restore window
        });

        it("should return true if its a browser app and dom handler is available", async () => {
            const domProviderSpy = stubDOMProvider();

            const result = await PlatformAuthProvider.isPlatformBrokerAvailable(
                true,
                undefined,
                performanceClient,
                "test-correlation-id"
            );
            expect(result).toBe(true);
            expect(domProviderSpy).toHaveBeenCalled();
        });

        it("should return true if its a browser app and extension handler is available", async () => {
            const extensionProviderSpy = stubExtensionProvider();

            const result = await PlatformAuthProvider.isPlatformBrokerAvailable(
                false,
                {},
                performanceClient,
                TEST_CONFIG.CORRELATION_ID
            );
            expect(result).toBe(true);
            expect(extensionProviderSpy).toHaveBeenCalled();
        });

        it("should return false if no handler is available", async () => {
            jest.spyOn(
                PlatformAuthDOMHandler,
                "createProvider"
            ).mockImplementation(async () => {
                throw new Error("No handler available");
            });

            jest.spyOn(
                PlatformAuthExtensionHandler,
                "createProvider"
            ).mockImplementation(async () => {
                throw new Error("No handler available");
            });

            const result = await PlatformAuthProvider.isPlatformBrokerAvailable(
                true,
                {},
                performanceClient,
                TEST_CONFIG.CORRELATION_ID
            );
            expect(result).toBe(false);
        });
    });

    describe("getPlatformAuthProvider tests", () => {
        it("should return undefined if no provider is available", async () => {
            jest.spyOn(
                PlatformAuthDOMHandler,
                "createProvider"
            ).mockImplementation(async () => {
                throw new Error("No handler available");
            });

            jest.spyOn(
                PlatformAuthExtensionHandler,
                "createProvider"
            ).mockImplementation(async () => {
                throw new Error("No handler available");
            });

            const result = await PlatformAuthProvider.getPlatformAuthProvider(
                logger,
                performanceClient,
                "test-correlation-id"
            );
            expect(result).toBe(undefined);
        });

        it("returns dom handler when available", async () => {
            const domProviderSpy = stubDOMProvider();
            const events: PerformanceEvent[] = [];
            performanceClient.addPerformanceCallback((emittedEvents) => {
                events.push(...emittedEvents);
            });

            const result = await PlatformAuthProvider.getPlatformAuthProvider(
                logger,
                performanceClient,
                "test-correlation-id",
                undefined,
                true
            );
            expect(result).not.toBe(undefined);
            expect(result).toBeInstanceOf(PlatformAuthDOMHandler);
            expect(domProviderSpy).toHaveBeenCalled();
            expect(
                events.find(
                    (event) =>
                        event.name ===
                        BrowserPerformanceEvents.PlatformAuthProviderDiscovery
                )
            ).toMatchObject({
                correlationId: "test-correlation-id",
                success: true,
                platformAuthDomAttempted: true,
                platformAuthExtensionAttempted: false,
                platformAuthProviderAvailable: true,
                platformAuthProviderType:
                    PlatformAuthConstants.PLATFORM_DOM_PROVIDER,
                platformAuthOutcome: "dom_selected",
            });
        });

        it("returns extension handler if dom APIs are not available and extension is available", async () => {
            const extensionProviderSpy = stubExtensionProvider();
            const events: PerformanceEvent[] = [];
            performanceClient.addPerformanceCallback((emittedEvents) => {
                events.push(...emittedEvents);
            });

            const result = await PlatformAuthProvider.getPlatformAuthProvider(
                logger,
                performanceClient,
                "test-correlation-id"
            );
            expect(result).not.toBe(undefined);
            expect(result).toBeInstanceOf(PlatformAuthExtensionHandler);
            expect(extensionProviderSpy).toHaveBeenCalled();
            expect(
                events.find(
                    (event) =>
                        event.name ===
                        BrowserPerformanceEvents.PlatformAuthProviderDiscovery
                )
            ).toMatchObject({
                correlationId: "test-correlation-id",
                success: true,
                platformAuthDomAttempted: false,
                platformAuthExtensionAttempted: true,
                platformAuthProviderAvailable: true,
                platformAuthProviderType:
                    PlatformAuthConstants.PLATFORM_EXTENSION_PROVIDER,
                platformAuthOutcome: "extension_selected",
            });
        });

        it("falls back to extension handler when DOM provider discovery throws", async () => {
            jest.spyOn(
                PlatformAuthDOMHandler,
                "createProvider"
            ).mockRejectedValue(new Error("DOM API unavailable"));
            const extensionProviderSpy = stubExtensionProvider();
            const events: PerformanceEvent[] = [];
            performanceClient.addPerformanceCallback((emittedEvents) => {
                events.push(...emittedEvents);
            });

            const result = await PlatformAuthProvider.getPlatformAuthProvider(
                logger,
                performanceClient,
                "test-correlation-id",
                undefined,
                true
            );

            expect(result).toBeInstanceOf(PlatformAuthExtensionHandler);
            expect(extensionProviderSpy).toHaveBeenCalled();
            expect(
                events.find(
                    (event) =>
                        event.name ===
                        BrowserPerformanceEvents.PlatformAuthProviderDiscovery
                )
            ).toMatchObject({
                correlationId: "test-correlation-id",
                success: true,
                platformAuthDomAttempted: true,
                platformAuthExtensionAttempted: true,
                platformAuthProviderAvailable: true,
                platformAuthProviderType:
                    PlatformAuthConstants.PLATFORM_EXTENSION_PROVIDER,
                platformAuthOutcome: "extension_selected_after_dom_error",
            });
        });
    });

    describe("isPlatformAuthAllowed", () => {
        let config: BrowserConfiguration;
        beforeEach(() => {
            config = buildConfiguration(
                {
                    auth: {
                        clientId: "test-client-id",
                        authority: "https://login.microsoftonline.com/common",
                        redirectUri: "http://localhost",
                    },
                    system: {
                        allowPlatformBroker: true,
                    },
                },
                true
            );
        });

        it("returns false when config is not set to enable paltform broker", () => {
            config.system.allowPlatformBroker = false;
            const result = PlatformAuthProvider.isPlatformAuthAllowed(
                config,
                logger,
                TEST_CONFIG.CORRELATION_ID,
                new PlatformAuthDOMHandler(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                ),
                Constants.AuthenticationScheme.BEARER
            );
            expect(result).toBe(false);
        });

        it("returns false when platform auth provider is not initialized", () => {
            const result = PlatformAuthProvider.isPlatformAuthAllowed(
                config,
                logger,
                TEST_CONFIG.CORRELATION_ID,
                undefined,
                Constants.AuthenticationScheme.BEARER
            );
            expect(result).toBe(false);
        });
        it("returns false when authentication scheme is not supported", () => {
            const result = PlatformAuthProvider.isPlatformAuthAllowed(
                config,
                logger,
                TEST_CONFIG.CORRELATION_ID,
                new PlatformAuthDOMHandler(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                ),
                "unknown-scheme" as Constants.AuthenticationScheme
            );
            expect(result).toBe(false);
        });

        it("returns false for browser-native DPoP because platform broker DPoP is unsupported", () => {
            const result = PlatformAuthProvider.isPlatformAuthAllowed(
                config,
                logger,
                TEST_CONFIG.CORRELATION_ID,
                new PlatformAuthDOMHandler(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                ),
                Constants.AuthenticationScheme.DPOP
            );
            expect(result).toBe(false);
        });

        it("returns true when platform auth provider is initialized and authentication scheme is supported", () => {
            const addFieldsSpy = jest.spyOn(performanceClient, "addFields");
            const result = PlatformAuthProvider.isPlatformAuthAllowed(
                config,
                logger,
                TEST_CONFIG.CORRELATION_ID,
                new PlatformAuthDOMHandler(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                ),
                Constants.AuthenticationScheme.BEARER,
                performanceClient
            );
            expect(result).toBe(true);
            expect(addFieldsSpy).toHaveBeenCalledWith(
                {
                    allowPlatformBroker: true,
                    platformAuthDomEnabled: false,
                    platformAuthProviderAvailable: true,
                    platformAuthProviderType:
                        PlatformAuthConstants.PLATFORM_DOM_PROVIDER,
                    platformAuthSchemeSupported: true,
                },
                TEST_CONFIG.CORRELATION_ID
            );
        });

        it("throws error when allowPlatformBrokerWithDOM is enabled without allowPlatformBroker", () => {
            config.system.allowPlatformBroker = false;
            config.experimental.allowPlatformBrokerWithDOM = true;
            expect(() => {
                PlatformAuthProvider.isPlatformAuthAllowed(
                    config,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new PlatformAuthDOMHandler(
                        logger,
                        performanceClient,
                        "test-correlation-id"
                    ),
                    Constants.AuthenticationScheme.BEARER
                );
            }).toThrow(
                ClientConfigurationErrorCodes.invalidPlatformBrokerConfiguration
            );
        });

        it("returns true when both allowPlatformBroker and allowPlatformBrokerWithDOM are enabled", () => {
            config.system.allowPlatformBroker = true;
            config.experimental.allowPlatformBrokerWithDOM = true;
            const result = PlatformAuthProvider.isPlatformAuthAllowed(
                config,
                logger,
                TEST_CONFIG.CORRELATION_ID,
                new PlatformAuthDOMHandler(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                ),
                Constants.AuthenticationScheme.BEARER
            );
            expect(result).toBe(true);
        });
    });
});
