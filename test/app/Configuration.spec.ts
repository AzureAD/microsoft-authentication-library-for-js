import { expect } from "chai";
import { Configuration, buildConfiguration } from "../../src/app/Configuration";
import { TEST_CONFIG, TEST_URIS } from "../utils/StringConstants";

/**
 * Defaults for the Configuration Options
 */
const FRAME_TIMEOUT = 6000;
const OFFSET = 300;
const NAVIGATE_FRAME_WAIT = 500;

/**
 * Test values for the Configuration Options
 */
const TEST_FRAME_TIMEOUT = 3000;
const TEST_OFFSET = 100;
const TEST_NAVIGATE_FRAME_WAIT = 200;

describe("MsalPublicClientSPAConfiguration.ts Class Unit Tests", () => {

    it("buildConfiguration assigns default values", () => {
        let emptyConfig: Configuration = buildConfiguration({auth: null});
        // Auth config checks
        expect(emptyConfig.auth).to.be.not.null;
        expect(emptyConfig.auth.clientId).to.be.empty;
        expect(emptyConfig.auth.clientSecret).to.be.empty;
        expect(emptyConfig.auth.authority).to.be.null;
        expect(emptyConfig.auth.validateAuthority).to.be.true;
        let redirUriResult: string;
        if (emptyConfig.auth.redirectUri instanceof Function) {
            redirUriResult = emptyConfig.auth.redirectUri();
        } else {
            redirUriResult = emptyConfig.auth.redirectUri;
        }
        let postLogoutRediUriResult: string;
        if (emptyConfig.auth.postLogoutRedirectUri instanceof Function) {
            postLogoutRediUriResult = emptyConfig.auth.postLogoutRedirectUri();
        } else {
            postLogoutRediUriResult = emptyConfig.auth.postLogoutRedirectUri;
        }
        expect(redirUriResult).to.be.eq(TEST_URIS.TEST_REDIR_URI);
        expect(postLogoutRediUriResult).to.be.eq(TEST_URIS.TEST_REDIR_URI);
        expect(emptyConfig.auth.navigateToLoginRequestUrl).to.be.true;
        // Cache config checks
        expect(emptyConfig.cache).to.be.not.null;
        expect(emptyConfig.cache.cacheLocation).to.be.not.null;
        expect(emptyConfig.cache.cacheLocation).to.be.eq("sessionStorage");
        expect(emptyConfig.cache.storeAuthStateInCookie).to.be.not.null;
        expect(emptyConfig.cache.storeAuthStateInCookie).to.be.false;
        // System config checks
        expect(emptyConfig.system).to.be.not.null;
        expect(emptyConfig.system.loadFrameTimeout).to.be.not.null;
        expect(emptyConfig.system.loadFrameTimeout).to.be.eq(FRAME_TIMEOUT);
        expect(emptyConfig.system.tokenRenewalOffsetSeconds).to.be.not.null;
        expect(emptyConfig.system.tokenRenewalOffsetSeconds).to.be.eq(OFFSET);
        expect(emptyConfig.system.navigateFrameWait).to.be.not.null;
        expect(emptyConfig.system.navigateFrameWait).to.be.eq(NAVIGATE_FRAME_WAIT);
        expect(emptyConfig.system.telemetry).to.be.undefined;
        // Framework config checks
        expect(emptyConfig.framework).to.be.not.null;
        expect(emptyConfig.framework.unprotectedResources).to.be.not.null;
        expect(emptyConfig.framework.unprotectedResources).to.be.empty;
        expect(emptyConfig.framework.protectedResourceMap).to.be.not.null;
        expect(emptyConfig.framework.protectedResourceMap).to.be.empty;
    });

    const testAppName = "MSAL.js App";
    const testAppVersion = "v1.0.0";
    const testUnprotectedResources = ["resource1"];
    let testProtectedResourceMap = new Map<string, Array<string>>();
    testProtectedResourceMap.set("testResource1", ["resourceUri1"]);
    it("buildConfiguration correctly assigns new values", () => {
        let newConfig: Configuration = buildConfiguration({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                clientSecret: TEST_CONFIG.MSAL_CLIENT_SECRET,
                authority: TEST_CONFIG.validAuthority,
                validateAuthority: false,
                redirectUri: TEST_URIS.TEST_ALTERNATE_REDIR_URI,
                postLogoutRedirectUri: TEST_URIS.TEST_LOGOUT_URI,
                navigateToLoginRequestUrl: false
            },
            cache: {
                cacheLocation: "localStorage",
                storeAuthStateInCookie: true
            },
            system: {
                loadFrameTimeout: TEST_FRAME_TIMEOUT,
                navigateFrameWait: TEST_NAVIGATE_FRAME_WAIT,
                tokenRenewalOffsetSeconds: TEST_OFFSET,
                telemetry: {
                    applicationName: testAppName,
                    applicationVersion: testAppVersion
                }
            },
            framework: {
                isAngular: true,
                unprotectedResources: testUnprotectedResources,
                protectedResourceMap: testProtectedResourceMap
            }
        });
        // Auth config checks
        expect(newConfig.auth).to.be.not.null;
        expect(newConfig.auth.clientId).to.be.eq(TEST_CONFIG.MSAL_CLIENT_ID);
        expect(newConfig.auth.clientSecret).to.be.eq(TEST_CONFIG.MSAL_CLIENT_SECRET);
        expect(newConfig.auth.authority).to.be.eq(TEST_CONFIG.validAuthority);
        expect(newConfig.auth.validateAuthority).to.be.false;
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
        expect(newConfig.system.loadFrameTimeout).to.be.not.null;
        expect(newConfig.system.loadFrameTimeout).to.be.eq(TEST_FRAME_TIMEOUT);
        expect(newConfig.system.tokenRenewalOffsetSeconds).to.be.not.null;
        expect(newConfig.system.tokenRenewalOffsetSeconds).to.be.eq(TEST_OFFSET);
        expect(newConfig.system.navigateFrameWait).to.be.not.null;
        expect(newConfig.system.navigateFrameWait).to.be.eq(TEST_NAVIGATE_FRAME_WAIT);
        expect(newConfig.system.telemetry).to.be.not.null;
        expect(newConfig.system.telemetry.applicationName).to.be.eq(testAppName);
        expect(newConfig.system.telemetry.applicationVersion).to.be.eq(testAppVersion);
        // Framework config checks
        expect(newConfig.framework).to.be.not.null;
        expect(newConfig.framework.isAngular).to.be.not.null;
        expect(newConfig.framework.isAngular).to.be.true;
        expect(newConfig.framework.unprotectedResources).to.be.not.null;
        expect(newConfig.framework.unprotectedResources).to.be.eq(testUnprotectedResources);
        expect(newConfig.framework.protectedResourceMap).to.be.not.null;
        expect(newConfig.framework.protectedResourceMap).to.be.eq(testProtectedResourceMap);
    });
});