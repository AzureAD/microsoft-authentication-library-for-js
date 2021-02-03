/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { stubbedPublicClientApplication } from "../../src/app/IPublicClientApplication";
import { BrowserConfigurationAuthErrorMessage } from "../../src/error/BrowserConfigurationAuthError";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("IPublicClientApplication.ts Class Unit Tests", () => {
    describe("stubbedPublicClientApplication tests", () => {
        it("acquireTokenPopup throws", (done) => {
            stubbedPublicClientApplication.acquireTokenPopup({scopes: ["openid"]}).catch(e => {
                expect(e.errorCode).to.eq(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).to.eq(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
                done();
            });
        });

        it("acquireTokenRedirect throws", (done) => {
            stubbedPublicClientApplication.acquireTokenRedirect({scopes: ["openid"]}).catch(e => {
                expect(e.errorCode).to.eq(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).to.eq(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
                done();
            });
        });

        it("acquireTokenSilent throws", (done) => {
            stubbedPublicClientApplication.acquireTokenSilent({scopes: ["openid"]}).catch(e => {
                expect(e.errorCode).to.eq(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).to.eq(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
                done();
            });
        });
        it("handleRedirectPromise throws", (done) => {
            stubbedPublicClientApplication.handleRedirectPromise().catch(e => {
                expect(e.errorCode).to.eq(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).to.eq(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
                done();
            });
        });

        it("loginPopup throws", (done) => {
            stubbedPublicClientApplication.loginPopup().catch(e => {
                expect(e.errorCode).to.eq(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).to.eq(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
                done();
            });
        });

        it("loginRedirect throws", (done) => {
            stubbedPublicClientApplication.loginRedirect().catch(e => {
                expect(e.errorCode).to.eq(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).to.eq(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
                done();
            });
        });

        it("logout throws", (done) => {
            stubbedPublicClientApplication.logout().catch(e => {
                expect(e.errorCode).to.eq(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).to.eq(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
                done();
            });
        });

        it("ssoSilent throws", (done) => {
            stubbedPublicClientApplication.ssoSilent({}).catch(e => {
                expect(e.errorCode).to.eq(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).to.eq(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
                done();
            });
        });

        it("getLogger throws", () => {
            try {
                stubbedPublicClientApplication.getLogger();
            } catch (e) {
                expect(e.errorCode).to.eq(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.code);
                expect(e.errorMessage).to.eq(BrowserConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
            };
        });
    });
});
