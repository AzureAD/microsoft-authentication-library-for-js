/**
 * @jest-environment node
 */
import { TEST_CONFIG } from "../utils/StringConstants";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import { BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError";

describe("Non-browser environment", () => {

    it("Constructor doesnt throw if window is undefined", () => {
        new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });
    });

    it("acquireTokenSilent throws", (done) => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });

        instance.acquireTokenSilent({scopes: ["openid"], account: undefined})
            .catch(error => {
                expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                done();
            });
    });

    it("ssoSilent throws", (done) => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });

        instance.ssoSilent({})
            .catch(error => {
                expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                done();
            });
    });

    it("acquireTokenPopup throws", (done) => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });

        instance.acquireTokenPopup({scopes: ["openid"]}).catch((error) => {
            expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
            done();
        });
    });

    it("acquireTokenRedirect throws", (done) => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });

        instance.acquireTokenRedirect({scopes: ["openid"]})
            .catch(error => {
                expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                done();
            });
    });

    it("loginPopup throws", (done) => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });

        instance.loginPopup({scopes: ["openid"]})
            .catch(error => {
                expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                done();
            });
    });

    it("loginRedirect throws", (done) => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });

        instance.loginRedirect({scopes: ["openid"]})
            .catch(error => {
                expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                done();
            });
    });

    it("logoutRedirect throws", (done) => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });

        instance.logoutRedirect()
            .catch(error => {
                expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                done();
            });
    });

    it("logoutPopup throws", (done) => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });

        instance.logoutPopup()
            .catch(error => {
                expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                done();
            });
    });

    it("getAllAccounts returns empty array", () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });

        const accounts = instance.getAllAccounts();
        expect(accounts).toEqual([]);
    });

    it("getAccountByUsername returns null", () => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });

        const account = instance.getAccountByUsername("example@test.com");
        expect(account).toEqual(null);
    });

    it("handleRedirectPromise returns null", (done) => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });

        instance.handleRedirectPromise().then(result => {
            expect(result).toBeNull();
            done();
        });
    });

    it("addEventCallback does not throw", (done) => {
        const instance = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });

        expect(() => instance.addEventCallback(() => {})).not.toThrow();
        done();
    });
});
