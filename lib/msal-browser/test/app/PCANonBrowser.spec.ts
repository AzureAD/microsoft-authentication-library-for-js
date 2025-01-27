/**
 * @jest-environment node
 */
import { TEST_CONFIG } from "../utils/StringConstants";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import { BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError";
import { AccountInfo, AuthenticationScheme, Logger } from "@azure/msal-common";
import {
    ID_TOKEN_CLAIMS,
    RANDOM_TEST_GUID,
    TEST_DATA_CLIENT_INFO,
    TEST_TOKENS,
} from "../utils/StringConstants.js";
import {
    CacheLookupPolicy,
    WrapperSKU,
} from "../../src/utils/BrowserConstants.js";
import { NavigationClient } from "../../src/navigation/NavigationClient.js";
import { SilentRequest } from "../../src/request/SilentRequest.js";
import { AuthenticationResult } from "../../src/response/AuthenticationResult.js";

/**
 * Tests for PublicClientApplication.ts when run in a non-browser environment
 *
 * Non-browser environments include server side rendering used in frameworks such as NextJS and Angular
 *
 * https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering
 * https://angular.io/guide/universal
 *
 * Expectation is that developer has to invoke initialize server side....
 */

describe("Non-browser environment", () => {
    it("Constructor doesnt throw if window is undefined", () => {
        new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });
    });

    it("initialize doesn't throw", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });
        await instance.initialize();
    });

    it("acquireTokenPopup throws", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        try {
            await instance.acquireTokenPopup({ scopes: ["openid"] });
        } catch (error: any) {
            expect(error.errorCode).toEqual(
                BrowserAuthErrorMessage.notInBrowserEnvironment.code
            );
        }
    });

    it("acquireTokenRedirect throws", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        try {
            await instance.acquireTokenRedirect({ scopes: ["openid"] });
        } catch (error: any) {
            expect(error.errorCode).toEqual(
                BrowserAuthErrorMessage.notInBrowserEnvironment.code
            );
        }
    });

    it("acquireTokenSilent throws", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        try {
            await instance.acquireTokenSilent({
                scopes: ["openid"],
                account: undefined,
            });
        } catch (error: any) {
            expect(error.errorCode).toEqual(
                BrowserAuthErrorMessage.notInBrowserEnvironment.code
            );
        }
    });

    it("acquireTokenByCode throws", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        try {
            await instance.acquireTokenByCode({
                scopes: ["openid"],
                code: "auth-code",
            });
        } catch (error: any) {
            expect(error.errorCode).toEqual(
                BrowserAuthErrorMessage.notInBrowserEnvironment.code
            );
        }
    });

    it("addEventCallback does not throw", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        expect(() => instance.addEventCallback(() => {})).not.toThrow();
    });

    it("removeEventCallback does not throw", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        instance.removeEventCallback("");
    });

    it("addPerformanceCallback throws", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        try {
            instance.addPerformanceCallback(() => {});
        } catch (error: any) {
            expect(error.errorCode).toEqual(
                BrowserAuthErrorMessage.notInBrowserEnvironment.code
            );
        }
    });

    it("removePerformanceCallback does not throw", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        instance.removePerformanceCallback("");
    });

    it("enableAccountStorageEvents does not throw", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        instance.enableAccountStorageEvents();
    });

    it("disableAccountStorageEvents does not throw", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        instance.disableAccountStorageEvents();
    });

    it("getAccount returns null", async () => {
        const testAccount: AccountInfo = {
            homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
            localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
            environment: "login.windows.net",
            tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
            username: "AbeLi@microsoft.com",
        };

        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });
        await instance.initialize();
        const account = instance.getAccount(testAccount);
        expect(account).toEqual(null);
    });

    it("getAccountByHomeId returns null", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });
        await instance.initialize();
        const account = instance.getAccountByHomeId(
            TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
        );
        expect(account).toEqual(null);
    });

    it("getAccountByLocalId returns null", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });
        await instance.initialize();
        const account = instance.getAccountByLocalId(
            TEST_DATA_CLIENT_INFO.TEST_UID
        );
        expect(account).toEqual(null);
    });

    it("getAccountByUsername returns null", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });
        await instance.initialize();
        const account = instance.getAccountByUsername("example@test.com");
        expect(account).toEqual(null);
    });

    it("getAllAccounts returns empty array", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });
        await instance.initialize();
        const accounts = instance.getAllAccounts();
        expect(accounts).toEqual([]);
    });

    it("handleRedirectPromise returns null", (done) => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
            system: {
                allowPlatformBroker: false,
            },
        });
        instance.initialize().then(() => {
            instance.handleRedirectPromise().then((result: any) => {
                expect(result).toBeNull();
                done();
            });
        });
    });

    it("loginPopup throws", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        try {
            await instance.loginPopup({ scopes: ["openid"] });
        } catch (error: any) {
            expect(error.errorCode).toEqual(
                BrowserAuthErrorMessage.notInBrowserEnvironment.code
            );
        }
    });

    it("loginRedirect throws", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        try {
            await instance.loginRedirect({ scopes: ["openid"] });
        } catch (error: any) {
            expect(error.errorCode).toEqual(
                BrowserAuthErrorMessage.notInBrowserEnvironment.code
            );
        }
    });

    it("logout throws", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        try {
            await instance.logout();
        } catch (error: any) {
            expect(error.errorCode).toEqual(
                BrowserAuthErrorMessage.notInBrowserEnvironment.code
            );
        }
    });

    it("logoutRedirect throws", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        try {
            await instance.logoutRedirect();
        } catch (error: any) {
            expect(error.errorCode).toEqual(
                BrowserAuthErrorMessage.notInBrowserEnvironment.code
            );
        }
    });

    it("logoutPopup throws", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });
        await instance.initialize();
        try {
            await instance.logoutPopup();
        } catch (error: any) {
            expect(error.errorCode).toEqual(
                BrowserAuthErrorMessage.notInBrowserEnvironment.code
            );
        }
    });

    it("ssoSilent throws", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        try {
            await instance.ssoSilent({});
        } catch (error: any) {
            expect(error.errorCode).toEqual(
                BrowserAuthErrorMessage.notInBrowserEnvironment.code
            );
        }
    });

    it("getTokenCache returns an ITokenCache", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        const tokenCache = instance.getTokenCache();
        expect(typeof tokenCache.loadExternalTokens).toBe("function");
    });

    it("getLogger should not throw", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        await instance.getLogger();
    });

    it("setLogger should not throw", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();

        const logger = new Logger({});
        instance.setLogger(logger);
    });

    it("setActiveAccount should not throw", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        instance.setActiveAccount(null);
    });

    it("getActiveAccount should return null", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        const account = instance.getActiveAccount();
        expect(account).toBeNull();
    });

    it("initializeWrapperLibrary should not throw", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        instance.initializeWrapperLibrary(WrapperSKU.React, "1.0.0");
    });

    it("setNavigationClient should not throw", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        const navigationClient = new NavigationClient();
        instance.setNavigationClient(navigationClient);
    });

    it("hydrateCache should not throw", async () => {
        const testAccount: AccountInfo = {
            homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
            localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
            environment: "login.windows.net",
            tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
            username: "AbeLi@microsoft.com",
        };
        const testAuthenticationResult: AuthenticationResult = {
            authority: TEST_CONFIG.validAuthority,
            uniqueId: testAccount.localAccountId,
            tenantId: testAccount.tenantId,
            scopes: TEST_CONFIG.DEFAULT_SCOPES,
            idToken: TEST_TOKENS.IDTOKEN_V2,
            idTokenClaims: ID_TOKEN_CLAIMS,
            accessToken: TEST_TOKENS.ACCESS_TOKEN,
            fromCache: false,
            correlationId: RANDOM_TEST_GUID,
            expiresOn: new Date(Date.now() + 3600000),
            account: testAccount,
            tokenType: AuthenticationScheme.BEARER,
        };
        const request: SilentRequest = {
            scopes: ["openid", "profile"],
            account: testAccount,
            cacheLookupPolicy: CacheLookupPolicy.AccessToken,
        };

        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        instance.hydrateCache(testAuthenticationResult, request);
    });

    it("clearCache should not throw", async () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await instance.initialize();
        instance.clearCache();
    });
});
