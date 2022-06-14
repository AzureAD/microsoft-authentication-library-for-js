/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import { NavigationClient } from "../../src/navigation/NavigationClient";
import { TEST_URIS } from "../utils/StringConstants";

describe("NavigationClient.ts Unit Tests", () => {
    const navigationClient = new NavigationClient();

    const oldWindow: Window & typeof globalThis = window;
    afterEach(() => {
        window = oldWindow;
        sinon.restore();
    });

    describe("navigateInternal tests", () => {
        it(
            "navigateInternal() with noHistory false will call location.assign",
            (done) => {
                sinon.useFakeTimers();
                const oldWindowLocation = window.location;
                delete window.location;
                window.location = {
                    ...oldWindowLocation,
                    assign: function (url) {
                        expect(url).toBe(TEST_URIS.TEST_LOGOUT_URI);
                        done();
                    }
                };
                const windowAssignSpy = sinon.spy(window.location, "assign");
                navigationClient.navigateInternal(TEST_URIS.TEST_LOGOUT_URI, {timeout: 30000, noHistory: false, apiId: 0});
                expect(windowAssignSpy.calledOnce).toBe(true);
            }
        );
    
        it(
            "navigateInternal() with noHistory true will call location.replace",
            (done) => {
                sinon.useFakeTimers();
                const oldWindowLocation = window.location;
                delete window.location;
                window.location = {
                    ...oldWindowLocation,
                    replace: function (url) {
                        expect(url).toBe(TEST_URIS.TEST_LOGOUT_URI);
                        done();
                    }
                };
                const windowReplaceSpy = sinon.spy(window.location, "replace");
                navigationClient.navigateInternal(TEST_URIS.TEST_LOGOUT_URI, {timeout: 30000, noHistory: true, apiId: 0});
                expect(windowReplaceSpy.calledOnce).toBe(true);
            }
        );
    
        it(
            "navigateInternal() logs if navigation does not take place within 30 seconds",
            (done) => {
                const clock = sinon.useFakeTimers();
                const oldWindowLocation = window.location;
                delete window.location;
                window.location = {
                    ...oldWindowLocation,
                    replace: function (url) {
                        expect(url).toBe(TEST_URIS.TEST_LOGOUT_URI);
                        done();
                    }
                };

                const windowReplaceSpy = sinon.spy(window.location, "replace");
                navigationClient.navigateInternal(TEST_URIS.TEST_LOGOUT_URI, {timeout: 30000, noHistory: true, apiId: 0});
                expect(windowReplaceSpy.calledOnce).toBe(true);
                clock.next();
            }
        );
    });

    describe("navigateExternal tests", () => {
        it(
            "navigateExternal() with noHistory false will call location.assign",
            (done) => {
                sinon.useFakeTimers();
                const oldWindowLocation = window.location;
                delete window.location;
                window.location = {
                    ...oldWindowLocation,
                    assign: function (url) {
                        expect(url).toBe(TEST_URIS.TEST_LOGOUT_URI);
                        done();
                    }
                };
                const windowAssignSpy = sinon.spy(window.location, "assign");
                navigationClient.navigateExternal(TEST_URIS.TEST_LOGOUT_URI, {timeout: 30000, noHistory: false, apiId: 0});
                expect(windowAssignSpy.calledOnce).toBe(true);
            }
        );
    
        it(
            "navigateExternal() with noHistory true will call location.replace",
            (done) => {
                sinon.useFakeTimers();
                const oldWindowLocation = window.location;
                delete window.location;
                window.location = {
                    ...oldWindowLocation,
                    replace: function (url) {
                        expect(url).toBe(TEST_URIS.TEST_LOGOUT_URI);
                        done();
                    }
                };
                const windowReplaceSpy = sinon.spy(window.location, "replace");
                navigationClient.navigateExternal(TEST_URIS.TEST_LOGOUT_URI, {timeout: 30000, noHistory: true, apiId: 0});
                expect(windowReplaceSpy.calledOnce).toBe(true);
            }
        );
    
        it(
            "navigateExternal() logs if navigation does not take place within 30 seconds",
            (done) => {
                const clock = sinon.useFakeTimers();
                const oldWindowLocation = window.location;
                delete window.location;
                window.location = {
                    ...oldWindowLocation,
                    replace: function (url) {
                        expect(url).toBe(TEST_URIS.TEST_LOGOUT_URI);
                        done();
                    }
                };

                const windowReplaceSpy = sinon.spy(window.location, "replace");
                navigationClient.navigateExternal(TEST_URIS.TEST_LOGOUT_URI, {timeout: 30000, noHistory: true, apiId: 0});
                expect(windowReplaceSpy.calledOnce).toBe(true);
                clock.next();
            }
        );
    });
});
