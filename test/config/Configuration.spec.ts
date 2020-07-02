import { expect } from "chai";
import { Configuration, buildConfiguration } from "../../src/config/Configuration";
import { TEST_CONFIG, TEST_URIS } from "../utils/StringConstants";
import { LogLevel, Constants } from "@azure/msal-common";
import sinon from "sinon";

/**
 * Defaults for the Configuration Options
 */
const DEFAULT_POPUP_TIMEOUT_MS = 60000;

/**
 * Test values for the Configuration Options
 */
const TEST_POPUP_TIMEOUT_MS = 30000;
const TEST_OFFSET = 100;

describe("Configuration.ts Class Unit Tests", () => {

    const testLoggerCallback = (level: LogLevel, message: string, containsPii: boolean): void => {
        if (containsPii) {
            console.log(`Log level: ${level} Message: ${message}`);
        }
    }

    it("buildConfiguration assigns default values", () => {
        let emptyConfig: Configuration = buildConfiguration({auth: null});
        // Auth config checks
        expect(emptyConfig.auth).to.be.not.null;
        expect(emptyConfig.auth.clientId).to.be.empty;
        expect(emptyConfig.auth.authority).to.be.eq(`${Constants.DEFAULT_AUTHORITY}`);
        expect(emptyConfig.auth.redirectUri).to.be.eq("");
        expect(emptyConfig.auth.postLogoutRedirectUri).to.be.eq("");
        expect(emptyConfig.auth.navigateToLoginRequestUrl).to.be.true;
        // Cache config checks
        expect(emptyConfig.cache).to.be.not.null.and.not.undefined
        expect(emptyConfig.cache.cacheLocation).to.be.not.null.and.not.undefined;
        expect(emptyConfig.cache.cacheLocation).to.be.eq("sessionStorage");
        expect(emptyConfig.cache.storeAuthStateInCookie).to.be.not.null.and.not.undefined;
        expect(emptyConfig.cache.storeAuthStateInCookie).to.be.false;
        // System config checks
        expect(emptyConfig.system).to.be.not.null.and.not.undefined;
        expect(emptyConfig.system.loggerOptions).to.be.not.null.and.not.undefined;
        expect(emptyConfig.system.loggerOptions.loggerCallback).to.be.not.null.and.not.undefined;
        expect(emptyConfig.system.loggerOptions.piiLoggingEnabled).to.be.false;
        expect(emptyConfig.system.networkClient).to.be.not.null.and.not.undefined;
        expect(emptyConfig.system.windowHashTimeout).to.be.not.null.and.not.undefined;
        expect(emptyConfig.system.windowHashTimeout).to.be.eq(DEFAULT_POPUP_TIMEOUT_MS);
        expect(emptyConfig.system.tokenRenewalOffsetSeconds).to.be.eq(300);
        expect(emptyConfig.system.telemetry).to.be.null;
    });

    it("Tests default logger", () => {
        const consoleErrorSpy = sinon.spy(console, "error");
        const consoleInfoSpy = sinon.spy(console, "info");
        const consoleDebugSpy = sinon.spy(console, "debug");
        const consoleWarnSpy = sinon.spy(console, "warn");
        const message = "log message";
        let emptyConfig: Configuration = buildConfiguration({auth: null});
        emptyConfig.system.loggerOptions.loggerCallback(LogLevel.Error, message, true)
        expect(consoleErrorSpy.called).to.be.false;
        emptyConfig.system.loggerOptions.loggerCallback(LogLevel.Error, message, false)
        expect(consoleErrorSpy.calledOnce).to.be.true;
        emptyConfig.system.loggerOptions.loggerCallback(LogLevel.Info, message, false)
        expect(consoleInfoSpy.calledOnce).to.be.true;
        emptyConfig.system.loggerOptions.loggerCallback(LogLevel.Verbose, message, false)
        expect(consoleDebugSpy.calledOnce).to.be.true;
        emptyConfig.system.loggerOptions.loggerCallback(LogLevel.Warning, message, false)
        expect(consoleWarnSpy.calledOnce).to.be.true;
    });

    const testAppName = "MSAL.js App";
    const testAppVersion = "v1.0.0";
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
                cacheLocation: "localStorage",
                storeAuthStateInCookie: true
            },
            system: {
                windowHashTimeout: TEST_POPUP_TIMEOUT_MS,
                tokenRenewalOffsetSeconds: TEST_OFFSET,
                loggerOptions: {
                    loggerCallback: testLoggerCallback,
                    piiLoggingEnabled: true
                },
                telemetry: {
                    applicationName: testAppName,
                    applicationVersion: testAppVersion
                }
            }
        });
        // Auth config checks
        expect(newConfig.auth).to.be.not.null;
        expect(newConfig.auth.clientId).to.be.eq(TEST_CONFIG.MSAL_CLIENT_ID);
        expect(newConfig.auth.authority).to.be.eq(TEST_CONFIG.validAuthority);
        expect(newConfig.auth.redirectUri).to.be.eq(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
        expect(newConfig.auth.postLogoutRedirectUri).to.be.eq(TEST_URIS.TEST_LOGOUT_URI);
        expect(newConfig.auth.navigateToLoginRequestUrl).to.be.false;
        // Cache config checks
        expect(newConfig.cache).to.be.not.null;
        expect(newConfig.cache.cacheLocation).to.be.not.null;
        expect(newConfig.cache.cacheLocation).to.be.eq("localStorage");
        expect(newConfig.cache.storeAuthStateInCookie).to.be.not.null;
        expect(newConfig.cache.storeAuthStateInCookie).to.be.true;
        // System config checks
        expect(newConfig.system).to.be.not.null;
        expect(newConfig.system.windowHashTimeout).to.be.not.null;
        expect(newConfig.system.windowHashTimeout).to.be.eq(TEST_POPUP_TIMEOUT_MS);
        expect(newConfig.system.tokenRenewalOffsetSeconds).to.be.not.null;
        expect(newConfig.system.tokenRenewalOffsetSeconds).to.be.eq(TEST_OFFSET);
        expect(newConfig.system.telemetry).to.be.not.null;
        expect(newConfig.system.telemetry.applicationName).to.be.eq(testAppName);
        expect(newConfig.system.telemetry.applicationVersion).to.be.eq(testAppVersion);
        expect(newConfig.system.loggerOptions).to.be.not.null;
        expect(newConfig.system.loggerOptions.loggerCallback).to.be.not.null;
        expect(newConfig.system.loggerOptions.piiLoggingEnabled).to.be.true;
    });
});
