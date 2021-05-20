/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import { PopupUtils } from "../../src/utils/PopupUtils";
import { AccountInfo, AuthenticationScheme, Logger, LogLevel, ResponseMode } from "@azure/msal-common";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager";
import { TEST_CONFIG } from "./StringConstants";
import { BrowserCacheLocation } from "../../src";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { BrowserConstants, TemporaryCacheKeys } from "../../src/utils/BrowserConstants";

const cacheConfig = {
    cacheLocation: BrowserCacheLocation.SessionStorage,
    storeAuthStateInCookie: false,
    secureCookies: false
};

const loggerOptions = {
    loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
        if (containsPii) {
            console.log(`Log level: ${level} Message: ${message}`);
        }
    },
    piiLoggingEnabled: true
};
const testLogger = new Logger(loggerOptions);
const browserCrypto = new CryptoOps();

const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);

describe("PopupUtils Tests", () => {
    afterEach(() => {
        sinon.restore();
    });
    
    describe("openSizedPopup", () => {
        it("opens a popup with urlNavigate", () => {
            const windowOpenSpy = sinon.stub(window, "open");
            PopupUtils.openSizedPopup("http://localhost/", "popup");

            expect(windowOpenSpy.calledWith("http://localhost/", "popup")).toBe(true);
        });

        it("opens a popup with about:blank", () => {
            const windowOpenSpy = sinon.stub(window, "open");
            PopupUtils.openSizedPopup("about:blank", "popup");

            expect(windowOpenSpy.calledWith("about:blank", "popup")).toBe(true);
        });
    });

    describe("unloadWindow", () => {
        it("closes window and removes temporary cache", (done) => {
            browserStorage.setTemporaryCache(TemporaryCacheKeys.INTERACTION_STATUS_KEY, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE, true);
            const popupUtils = new PopupUtils(browserStorage, testLogger);
            const popupWindow: Window = {
                ...window,
                //@ts-ignore
                location: {
                    assign: () => {}
                },
                focus: () => {},
                close: () => {
                    expect(browserStorage.getTemporaryCache(TemporaryCacheKeys.INTERACTION_STATUS_KEY)).toBe(null);
                    done();
                }
            }
            popupUtils.openPopup("http://localhost", "name", popupWindow);
            popupUtils.unloadWindow(new Event("test"));
        });
    });

    describe("monitorPopupForSameOrigin", () => {
        it("throws if popup is closed", (done) => {
            const popup: Window = {
                //@ts-ignore
                location: {
                    href: "about:blank",
                    hash: ""
                },
                close: () => {},
                closed: false
            };
            const popupUtils = new PopupUtils(browserStorage, testLogger);
            popupUtils.monitorPopupForSameOrigin(popup)
                .catch((error) => {
                    expect(error.errorCode).toEqual("user_cancelled");
                    done();
                });

            setTimeout(() => {
                //@ts-ignore
                popup.closed = true;
            }, 50);
        });

        it("resolves when popup is same origin", (done) => {
            const popup: Window = {
                //@ts-ignore
                location: {
                    href: "about:blank",
                    hash: ""
                },
                close: () => {},
                closed: false
            };
            const popupUtils = new PopupUtils(browserStorage, testLogger);
            popupUtils.monitorPopupForSameOrigin(popup).then(() => {
                done();
            });

            setTimeout(() => {
                popup.location.href = "http://localhost";
            }, 50);
        });
    });

    describe("Static functions", () => {
        it("generatePopupName generates expected name", () => {
            const popupName = PopupUtils.generatePopupName("client-id", {
                scopes: [ "scope1", "scope2"],
                authority: "https://login.microsoftonline.com/common",
                correlationId: "correlation-id",
                redirectUri: "/home",
                authenticationScheme: AuthenticationScheme.BEARER,
                responseMode: ResponseMode.FRAGMENT,
                state: "state",
                nonce: "nonce"
            });

            expect(popupName).toEqual("msal.client-id.scope1-scope2.https://login.microsoftonline.com/common.correlation-id");
        });

        it(
            "generateLogoutPopupName generates expected name when account passed in",
            () => {
                const testAccount: AccountInfo = {
                    homeAccountId: "homeAccountId",
                    localAccountId: "localAccountId",
                    environment: "environment",
                    tenantId: "tenant",
                    username: "user"
                };
                const popupName = PopupUtils.generateLogoutPopupName("client-id", {
                    account: testAccount,
                    correlationId: "correlation-id"
                });

                expect(popupName).toEqual("msal.client-id.homeAccountId.correlation-id");
            }
        );

        it(
            "generateLogoutPopupName generates expected name when account not passed in",
            () => {
                const popupName = PopupUtils.generateLogoutPopupName("client-id", {
                    correlationId: "correlation-id"
                });

                expect(popupName).toEqual("msal.client-id.undefined.correlation-id");
            }
        );
    });
});
