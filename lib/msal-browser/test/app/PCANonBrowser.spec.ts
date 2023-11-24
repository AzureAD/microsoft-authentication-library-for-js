/**
 * @jest-environment node
 */
import { TEST_CONFIG } from "../utils/StringConstants";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import { BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError";

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

    it("handleRedirectPromise returns null", (done) => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
            system: {
                allowNativeBroker: false,
            },
        });
        instance.initialize().then(() => {
            instance.handleRedirectPromise().then((result) => {
                expect(result).toBeNull();
                done();
            });
        });
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
});
