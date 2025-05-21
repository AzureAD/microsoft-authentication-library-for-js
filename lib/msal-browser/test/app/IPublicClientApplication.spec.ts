/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { stubbedPublicClientApplication } from "../../src/app/IPublicClientApplication";
import { BrowserAuthError, getDefaultErrorMessage } from "../../src/error/BrowserAuthError.js";
import { BrowserConfigurationAuthErrorCodes } from "../../src/error/BrowserConfigurationAuthError.js";

describe("IPublicClientApplication.ts Class Unit Tests", () => {
    describe("stubbedPublicClientApplication tests", () => {
        it("acquireTokenPopup throws", (done) => {
            stubbedPublicClientApplication
                .acquireTokenPopup({ scopes: ["openid"] })
                .catch((e) => {
                    expect(e.errorCode).toEqual(
                        BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                    );
                    expect(e.errorMessage).toEqual(
                        getDefaultErrorMessage(
                            BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                        )
                    );
                    done();
                });
        });

        it("acquireTokenRedirect throws", (done) => {
            stubbedPublicClientApplication
                .acquireTokenRedirect({ scopes: ["openid"] })
                .catch((e) => {
                    expect(e.errorCode).toEqual(
                        BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                    );
                    expect(e.errorMessage).toEqual(
                        getDefaultErrorMessage(
                            BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                        )
                    );
                    done();
                });
        });

        it("acquireTokenSilent throws", (done) => {
            stubbedPublicClientApplication
                .acquireTokenSilent({ scopes: ["openid"] })
                .catch((e) => {
                    expect(e.errorCode).toEqual(
                        BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                    );
                    expect(e.errorMessage).toEqual(
                        getDefaultErrorMessage(
                            BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                        )
                    );
                    done();
                });
        });
        it("handleRedirectPromise throws", (done) => {
            stubbedPublicClientApplication
                .handleRedirectPromise()
                .catch((e) => {
                    expect(e.errorCode).toEqual(
                        BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                    );
                    expect(e.errorMessage).toEqual(
                        getDefaultErrorMessage(
                            BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                        )
                    );
                    done();
                });
        });

        it("loginPopup throws", (done) => {
            stubbedPublicClientApplication.loginPopup().catch((e) => {
                expect(e.errorCode).toEqual(
                    BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                );
                expect(e.errorMessage).toEqual(
                    getDefaultErrorMessage(
                        BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                    )
                );
                done();
            });
        });

        it("loginRedirect throws", (done) => {
            stubbedPublicClientApplication.loginRedirect().catch((e) => {
                expect(e.errorCode).toEqual(
                    BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                );
                expect(e.errorMessage).toEqual(
                    getDefaultErrorMessage(
                        BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                    )
                );
                done();
            });
        });

        it("logoutRedirect throws", (done) => {
            stubbedPublicClientApplication.logoutRedirect().catch((e) => {
                expect(e.errorCode).toEqual(
                    BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                );
                expect(e.errorMessage).toEqual(
                    getDefaultErrorMessage(
                        BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                    )
                );
                done();
            });
        });

        it("logoutPopup throws", (done) => {
            stubbedPublicClientApplication.logoutPopup().catch((e) => {
                expect(e.errorCode).toEqual(
                    BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                );
                expect(e.errorMessage).toEqual(
                    getDefaultErrorMessage(
                        BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                    )
                );
                done();
            });
        });

        it("ssoSilent throws", (done) => {
            stubbedPublicClientApplication.ssoSilent({}).catch((e) => {
                expect(e.errorCode).toEqual(
                    BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                );
                expect(e.errorMessage).toEqual(
                    getDefaultErrorMessage(
                        BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                    )
                );
                done();
            });
        });

        it("getTokenCache throws", () => {
            try {
                stubbedPublicClientApplication.getTokenCache();
            } catch (e) {
                const browserAuthError = e as BrowserAuthError;
                expect(browserAuthError.errorCode).toEqual(
                    BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                );
                expect(browserAuthError.errorMessage).toEqual(
                    getDefaultErrorMessage(
                        BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                    )
                );
            }
        });

        it("getLogger throws", () => {
            try {
                stubbedPublicClientApplication.getLogger();
            } catch (e) {
                const browserAuthError = e as BrowserAuthError;
                expect(browserAuthError.errorCode).toEqual(
                    BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                );
                expect(browserAuthError.errorMessage).toEqual(
                    getDefaultErrorMessage(
                        BrowserConfigurationAuthErrorCodes.stubbedPublicClientApplicationCalled
                    )
                );
            }
        });
    });
});
