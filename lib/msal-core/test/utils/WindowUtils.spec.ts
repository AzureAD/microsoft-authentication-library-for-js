import { WindowUtils } from "../../src/utils/WindowUtils";
import { FramePrefix, TemporaryCacheKeys, Constants } from "../../src/utils/Constants";
import { TEST_CONFIG } from "../TestConstants";
import { ClientAuthError } from "../../src/error/ClientAuthError";
import { Logger, UrlUtils } from "../../src";
import { BrowserStorage } from "../../src/cache/BrowserStorage";
import { RequestUtils } from "../../src/utils/RequestUtils";
import sinon from "sinon";
import { AuthCache } from "../../src/cache/AuthCache";

const logger = new Logger(() => {});

describe("WindowUtils", () => {
    describe("monitorIframeForHash", () => {
        it("times out", done => {
            const iframe = {
                contentWindow: {
                    // @ts-ignore
                    location: null // example of scenario that would never otherwise resolve
                }
            };

            // @ts-ignore
            WindowUtils.monitorIframeForHash(iframe.contentWindow, 500, "http://login.microsoftonline.com", logger)
                .catch((err: ClientAuthError) => {
                    done();
                });
        });

        it("times out when event loop is suspended", function(done) {
            const iframe = {
                contentWindow: {
                    location: {
                        href: "http://localhost",
                        hash: ""
                    }
                }
            };

            // @ts-ignore
            WindowUtils.monitorIframeForHash(iframe.contentWindow, 2000, "url", logger)
                .catch(() => {
                    done();
                });
                
            setTimeout(() => {
                iframe.contentWindow.location = {
                    href: "http://localhost/#/access_token=hello",
                    hash: "#access_token=hello"
                };
            }, 1600);

            /**
             * This code mimics the JS event loop being synchonously paused (e.g. tab suspension) midway through polling the iframe.
             * If the event loop is suspended for longer than the configured timeout,
             * the polling operation should throw an error for a timeout.
             */
            const startPauseDelay = 200;
            const pauseDuration = 3000;
            setTimeout(() => {
                Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, pauseDuration);
            }, startPauseDelay);
        }, 5000);

        it("returns hash", done => {
            const iframe = {
                contentWindow: {
                    location: {
                        href: "http://localhost",
                        hash: ""
                    }
                }
            };

            // @ts-ignore
            WindowUtils.monitorIframeForHash(iframe.contentWindow, 1000, "url", logger)
                .then((hash: string) => {
                    expect(hash).toBe("#access_token=hello");
                    done();
                });

            setTimeout(() => {
                iframe.contentWindow.location = {
                    href: "http://localhost/#/access_token=hello",
                    hash: "#access_token=hello"
                };
            }, 500);
        });
    });

    describe("monitorPopupForHash", () => {
        it("times out", done => {
            const popup = {
                contentWindow: {
                    location: {
                        href: "http://localhost",
                        hash: ""
                    }
                }
            };

            // @ts-ignore
            WindowUtils.monitorPopupForHash(popup.contentWindow, 500, "url", logger)
                .catch((err: ClientAuthError) => {
                    done();
                });
        });

        it("returns hash", done => {
            const popup = {
                contentWindow: {
                    location: {
                        href: "http://localhost",
                        hash: ""
                    },
                    history: {
                        replaceState: () => { return }
                    }
                }
            };

            // @ts-ignore
            WindowUtils.monitorPopupForHash(popup.contentWindow, 1000, "url", logger)
                .then((hash: string) => {
                    expect(hash).toBe("#access_token=hello");
                    done();
                });

            setTimeout(() => {
                popup.contentWindow.location = {
                    href: "http://localhost/#/access_token=hello",
                    hash: "#access_token=hello"
                };
            }, 500);
        });

        it("closed", done => {
            const popup = {
                contentWindow: {
                    location: {
                        href: "http://localhost",
                        hash: ""
                    },
                    closed: false
                }
            };

            // @ts-ignore
            WindowUtils.monitorPopupForHash(popup.contentWindow, 1000, "url", logger)
                .catch((error: ClientAuthError) => {
                    expect(error.errorCode).toBe('user_cancelled');
                    done();
                });

            setTimeout(() => {
                popup.contentWindow.closed = true;
            }, 500);
        });
    });

    describe("generateFrameName", () => {
        it("test idToken frame name created", () => {
            const scopes = ["s1", "s2", "s3"];
            const authority = TEST_CONFIG.validAuthority;
            const requestSignature = `${scopes.join(" ").toLowerCase()}|${authority}`;

            const idTokenFrameName = WindowUtils.generateFrameName(FramePrefix.ID_TOKEN_FRAME, requestSignature);
            const tokenFrameName = WindowUtils.generateFrameName(FramePrefix.TOKEN_FRAME, requestSignature);

            expect(idTokenFrameName).toBe(`${FramePrefix.ID_TOKEN_FRAME}|s1 s2 s3|${TEST_CONFIG.validAuthority}`);
            expect(tokenFrameName).toBe(`${FramePrefix.TOKEN_FRAME}|s1 s2 s3|${TEST_CONFIG.validAuthority}`);
        });
    });

    describe("loadFrameSync", () => {
        it("loads iframe using addHiddenIFrame", () => {
            const logger = new Logger(() => {});
            const iframe = WindowUtils.loadFrameSync("https://test1.com/", "testFrame", logger);

            expect(iframe.getAttribute("id")).toBe("testFrame");
        });

        it("sets src for iframe", () => {
            const logger = new Logger(() => {});
            const iframe = WindowUtils.loadFrameSync("https://test2.com/", "testFrame2", logger);

            expect(iframe.src).toBe("https://test2.com/");
        });
    });

    describe("addHiddenIFrame", () => {
        it("returns null if iframeId is undefined", () => {
            const iframe = WindowUtils.addHiddenIFrame(undefined, null);
            expect(iframe).toBe(null);
        });

        it("creates and returns an iframe with expected attributes", () => {
            const logger = new Logger(() => {});
            const iframe = WindowUtils.addHiddenIFrame("testIframe", logger);

            expect(iframe.getAttribute("id")).toBe("testIframe");
            expect(iframe.getAttribute("aria-hidden")).toBe("true");
            expect(iframe.getAttribute("sandbox")).toBe("allow-scripts allow-same-origin allow-forms");
            expect(iframe.style.visibility).toBe("hidden");
            expect(iframe.style.position).toBe("absolute");
            expect(iframe.style.width).toBe("0px");
            expect(iframe.style.border).toBe("0px");
        });

        it("sets iframeId if window.frames exists", () => {
            const logger = new Logger(() => {});
            const iframe = WindowUtils.addHiddenIFrame("testId", logger);

            expect(iframe).toBe(window.frames["testId"]);
        });
    });

    describe("checkIfBackButtonIsPressed", () => {
        const cacheStorage = new AuthCache(TEST_CONFIG.MSAL_CLIENT_ID, "sessionStorage", true);

        afterEach(() => {
            sinon.restore();
            cacheStorage.clear();
        });

        it("clears temp cache items if back button pressed, no user state", () => {
            const requestState = RequestUtils.validateAndGenerateState(null, "redirectInteraction")
            cacheStorage.setItem(TemporaryCacheKeys.REDIRECT_REQUEST, `${Constants.inProgress}${Constants.resourceDelimiter}${requestState}`);

            const resetTempCacheSpy = sinon.spy(cacheStorage, "resetTempCacheItems");
            sinon.stub(UrlUtils, "urlContainsHash").returns(false);

            WindowUtils.checkIfBackButtonIsPressed(cacheStorage);
            expect(resetTempCacheSpy.calledOnce).toBe(true);
            expect(resetTempCacheSpy.calledWith(requestState)).toBe(true);
        });

        it("clears temp cache items if back button pressed, user state provided", () => {
            const requestState = RequestUtils.validateAndGenerateState("testUserState", "redirectInteraction")
            cacheStorage.setItem(TemporaryCacheKeys.REDIRECT_REQUEST, `${Constants.inProgress}${Constants.resourceDelimiter}${requestState}`);

            const resetTempCacheSpy = sinon.spy(cacheStorage, "resetTempCacheItems");
            sinon.stub(UrlUtils, "urlContainsHash").returns(false);

            WindowUtils.checkIfBackButtonIsPressed(cacheStorage);
            expect(resetTempCacheSpy.calledOnce).toBe(true);
            expect(resetTempCacheSpy.calledWith(requestState)).toBe(true);
        });

        it("does not clear temp cache if redirect request is not cached", () => {
            const resetTempCacheSpy = sinon.spy(cacheStorage, "resetTempCacheItems");
            sinon.stub(UrlUtils, "urlContainsHash").returns(false);

            WindowUtils.checkIfBackButtonIsPressed(cacheStorage);
            expect(resetTempCacheSpy.notCalled).toBe(true);
        });

        it("does not clear temp cache if hash in the current url", () => {
            const requestState = RequestUtils.validateAndGenerateState("testUserState", "redirectInteraction");
            cacheStorage.setItem(TemporaryCacheKeys.REDIRECT_REQUEST, `${Constants.inProgress}${Constants.resourceDelimiter}${requestState}`);

            const resetTempCacheSpy = sinon.spy(cacheStorage, "resetTempCacheItems");
            sinon.stub(UrlUtils, "urlContainsHash").returns(true);

            WindowUtils.checkIfBackButtonIsPressed(cacheStorage);
            expect(resetTempCacheSpy.notCalled).toBe(true);
        });
    });

    describe("clearUrlFragment", () => {
        it("clearHash() clears the window hash", () => {
            window.location.hash = "thisIsAHash";
            WindowUtils.clearUrlFragment(window);
            expect(window.location.href.includes("#thisIsAHash")).toBe(false);
        });
    
        it("clearHash() clears the window hash (office addin)", () => {
            // Office.js sets replaceState to null: https://github.com/OfficeDev/office-js/issues/429
            const oldReplaceState = history.replaceState;
            history.replaceState = null;
    
            window.location.hash = "thisIsAHash";
            WindowUtils.clearUrlFragment(window);
            expect(window.location.href.includes("#thisIsAHash")).toBe(false);
            
            history.replaceState = oldReplaceState;
        });
    });
});
