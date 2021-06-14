/**
 * @jest-environment node
 */
import { TEST_CONFIG } from "../utils/StringConstants";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import { BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError";
import { InteractionType } from "../../src/utils/BrowserConstants";
import { EmbeddedClientApplication } from "../../src/broker/client/EmbeddedClientApplication";
import { BrokerClientApplication } from "../../src/broker/client/BrokerClientApplication";
import sinon from "sinon";

describe("Non-browser environment", () => {

    describe("PublicClientApplication", () => {
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

    describe("ExperimentalClientApplication", () => {
        it("Constructor doesnt throw if window is undefined", () => {
            new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                experimental: {
                    enable: true
                }
            });
        });

        it("returns early if in non-browser environment", async () => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                experimental: {
                    enable: true,
                    brokerOptions: {
                        preferredInteractionType: InteractionType.Redirect,
                        actAsBroker: true
                    }
                }
            });
            const initHandshakeSpy = sinon.spy(EmbeddedClientApplication.prototype, "initiateHandshake");
            const listenMsgSpy = sinon.spy(BrokerClientApplication.prototype, "listenForBrokerMessage");
            await instance.experimental?.initializeBrokering();
            expect(initHandshakeSpy.called).toBeFalsy();
            expect(listenMsgSpy.calledOnce).toBeFalsy();
        });


        it("acquireTokenSilent throws", (done) => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                experimental: {
                    enable: true
                }
            });
            instance.experimental?.acquireTokenSilent({scopes: ["openid"], account: undefined})
                .catch(error => {
                    expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                    done();
                });
        });

        it("ssoSilent throws", (done) => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                experimental: {
                    enable: true
                }
            });
            instance.experimental?.ssoSilent({})
                .catch(error => {
                    expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                    done();
                });
        });

        it("acquireTokenPopup throws", (done) => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                experimental: {
                    enable: true
                }
            });
            instance.experimental?.acquireTokenPopup({scopes: ["openid"]}).catch((error) => {
                expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                done();
            });
        });

        it("acquireTokenRedirect throws", (done) => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                experimental: {
                    enable: true
                }
            });
            instance.experimental?.acquireTokenRedirect({scopes: ["openid"]})
                .catch(error => {
                    expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                    done();
                });
        });

        it("loginPopup throws", (done) => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                experimental: {
                    enable: true
                }
            });
            instance.experimental?.loginPopup({scopes: ["openid"]})
                .catch(error => {
                    expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                    done();
                });
        });

        it("loginRedirect throws", (done) => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                experimental: {
                    enable: true
                }
            });
            instance.experimental?.loginRedirect({scopes: ["openid"]})
                .catch(error => {
                    expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                    done();
                });
        });

        it("logout throws", (done) => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                experimental: {
                    enable: true
                }
            });
            instance.experimental?.logout()
                .catch(error => {
                    expect(error.errorCode).toEqual(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                    done();
                });
        });

        it("getAllAccounts returns empty array", () => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                experimental: {
                    enable: true
                }
            });
            const accounts = instance.experimental?.getAllAccounts();
            expect(accounts).toStrictEqual([]);
        });

        it("getAccountByUsername returns null", () => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                experimental: {
                    enable: true
                }
            });
            const account = instance.experimental?.getAccountByUsername("example@test.com");
            expect(account).toEqual(null);
        });

        it("handleRedirectPromise returns null", (done) => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                experimental: {
                    enable: true
                }
            });
            instance.experimental?.handleRedirectPromise().then(result => {
                expect(result).toBeNull();
                done();
            });
        });

        it("addEventCallback does not throw", (done) => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                experimental: {
                    enable: true
                }
            });
            expect(() => instance.experimental?.addEventCallback(() => {})).not.toThrow();
            done();
        });
    })
});
