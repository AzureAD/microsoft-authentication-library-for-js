/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { stubbedPublicClientApplication } from "../../src/app/IPublicClientApplication";
import { BrowserConfigurationAuthErrorMessage } from "../../src/error/BrowserConfigurationAuthError";

describe("IPublicClientApplication.ts Class Unit Tests", () => {
    describe("stubbedPublicClientApplication tests", () => {
        it("acquireTokenPopup throws", (done) => {
            stubbedPublicClientApplication.acquireTokenPopup({scopes: ["openid"]}).catch(e => {
                expect(e.errorCode).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
                done();
            });
        });

        it("acquireTokenRedirect throws", (done) => {
            stubbedPublicClientApplication.acquireTokenRedirect({scopes: ["openid"]}).catch(e => {
                expect(e.errorCode).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
                done();
            });
        });

        it("acquireTokenSilent throws", (done) => {
            stubbedPublicClientApplication.acquireTokenSilent({scopes: ["openid"]}).catch(e => {
                expect(e.errorCode).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
                done();
            });
        });
        it("handleRedirectPromise throws", (done) => {
            stubbedPublicClientApplication.handleRedirectPromise().catch(e => {
                expect(e.errorCode).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
                done();
            });
        });

        it("loginPopup throws", (done) => {
            stubbedPublicClientApplication.loginPopup().catch(e => {
                expect(e.errorCode).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
                done();
            });
        });

        it("loginRedirect throws", (done) => {
            stubbedPublicClientApplication.loginRedirect().catch(e => {
                expect(e.errorCode).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
                done();
            });
        });

        it("logout throws", (done) => {
            stubbedPublicClientApplication.logout().catch(e => {
                expect(e.errorCode).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
                done();
            });
        });

        it("logoutRedirect throws", (done) => {
            stubbedPublicClientApplication.logoutRedirect().catch(e => {
                expect(e.errorCode).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
                done();
            });
        });

        it("logoutPopup throws", (done) => {
            stubbedPublicClientApplication.logoutPopup().catch(e => {
                expect(e.errorCode).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
                done();
            });
        });

        it("ssoSilent throws", (done) => {
            stubbedPublicClientApplication.ssoSilent({}).catch(e => {
                expect(e.errorCode).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
                done();
            });
        });

        it("getTokenCache throws", () => {
            try {
                stubbedPublicClientApplication.getTokenCache();
            } catch (e) {
                expect(e.errorCode).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
            };
        });

        it("getLogger throws", () => {
            try {
                stubbedPublicClientApplication.getLogger();
            } catch (e) {
                expect(e.errorCode).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).toEqual(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
            };
        });
    });
});
