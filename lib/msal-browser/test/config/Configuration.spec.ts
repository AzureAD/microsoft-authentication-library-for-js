import { Configuration, buildConfiguration, DEFAULT_POPUP_TIMEOUT_MS, DEFAULT_IFRAME_TIMEOUT_MS } from "../../src/config/Configuration";
import { TEST_CONFIG, TEST_URIS } from "../utils/StringConstants";
import { LogLevel, Constants, ClientConfigurationError, ClientConfigurationErrorMessage, AzureCloudInstance } from "@azure/msal-common";
import sinon from "sinon";
import { BrowserCacheLocation } from "../../src/utils/BrowserConstants";

/**
 * Test values for the Configuration Options
 */
const TEST_POPUP_TIMEOUT_MS = 30000;
const TEST_OFFSET = 100;

describe("Configuration.ts Class Unit Tests", () => {

    const testLoggerCallback = (level: LogLevel, message: string, containsPii: boolean): void => {}

    it("buildConfiguration assigns default values", () => {
        // @ts-ignore
        let emptyConfig: Configuration = buildConfiguration({auth: null}, true);
        // Auth config checks
        expect(emptyConfig.auth).not.toBeNull();
        expect(emptyConfig.auth.clientId).toHaveLength(0);
        expect(emptyConfig.auth.authority).toBe(`${Constants.DEFAULT_AUTHORITY}`);
        expect(emptyConfig.auth.redirectUri).toBe("");
        expect(emptyConfig.auth.postLogoutRedirectUri).toBe("");
        expect(emptyConfig.auth.navigateToLoginRequestUrl).toBe(true);
        expect(emptyConfig.auth?.azureCloudOptions?.azureCloudInstance).toBe(AzureCloudInstance.None);
        expect(emptyConfig.auth?.azureCloudOptions?.tenant).toBe("");
        // Cache config checks
        expect(emptyConfig.cache).toBeDefined()
        expect(emptyConfig.cache?.cacheLocation).toBeDefined();
        expect(emptyConfig.cache?.cacheLocation).toBe("sessionStorage");
        expect(emptyConfig.cache?.storeAuthStateInCookie).toBeDefined();
        expect(emptyConfig.cache?.storeAuthStateInCookie).toBe(false);
        expect(emptyConfig.cache?.secureCookies).toBe(false);
        // System config checks
        expect(emptyConfig.system).toBeDefined();
        expect(emptyConfig.system?.loggerOptions).toBeDefined();
        expect(emptyConfig.system?.loggerOptions?.loggerCallback).toBeDefined();
        expect(emptyConfig.system?.loggerOptions?.piiLoggingEnabled).toBe(false);
        expect(emptyConfig.system?.networkClient).toBeDefined();
        expect(emptyConfig.system?.windowHashTimeout).toBeDefined();
        expect(emptyConfig.system?.windowHashTimeout).toBe(DEFAULT_POPUP_TIMEOUT_MS);
        expect(emptyConfig.system?.iframeHashTimeout).toBeDefined();
        expect(emptyConfig.system?.iframeHashTimeout).toBe(DEFAULT_IFRAME_TIMEOUT_MS);
        expect(emptyConfig.system?.navigateFrameWait).toBe(0);
        expect(emptyConfig.system?.tokenRenewalOffsetSeconds).toBe(300);
        expect(emptyConfig.system?.asyncPopups).toBe(false);
    });

    it("sets timeouts with loadFrameTimeout", () => {
        const config: Configuration = buildConfiguration({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            },
            system: {
                navigateFrameWait: 1,
                loadFrameTimeout: 100
            }
        }, true);

        expect(config.system?.iframeHashTimeout).toBe(100);
        expect(config.system?.windowHashTimeout).toBe(100);
        expect(config.system?.navigateFrameWait).toBe(1);
    });

    it("sets timeouts with hash timeouts", () => {
        const config: Configuration = buildConfiguration({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            },
            system: {
                iframeHashTimeout: 5000,
                windowHashTimeout: 50000
            }
        }, true);

        expect(config.system?.iframeHashTimeout).toBe(5000);
        expect(config.system?.windowHashTimeout).toBe(50000);
    });

    it("sets timeouts with loadFrameTimeout and hash timeouts", () => {
        const config: Configuration = buildConfiguration({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            },
            system: {
                navigateFrameWait: 1,
                iframeHashTimeout: 6001,
                windowHashTimeout: 6002,
                loadFrameTimeout: 500
            }
        }, true);

        expect(config.system?.iframeHashTimeout).toBe(6001);
        expect(config.system?.windowHashTimeout).toBe(6002);
        expect(config.system?.loadFrameTimeout).toBe(500);
        expect(config.system?.navigateFrameWait).toBe(1);
    });

    it("Tests logger", () => {
        const consoleErrorSpy = sinon.stub(console, "error");
        const consoleInfoSpy = sinon.stub(console, "info");
        const consoleDebugSpy = sinon.stub(console, "debug");
        const consoleWarnSpy = sinon.stub(console, "warn");
        const message = "log message";
        let emptyConfig: Configuration = buildConfiguration({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            },
            system: {
                loggerOptions: {
                    loggerCallback: (level, message, containsPii) => {
                        if (containsPii) {
                            return;
                        }
                        switch (level) {
                            case LogLevel.Error:
                                console.error(message);
                                return;
                            case LogLevel.Info:
                                console.info(message);
                                return;
                            case LogLevel.Verbose:
                                console.debug(message);
                                return;
                            case LogLevel.Warning:
                                console.warn(message);
                                return;
                        }
                    }
                }
            }
        }, true);
        if (!emptyConfig || !emptyConfig.system || !emptyConfig.system.loggerOptions || !emptyConfig.system.loggerOptions.loggerCallback) {
            throw "config not setup correctly";
        }
        emptyConfig.system.loggerOptions.loggerCallback(LogLevel.Error, message, true)
        expect(consoleErrorSpy.called).toBe(false);
        emptyConfig.system.loggerOptions.loggerCallback(LogLevel.Error, message, false)
        expect(consoleErrorSpy.calledOnce).toBe(true);
        emptyConfig.system.loggerOptions.loggerCallback(LogLevel.Info, message, false)
        expect(consoleInfoSpy.calledOnce).toBe(true);
        emptyConfig.system.loggerOptions.loggerCallback(LogLevel.Verbose, message, false)
        expect(consoleDebugSpy.calledOnce).toBe(true);
        emptyConfig.system.loggerOptions.loggerCallback(LogLevel.Warning, message, false)
        expect(consoleWarnSpy.calledOnce).toBe(true);
    });

    let testProtectedResourceMap = new Map<string, Array<string>>();
    testProtectedResourceMap.set("testResource1", ["resourceUri1"]);
    it("buildConfiguration correctly assigns new values", () => {
        let newConfig: Configuration = buildConfiguration({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: TEST_CONFIG.validAuthority,
                redirectUri: TEST_URIS.TEST_ALTERNATE_REDIR_URI,
                postLogoutRedirectUri: TEST_URIS.TEST_LOGOUT_URI,
                navigateToLoginRequestUrl: false
            },
            cache: {
                cacheLocation: BrowserCacheLocation.LocalStorage,
                storeAuthStateInCookie: true,
                secureCookies: true
            },
            system: {
                windowHashTimeout: TEST_POPUP_TIMEOUT_MS,
                tokenRenewalOffsetSeconds: TEST_OFFSET,
                loggerOptions: {
                    loggerCallback: testLoggerCallback,
                    piiLoggingEnabled: true
                },
                asyncPopups: true
            }
        }, true);
        // Auth config checks
        expect(newConfig.auth).not.toBeNull();
        expect(newConfig.auth.clientId).toBe(TEST_CONFIG.MSAL_CLIENT_ID);
        expect(newConfig.auth.authority).toBe(TEST_CONFIG.validAuthority);
        expect(newConfig.auth.redirectUri).toBe(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
        expect(newConfig.auth.postLogoutRedirectUri).toBe(TEST_URIS.TEST_LOGOUT_URI);
        expect(newConfig.auth.navigateToLoginRequestUrl).toBe(false);
        // Cache config checks
        expect(newConfig.cache).not.toBeNull();
        expect(newConfig.cache?.cacheLocation).not.toBeNull();
        expect(newConfig.cache?.cacheLocation).toBe("localStorage");
        expect(newConfig.cache?.storeAuthStateInCookie).not.toBeNull();
        expect(newConfig.cache?.storeAuthStateInCookie).toBe(true);
        expect(newConfig.cache?.secureCookies).toBe(true);
        // System config checks
        expect(newConfig.system).not.toBeNull();
        expect(newConfig.system?.windowHashTimeout).not.toBeNull();
        expect(newConfig.system?.windowHashTimeout).toBe(TEST_POPUP_TIMEOUT_MS);
        expect(newConfig.system?.tokenRenewalOffsetSeconds).not.toBeNull();
        expect(newConfig.system?.tokenRenewalOffsetSeconds).toBe(TEST_OFFSET);
        expect(newConfig.system?.navigateFrameWait).toBe(0);
        expect(newConfig.system?.loggerOptions).not.toBeNull();
        expect(newConfig.system?.loggerOptions?.loggerCallback).not.toBeNull();
        expect(newConfig.system?.loggerOptions?.piiLoggingEnabled).toBe(true);
        expect(newConfig.system?.asyncPopups).toBe(true);
    });
});
