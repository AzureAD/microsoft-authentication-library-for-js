/**
 * @jest-environment node
 */
import { TEST_CONFIG } from "../utils/StringConstants";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import { BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError";
import { getPublicClientApplication } from "../utils/PublicClientApplication";

describe("Non-browser environment", () => {

    it("Constructor doesnt throw if window is undefined", async () => {
        await getPublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });
    });

    it("acquireTokenSilent throws", (done) => {
        getPublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        }).then((instance) => {
            instance.acquireTokenSilent({scopes: ["openid"], account: undefined})
                .catch(error => {
                    expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                    done();
                });
        });
    });

    it("ssoSilent throws", (done) => {
        getPublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        }).then((instance) => {
            instance.ssoSilent({})
                .catch(error => {
                    expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                    done();
                });
        });
    });

    it("acquireTokenPopup throws", (done) => {
        getPublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        }).then((instance) => {
            instance.acquireTokenPopup({scopes: ["openid"]}).catch((error) => {
                expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                done();
            });
        });
    });

    it("acquireTokenRedirect throws", (done) => {
        getPublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        }).then((instance) => {
            instance.acquireTokenRedirect({scopes: ["openid"]})
                .catch(error => {
                    expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                    done();
                });
        });
    });

    it("loginPopup throws", (done) => {
        getPublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        }).then((instance) => {
            instance.loginPopup({scopes: ["openid"]})
                .catch(error => {
                    expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                    done();
                });
        });
    });

    it("loginRedirect throws", (done) => {
        getPublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        }).then((instance) => {
            instance.loginRedirect({scopes: ["openid"]})
                .catch(error => {
                    expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                    done();
                });
        });
    });

    it("logoutRedirect throws", (done) => {
        getPublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        }).then((instance) => {
            instance.logoutRedirect()
                .catch(error => {
                    expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                    done();
                });
        });
    });

    it("logoutPopup throws", (done) => {
        getPublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        }).then((instance) => {
            instance.logoutPopup()
                .catch(error => {
                    expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                    done();
                });
        });
    });

    it("getAllAccounts returns empty array", async () => {
        const instance = await getPublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });

        const accounts = instance.getAllAccounts();
        expect(accounts).toEqual([]);
    });

    it("getAccountByUsername returns null", async () => {
        const instance = await getPublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });

        const account = instance.getAccountByUsername("example@test.com");
        expect(account).toEqual(null);
    });

    it("handleRedirectPromise returns null", (done) => {
        getPublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            },
            system: {
                allowNativeBroker: false
            }
        }).then((instance) => {
            instance.handleRedirectPromise().then(result => {
                expect(result).toBeNull();
                done();
            });
        });
    });

    it("addEventCallback does not throw", (done) => {
        getPublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        }).then((instance) => {
            expect(() => instance.addEventCallback(() => {})).not.toThrow();
            done();
        });
    });
});
