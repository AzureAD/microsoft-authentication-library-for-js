import {
    Logger,
    IPerformanceClient,
    Constants,
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
import exp from "constants";
import { log } from "console";
import { BrowserAuthError } from "../../src/index.js";

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
                {},
                performanceClient,
                "test-correlation-id"
            );
            expect(result).toBe(false);
            global.window = window; // Restore window
        });

        it("should return true if its a browser app and dom handler is available", async () => {
            window.sessionStorage.setItem(
                "msal.browser.platform.auth.dom",
                "true"
            );
            const getItemSpy = jest.spyOn(
                Object.getPrototypeOf(sessionStorage),
                "getItem"
            );

            const domProviderSpy = stubDOMProvider();

            const result =
                await PlatformAuthProvider.isPlatformBrokerAvailable();
            expect(result).toBe(true);
            expect(getItemSpy).toHaveBeenCalled();
            expect(domProviderSpy).toHaveBeenCalled();
        });

        it("should return true if its a browser app and extension handler is available", async () => {
            const extensionProviderSpy = stubExtensionProvider();

            const result =
                await PlatformAuthProvider.isPlatformBrokerAvailable();
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

            const result =
                await PlatformAuthProvider.isPlatformBrokerAvailable();
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
            window.sessionStorage.setItem(
                "msal.browser.platform.auth.dom",
                "true"
            );
            const getItemSpy = jest.spyOn(
                Object.getPrototypeOf(sessionStorage),
                "getItem"
            );

            const domProviderSpy = stubDOMProvider();

            const result = await PlatformAuthProvider.getPlatformAuthProvider(
                logger,
                performanceClient,
                "test-correlation-id"
            );
            expect(result).not.toBe(undefined);
            expect(result).toBeInstanceOf(PlatformAuthDOMHandler);
            expect(getItemSpy).toHaveBeenCalled();
            expect(domProviderSpy).toHaveBeenCalled();
        });

        it("returns extension handler if dom APIs are not available and extension is available", async () => {
            const extensionProviderSpy = stubExtensionProvider();

            const result = await PlatformAuthProvider.getPlatformAuthProvider(
                logger,
                performanceClient,
                "test-correlation-id"
            );
            expect(result).not.toBe(undefined);
            expect(result).toBeInstanceOf(PlatformAuthExtensionHandler);
            expect(extensionProviderSpy).toHaveBeenCalled();
        });
    });

    describe("isDomEnabledForPlatformAuth tests", () => {
        it("should return false if session storage is not set with DOM API flag", () => {
            expect(PlatformAuthProvider.isDomEnabledForPlatformAuth()).toBe(
                false
            );
        });

        it("should return true if session storage is set with DOM API flag", () => {
            window.sessionStorage.setItem(
                "msal.browser.platform.auth.dom",
                "true"
            );
            expect(PlatformAuthProvider.isDomEnabledForPlatformAuth()).toBe(
                true
            );
        });

        it("should return false if session storage errors out", () => {
            const { sessionStorage } = global.window;
            //@ts-ignore
            delete global.window.sessionStorage;
            const result = PlatformAuthProvider.isDomEnabledForPlatformAuth();
            expect(result).toBe(false);
            global.window.sessionStorage = sessionStorage; // Restore sessionStorage
        });
    });

    describe("isBrokerAvailable", () => {
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
            const result = PlatformAuthProvider.isBrokerAvailable(
                config,
                logger,
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
            const result = PlatformAuthProvider.isBrokerAvailable(
                config,
                logger,
                undefined,
                Constants.AuthenticationScheme.BEARER
            );
            expect(result).toBe(false);
        });
        it("returns false when authentication scheme is not supported", () => {
            const result = PlatformAuthProvider.isBrokerAvailable(
                config,
                logger,
                new PlatformAuthDOMHandler(
                    logger,
                    performanceClient,
                    "test-correlation-id"
                ),
                "unknown-scheme" as Constants.AuthenticationScheme
            );
            expect(result).toBe(false);
        });

        it("returns true when platform auth provider is initialized and authentication scheme is supported", () => {
            const result = PlatformAuthProvider.isBrokerAvailable(
                config,
                logger,
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
